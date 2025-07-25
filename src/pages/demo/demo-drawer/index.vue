<script lang="ts" setup>
import type { ElMessageBoxOptions } from "element-plus"
import type { VxeFormInstance, VxeFormProps, VxeGridInstance, VxeGridProps } from "vxe-table"
import { createDemoApi, deleteDemoApi, getDemoListApi, updateDemoApi } from "../apis"

defineOptions({
  name: "DemoDrawer"
})

// #region vxe-grid
interface RowMeta {
  id: number
  name: string
  user_id: number
  created_at: string
  updated_at: string
  /** vxe-table 自动添加上去的属性 */
  _VXE_ID?: string
}

const xGridDom = useTemplateRef<VxeGridInstance>("xGridDom")

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
            placeholder: "名称",
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
      title: "名称"
    },
    {
      field: "user_id",
      title: "用户ID",
      width: "100px"
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
      width: "150px",
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
            ...(form.name && { name: form.name })
          }
          // 调用接口
          getDemoListApi(params).then(callback).catch(callback)
        })
      }
    }
  }
})
// #endregion

// #region drawer
const drawerVisible = ref(false)
const drawerTitle = ref("")
// #endregion

// #region vxe-form
const xFormDom = useTemplateRef<VxeFormInstance>("xFormDom")

const xFormOpt: VxeFormProps = reactive({
  span: 24,
  titleWidth: "80px",
  loading: false,
  /** 是否显示标题冒号 */
  titleColon: false,
  /** 表单数据 */
  data: {
    name: ""
  },
  /** 项列表 */
  items: [
    {
      field: "name",
      title: "名称",
      itemRender: {
        name: "$input",
        props: {
          placeholder: "请输入名称"
        }
      }
    }
  ],
  /** 校验规则 */
  rules: {
    name: [
      {
        required: true,
        validator: ({ itemValue }) => {
          switch (true) {
            case !itemValue:
              return new Error("请输入名称")
            case !itemValue.trim():
              return new Error("名称不能为空格")
            case itemValue.trim().length > 255:
              return new Error("名称长度不能超过255个字符")
          }
        }
      }
    ]
  }
})
// #endregion

// #region 增删改查
const crudStore = reactive({
  /** 表单类型，true 表示修改，false 表示新增 */
  isUpdate: true,
  /** 当前编辑的行数据 */
  currentRow: null as RowMeta | null,
  /** 加载表格数据 */
  commitQuery: () => xGridDom.value?.commitProxy("query"),
  /** 清空表格数据 */
  clearTable: () => xGridDom.value?.reloadData([]),
  /** 点击显示抽屉 */
  onShowDrawer: (row?: RowMeta) => {
    if (row) {
      crudStore.isUpdate = true
      crudStore.currentRow = row
      drawerTitle.value = "修改Demo"
      // 赋值
      xFormOpt.data.name = row.name
    } else {
      crudStore.isUpdate = false
      crudStore.currentRow = null
      drawerTitle.value = "新增Demo"
    }
    drawerVisible.value = true
    nextTick(() => {
      !crudStore.isUpdate && xFormDom.value?.reset()
      xFormDom.value?.clearValidate()
    })
  },
  /** 关闭抽屉 */
  onCloseDrawer: () => {
    drawerVisible.value = false
    xFormDom.value?.clearValidate()
  },
  /** 确定并保存 */
  onSubmitForm: () => {
    if (xFormOpt.loading) return
    xFormDom.value?.validate((errMap) => {
      if (errMap) return
      xFormOpt.loading = true
      const callback = () => {
        xFormOpt.loading = false
        drawerVisible.value = false
        ElMessage.success("操作成功")
        !crudStore.isUpdate && crudStore.afterInsert()
        crudStore.commitQuery()
      }
      const errorCallback = (error: any) => {
        xFormOpt.loading = false
        ElMessage.error(error?.message || "操作失败")
      }

      if (crudStore.isUpdate && crudStore.currentRow) {
        // 调用修改接口
        updateDemoApi(crudStore.currentRow.id, {
          name: xFormOpt.data.name
        }).then(callback).catch(errorCallback)
      } else {
        // 调用新增接口
        createDemoApi({
          name: xFormOpt.data.name
        }).then(callback).catch(errorCallback)
      }
    })
  },
  /** 新增后是否跳入最后一页 */
  afterInsert: () => {
    const pager = xGridDom.value?.getProxyInfo()?.pager
    if (pager) {
      const currentTotal = pager.currentPage * pager.pageSize
      if (currentTotal === pager.total) {
        ++pager.currentPage
      }
    }
  },
  /** 删除 */
  onDelete: (row: RowMeta) => {
    const tip = `确定 <strong style="color: var(--el-color-danger);"> 删除 </strong> Demo <strong style="color: var(--el-color-primary);"> ${row.name} </strong> ？`
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
      deleteDemoApi(row.id).then(() => {
        ElMessage.success("删除成功")
        crudStore.afterDelete()
        crudStore.commitQuery()
      }).catch((error) => {
        ElMessage.error(error?.message || "删除失败")
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
// #endregion
</script>

<template>
  <div class="app-container">
    <el-alert
      title="Demo 管理 (抽屉模式)"
      type="info"
      description="这是一个使用抽屉形式进行新增和编辑的 Demo 示例，提供更宽敞的编辑空间"
      show-icon
    />
    <!-- 表格 -->
    <vxe-grid ref="xGridDom" v-bind="xGridOpt">
      <!-- 左侧按钮列表 -->
      <template #toolbar-btns>
        <vxe-button status="primary" icon="vxe-icon-add" @click="crudStore.onShowDrawer()">
          新增Demo
        </vxe-button>
        <vxe-button status="danger" icon="vxe-icon-delete">
          批量删除
        </vxe-button>
      </template>
      <!-- 操作 -->
      <template #row-operate="{ row }">
        <el-button link type="primary" @click="crudStore.onShowDrawer(row)">
          修改
        </el-button>
        <el-button link type="danger" @click="crudStore.onDelete(row)">
          删除
        </el-button>
      </template>
    </vxe-grid>

    <!-- 抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      :header="drawerTitle"
      direction="rtl"
      size="500px"
      :show-close="false"
      :close-on-click-modal="false"
      :before-close="crudStore.onCloseDrawer"
    >
      <template #header>
        <div class="drawer-header">
          <span>{{ drawerTitle }}</span>
          <div class="drawer-actions">
            <el-button @click="crudStore.onCloseDrawer">
              取消
            </el-button>
            <el-button
              type="primary"
              :loading="xFormOpt.loading"
              @click="crudStore.onSubmitForm"
            >
              确定
            </el-button>
          </div>
        </div>
      </template>
      <template #default>
        <div>
          <!-- 表单 -->
          <vxe-form ref="xFormDom" v-bind="xFormOpt" />
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<style lang="scss" scoped>
.el-alert {
  margin-bottom: 20px;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  position: relative;
}

.drawer-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: -20px;
  right: -20px;
  height: 1px;
  background-color: var(--el-border-color-light);
}

.drawer-actions {
  display: flex;
  gap: 12px;
}

/* 重置 Element Plus 抽屉头部默认样式 */
:deep(.el-drawer__header) {
  margin-bottom: 0;
}
</style>
