<script lang="ts" setup>
import type { ElMessageBoxOptions } from "element-plus"
import type { VxeGridInstance, VxeGridProps } from "vxe-table"
import { onActivated } from "vue"
import { useRouter } from "vue-router"
import { batchDeleteXunProjectApi, deleteXunProjectApi, getXunProjectListApi } from "./apis"

defineOptions({
  name: "XunClipProjectList"
})

const router = useRouter()

// #region vxe-grid
interface RowMeta {
  id: number
  user_id: number
  title: string
  content: string
  aspect: string
  created_at: string
  updated_at: string
  _VXE_ID?: string
}

const aspectMap: Record<string, string> = {
  "16:9": "横屏 16:9",
  "9:16": "竖屏 9:16",
  "1:1": "方形 1:1"
}

const xGridDom = useTemplateRef<VxeGridInstance>("xGridDom")

const xGridOpt: VxeGridProps = reactive({
  loading: true,
  autoResize: true,
  pagerConfig: {
    align: "right"
  },
  formConfig: {
    items: [
      {
        field: "title",
        itemRender: {
          name: "VxeInput",
          props: {
            placeholder: "工程标题",
            clearable: true
          }
        }
      },
      {
        itemRender: {
          name: "VxeButtonGroup",
          options: [
            {
              type: "submit",
              content: "查询",
              status: "primary",
              icon: "vxe-icon-search"
            },
            {
              type: "reset",
              content: "重置",
              icon: "vxe-icon-refresh"
            }
          ]
        }
      }
    ]
  },
  toolbarConfig: {
    refresh: true,
    custom: true,
    slots: {
      buttons: "toolbar-btns"
    }
  },
  columns: [
    {
      type: "checkbox",
      width: "50px"
    },
    {
      field: "id",
      title: "ID",
      width: "80px"
    },
    {
      field: "title",
      title: "工程标题",
      minWidth: "200px"
    },
    {
      field: "aspect",
      title: "画面比例",
      width: "120px",
      slots: {
        default: "aspect-slot"
      }
    },
    {
      field: "created_at",
      title: "创建时间",
      width: "180px"
    },
    {
      field: "updated_at",
      title: "更新时间",
      width: "180px"
    },
    {
      title: "操作",
      width: "160px",
      fixed: "right",
      showOverflow: false,
      slots: {
        default: "row-operate"
      }
    }
  ],
  proxyConfig: {
    seq: true,
    form: true,
    autoLoad: true,
    props: {
      total: "total"
    },
    ajax: {
      query: ({ page, form }) => {
        xGridOpt.loading = true
        crudStore.clearTable()
        return new Promise((resolve) => {
          let total = 0
          let result: RowMeta[] = []
          const callback = (res: any) => {
            if (res?.data) {
              total = res.data.paging.total_count
              result = res.data.items
            }
            xGridOpt.loading = false
            resolve({ total, result })
          }
          const params = {
            page: page.currentPage,
            per_page: page.pageSize,
            ...(form.title && { title: form.title })
          }
          getXunProjectListApi(params).then(callback).catch(callback)
        })
      }
    }
  }
})
// #endregion

// #region 增删改查
const crudStore = reactive({
  commitQuery: () => xGridDom.value?.commitProxy("query"),
  clearTable: () => xGridDom.value?.reloadData([]),
  onCreate: () => {
    router.push({ name: "XunClipSubmit" })
  },
  onEdit: (row: RowMeta) => {
    router.push({ name: "XunClipSubmit", query: { id: row.id } })
  },
  onDelete: (row: RowMeta) => {
    const tip = `确定 <strong style="color: var(--el-color-danger);"> 删除 </strong> 工程 <strong style="color: var(--el-color-primary);"> ${row.title} </strong> ？`
    const config: ElMessageBoxOptions = {
      type: "warning",
      showClose: true,
      closeOnClickModal: true,
      closeOnPressEscape: true,
      cancelButtonText: "取消",
      confirmButtonText: "确定",
      dangerouslyUseHTMLString: true
    }
    ElMessageBox.confirm(tip, "提示", config).then(() => {
      deleteXunProjectApi(row.id).then(() => {
        ElMessage.success("删除成功")
        crudStore.afterDelete()
        crudStore.commitQuery()
      })
    })
  },
  onBatchDelete: () => {
    const checkedRows = xGridDom.value?.getCheckboxRecords() as RowMeta[]
    if (!checkedRows || checkedRows.length === 0) {
      ElMessage.warning("请选择要删除的数据")
      return
    }
    const names = checkedRows.map(row => row.title).join("、")
    const tip = `确定 <strong style="color: var(--el-color-danger);"> 批量删除 </strong> 以下工程：<strong style="color: var(--el-color-primary);"> ${names} </strong> ？`
    const config: ElMessageBoxOptions = {
      type: "warning",
      showClose: true,
      closeOnClickModal: true,
      closeOnPressEscape: true,
      cancelButtonText: "取消",
      confirmButtonText: "确定",
      dangerouslyUseHTMLString: true
    }
    ElMessageBox.confirm(tip, "提示", config).then(() => {
      const ids = checkedRows.map(row => row.id)
      batchDeleteXunProjectApi({ ids }).then(() => {
        ElMessage.success(`成功删除 ${checkedRows.length} 条数据`)
        crudStore.afterDelete()
        crudStore.commitQuery()
        xGridDom.value?.clearCheckboxRow()
      })
    })
  },
  afterDelete: () => {
    const tableData: RowMeta[] = xGridDom.value!.getData()
    const pager = xGridDom.value?.getProxyInfo()?.pager
    if (pager && pager.currentPage > 1 && tableData.length === 1) {
      --pager.currentPage
    }
  }
})

onActivated(() => {
  crudStore.commitQuery()
})
// #endregion
</script>

<template>
  <div class="app-container">
    <vxe-grid ref="xGridDom" v-bind="xGridOpt">
      <template #toolbar-btns>
        <el-button type="primary" @click="crudStore.onCreate()">
          新建工程
        </el-button>
        <vxe-button status="danger" icon="vxe-icon-delete" @click="crudStore.onBatchDelete()">
          批量删除
        </vxe-button>
      </template>
      <template #aspect-slot="{ row }">
        <el-tag>{{ aspectMap[row.aspect] || row.aspect }}</el-tag>
      </template>
      <template #row-operate="{ row }">
        <el-button link type="primary" @click="crudStore.onEdit(row)">
          编辑
        </el-button>
        <el-button link type="danger" @click="crudStore.onDelete(row)">
          删除
        </el-button>
      </template>
    </vxe-grid>
  </div>
</template>
