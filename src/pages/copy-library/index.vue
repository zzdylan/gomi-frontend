<script lang="ts" setup>
import type { ElMessageBoxOptions } from "element-plus"
import type { VxeGridInstance, VxeGridProps } from "vxe-table"
import { ArrowDown } from "@element-plus/icons-vue"
import { onActivated } from "vue"
import { useRouter } from "vue-router"
import { batchDeleteCopyLibraryApi, deleteCopyLibraryApi, getCopyLibraryListApi } from "./apis"

defineOptions({
  name: "CopyLibraryList"
})

const router = useRouter()

// #region vxe-grid
interface RowMeta {
  id: number
  user_id: number
  name: string
  type: number
  content: string
  status: number
  is_hot: number
  msg?: string
  created_at: string
  updated_at: string
  /** vxe-table 自动添加上去的属性 */
  _VXE_ID?: string
}

const xGridDom = useTemplateRef<VxeGridInstance>("xGridDom")

// 类型映射
const typeMap: Record<number, string> = {
  1: "组合文案",
  2: "智能文案",
  3: "爆款解说"
}

// 状态映射
const statusMap: Record<number, { text: string, type: "success" | "warning" | "info" | "danger" }> = {
  0: { text: "未开始", type: "info" },
  1: { text: "生成中", type: "warning" },
  2: { text: "已完成", type: "success" },
  3: { text: "失败", type: "danger" }
}

const xGridOpt: VxeGridProps = reactive({
  loading: true,
  autoResize: true,
  /** 分页配置项 */
  pagerConfig: {
    align: "right"
  },
  /** 表单配置项 */
  formConfig: {
    items: [
      {
        field: "name",
        itemRender: {
          name: "VxeInput",
          props: {
            placeholder: "文案库名称",
            clearable: true
          }
        }
      },
      {
        field: "type",
        itemRender: {
          name: "VxeSelect",
          props: {
            placeholder: "文案类型",
            clearable: true
          },
          options: [
            { label: "组合文案", value: 1 },
            { label: "智能文案", value: 2 },
            { label: "爆款解说", value: 3 }
          ]
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
  /** 工具栏配置 */
  toolbarConfig: {
    refresh: true,
    custom: true,
    slots: {
      buttons: "toolbar-btns"
    }
  },
  /** 自定义列配置项 */
  customConfig: {
    /** 是否允许列选中  */
    checkMethod: ({ column }) => !["name"].includes(column.field)
  },
  /** 列配置 */
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
      field: "name",
      title: "文案库名称",
      minWidth: "200px"
    },
    {
      field: "type",
      title: "类型",
      width: "120px",
      slots: {
        default: "type-slot"
      }
    },
    {
      field: "status",
      title: "状态",
      width: "150px",
      slots: {
        default: "status-slot"
      }
    },
    {
      field: "is_hot",
      title: "爆款",
      width: "80px",
      slots: {
        default: "hot-slot"
      }
    },
    {
      field: "created_at",
      title: "创建时间",
      width: "180px"
    },
    {
      title: "操作",
      width: "200px",
      fixed: "right",
      showOverflow: false,
      slots: {
        default: "row-operate"
      }
    }
  ],
  /** 数据代理配置项（基于 Promise API） */
  proxyConfig: {
    /** 启用动态序号代理 */
    seq: true,
    /** 是否代理表单 */
    form: true,
    /** 是否自动加载，默认为 true */
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
          // 加载数据
          const callback = (res: any) => {
            if (res?.data) {
              // 总数
              total = res.data.pager.total_count
              // 列表数据
              result = res.data.items
            }
            xGridOpt.loading = false
            // 返回值有格式要求，详情见 vxe-table 官方文档
            resolve({ total, result })
          }
          // 接口需要的参数
          const params = {
            page: page.currentPage,
            per_page: page.pageSize,
            ...(form.name && { name: form.name }),
            ...(form.type && { type: form.type })
          }
          // 调用接口
          getCopyLibraryListApi(params).then(callback).catch(callback)
        })
      }
    }
  }
})
// #endregion

// #region 增删改查
const crudStore = reactive({
  /** 加载表格数据 */
  commitQuery: () => xGridDom.value?.commitProxy("query"),
  /** 清空表格数据 */
  clearTable: () => xGridDom.value?.reloadData([]),
  /** 创建组合文案 */
  goToCombine: () => {
    router.push("/copy-library/combine")
  },
  /** 创建智能文案 */
  goToSmart: () => {
    router.push("/copy-library/smart")
  },
  /** 查看词条 */
  onViewWords: (row: RowMeta) => {
    // 根据类型跳转到不同页面
    if (row.type === 1) {
      // 组合文案
      router.push(`/copy-library/combine?id=${row.id}`)
    } else if (row.type === 2) {
      // 智能文案
      router.push(`/copy-library/smart?id=${row.id}`)
    } else {
      ElMessage.warning("未知的文案库类型")
    }
  },
  /** 删除 */
  onDelete: (row: RowMeta) => {
    const tip = `确定 <strong style="color: var(--el-color-danger);"> 删除 </strong> 文案库 <strong style="color: var(--el-color-primary);"> ${row.name} </strong> ？`
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
      deleteCopyLibraryApi(row.id).then(() => {
        ElMessage.success("删除成功")
        crudStore.afterDelete()
        crudStore.commitQuery()
      })
    })
  },
  /** 批量删除 */
  onBatchDelete: () => {
    const checkedRows = xGridDom.value?.getCheckboxRecords() as RowMeta[]
    if (!checkedRows || checkedRows.length === 0) {
      ElMessage.warning("请选择要删除的数据")
      return
    }

    const names = checkedRows.map(row => row.name).join("、")
    const tip = `确定 <strong style="color: var(--el-color-danger);"> 批量删除 </strong> 以下文案库：<strong style="color: var(--el-color-primary);"> ${names} </strong> ？`
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
      batchDeleteCopyLibraryApi({ ids }).then(() => {
        ElMessage.success(`成功删除 ${checkedRows.length} 条数据`)
        crudStore.afterDelete()
        crudStore.commitQuery()
        // 清空选择
        xGridDom.value?.clearCheckboxRow()
      })
    })
  },
  /** 删除后是否返回上一页 */
  afterDelete: () => {
    const tableData: RowMeta[] = xGridDom.value!.getData()
    const pager = xGridDom.value?.getProxyInfo()?.pager
    if (pager && pager.currentPage > 1 && tableData.length === 1) {
      --pager.currentPage
    }
  }
})

// 当页面被激活时（从 keepAlive 缓存中恢复）刷新数据
onActivated(() => {
  crudStore.commitQuery()
})
// #endregion
</script>

<template>
  <div class="app-container">
    <!-- 表格 -->
    <vxe-grid ref="xGridDom" v-bind="xGridOpt">
      <!-- 左侧按钮列表 -->
      <template #toolbar-btns>
        <el-dropdown>
          <el-button type="primary">
            创建文案
            <el-icon class="el-icon--right">
              <ArrowDown />
            </el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="crudStore.goToCombine()">
                组合文案
              </el-dropdown-item>
              <el-dropdown-item @click="crudStore.goToSmart()">
                智能文案
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <vxe-button status="danger" icon="vxe-icon-delete" @click="crudStore.onBatchDelete()">
          批量删除
        </vxe-button>
      </template>
      <!-- 类型 -->
      <template #type-slot="{ row }">
        <el-tag>{{ typeMap[row.type] || "未知" }}</el-tag>
      </template>
      <!-- 状态 -->
      <template #status-slot="{ row }">
        <el-tag :type="statusMap[row.status]?.type || 'info'">
          {{ statusMap[row.status]?.text || "未知" }}
          <span v-if="row.status === 1 && row.total_words > 0">
            ({{ row.completed_words }}/{{ row.total_words }})
          </span>
        </el-tag>
      </template>
      <!-- 爆款 -->
      <template #hot-slot="{ row }">
        <el-tag v-if="row.is_hot === 1" type="danger" effect="dark">
          爆款
        </el-tag>
        <span v-else>-</span>
      </template>
      <!-- 操作 -->
      <template #row-operate="{ row }">
        <el-button link type="primary" @click="crudStore.onViewWords(row)">
          查看词条
        </el-button>
        <el-button link type="danger" @click="crudStore.onDelete(row)">
          删除
        </el-button>
      </template>
    </vxe-grid>
  </div>
</template>
