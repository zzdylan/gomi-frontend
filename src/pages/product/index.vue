<script lang="ts" setup>
import type { ElMessageBoxOptions } from "element-plus"
import type { VxeFormInstance, VxeFormProps, VxeGridInstance, VxeGridProps } from "vxe-table"
import { batchDeleteProductApi, createProductApi, deleteProductApi, getProductListApi, updateProductApi } from "./apis"

defineOptions({
  name: "ProductManagement"
})

// #region 常量定义
const PRODUCT_STATUS_OPTIONS = [
  { label: "停用", value: 0 },
  { label: "启用", value: 1 }
]

function getProductStatusLabel(status: number) {
  return PRODUCT_STATUS_OPTIONS.find(item => item.value === status)?.label || "未知"
}

function getProductStatusType(status: number) {
  return status === 1 ? "success" : "info"
}
// #endregion

// #region vxe-grid
interface RowMeta {
  id: string
  name: string
  code: string
  description: string
  sort: number
  status: number
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
            placeholder: "产品名称",
            clearable: true
          }
        }
      },
      {
        field: "status",
        itemRender: {
          name: "VxeSelect",
          options: PRODUCT_STATUS_OPTIONS,
          props: {
            placeholder: "状态",
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
    checkMethod: ({ column }) => !["name", "code"].includes(column.field)
  },
  /** 列配置 */
  columns: [
    {
      type: "checkbox",
      width: 50
    },
    {
      field: "name",
      title: "产品名称",
      minWidth: 150
    },
    {
      field: "code",
      title: "产品编码",
      minWidth: 150
    },
    {
      field: "description",
      title: "描述",
      minWidth: 200
    },
    {
      field: "sort",
      title: "排序",
      width: 80
    },
    {
      field: "status",
      title: "状态",
      width: 100,
      slots: {
        default: "status-slot"
      }
    },
    {
      field: "created_at",
      title: "创建时间",
      width: 180,
      sortable: true
    },
    {
      title: "操作",
      width: 200,
      fixed: "right",
      showOverflow: false,
      slots: {
        default: "action-slot"
      }
    }
  ],
  /** 数据代理配置项 */
  proxyConfig: {
    form: true,
    props: {
      result: "data.items",
      total: "data.pager.total_count"
    },
    ajax: {
      query: async ({ page, form }) => {
        xGridOpt.loading = true
        return getProductListApi({
          page: page.currentPage,
          per_page: page.pageSize,
          ...form
        })
          .then((res) => {
            return res
          })
          .finally(() => {
            xGridOpt.loading = false
          })
      }
    }
  },
  checkboxConfig: {
    reserve: true
  }
})
// #endregion

// #region Drawer 相关
const drawerVisible = ref(false)
const drawerLoading = ref(false)
const drawerTitle = ref("")
const currentFormType = ref<"create" | "update">("create")
const currentRowId = ref("")

const xFormDom = useTemplateRef<VxeFormInstance>("xFormDom")

interface FormData {
  name: string
  code: string
  description: string
  sort: number
  status: number
}

const formData = reactive<FormData>({
  name: "",
  code: "",
  description: "",
  sort: 0,
  status: 1
})

const xFormOpt = reactive<VxeFormProps>({
  titleWidth: "100px",
  titleAlign: "right",
  items: [
    {
      field: "name",
      title: "产品名称",
      span: 24,
      itemRender: {
        name: "VxeInput",
        props: {
          placeholder: "请输入产品名称"
        }
      }
    },
    {
      field: "code",
      title: "产品编码",
      span: 24,
      itemRender: {
        name: "VxeInput",
        props: {
          placeholder: "请输入产品编码（字母、数字、下划线）"
        }
      }
    },
    {
      field: "description",
      title: "产品描述",
      span: 24,
      itemRender: {
        name: "VxeTextarea",
        props: {
          placeholder: "请输入产品描述",
          rows: 3
        }
      }
    },
    {
      field: "sort",
      title: "排序",
      span: 24,
      itemRender: {
        name: "VxeInput",
        props: {
          type: "integer",
          placeholder: "排序值，越大越靠前",
          min: 0
        }
      }
    },
    {
      field: "status",
      title: "状态",
      span: 24,
      itemRender: {
        name: "VxeSelect",
        options: PRODUCT_STATUS_OPTIONS,
        props: {
          placeholder: "请选择状态"
        }
      }
    },
    {
      align: "right",
      span: 24,
      itemRender: {
        name: "VxeButtonGroup",
        options: [
          {
            type: "submit",
            content: "提交",
            status: "primary"
          },
          {
            type: "reset",
            content: "重置"
          }
        ]
      }
    }
  ],
  rules: {
    name: [{ required: true, message: "请输入产品名称" }],
    code: [
      { required: true, message: "请输入产品编码" },
      { pattern: /^[\w-]+$/, message: "只能包含字母、数字、下划线和破折号" }
    ]
  },
  data: formData
})

function resetForm() {
  Object.assign(formData, {
    name: "",
    code: "",
    description: "",
    sort: 0,
    status: 1
  })
}

function openDrawer(type: "create" | "update", row?: RowMeta) {
  currentFormType.value = type
  if (type === "create") {
    drawerTitle.value = "新增产品"
    resetForm()
  } else if (type === "update" && row) {
    drawerTitle.value = "编辑产品"
    currentRowId.value = row.id
    Object.assign(formData, {
      name: row.name,
      code: row.code,
      description: row.description,
      sort: row.sort,
      status: row.status
    })
  }
  drawerVisible.value = true
}

function closeDrawer() {
  drawerVisible.value = false
  resetForm()
}

async function submitForm() {
  const $form = xFormDom.value
  if (!$form) return

  const errMap = await $form.validate()
  if (errMap) {
    ElMessage.warning("请填写完整信息")
    return
  }

  drawerLoading.value = true

  try {
    if (currentFormType.value === "create") {
      await createProductApi(formData)
      ElMessage.success("创建成功")
    } else {
      await updateProductApi(currentRowId.value, formData)
      ElMessage.success("更新成功")
    }

    closeDrawer()
    xGridDom.value?.commitProxy("query")
  } catch (error) {
    console.error(error)
  } finally {
    drawerLoading.value = false
  }
}
// #endregion

// #region 操作
function handleCreate() {
  openDrawer("create")
}

function handleUpdate(row: RowMeta) {
  openDrawer("update", row)
}

function handleDelete(row: RowMeta) {
  const options: ElMessageBoxOptions = {
    title: "删除确认",
    message: h("p", null, [
      h("span", null, "确定删除产品 "),
      h("b", { style: "color: var(--el-color-danger)" }, row.name),
      h("span", null, " 吗？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }

  ElMessageBox.confirm(options.message!, options.title, options)
    .then(async () => {
      await deleteProductApi(row.id)
      ElMessage.success("删除成功")
      xGridDom.value?.commitProxy("query")
    })
    .catch(() => {
      ElMessage.info("已取消删除")
    })
}

function handleBatchDelete() {
  const $grid = xGridDom.value
  if (!$grid) return

  const selectRecords = $grid.getCheckboxRecords()
  if (!selectRecords.length) {
    ElMessage.warning("请至少选择一条数据")
    return
  }

  const options: ElMessageBoxOptions = {
    title: "批量删除确认",
    message: h("p", null, [h("span", null, `确定删除选中的 ${selectRecords.length} 条记录吗？`)]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }

  ElMessageBox.confirm(options.message!, options.title, options)
    .then(async () => {
      const ids = selectRecords.map(item => item.id)
      await batchDeleteProductApi({ ids })
      ElMessage.success("删除成功")
      xGridDom.value?.commitProxy("query")
    })
    .catch(() => {
      ElMessage.info("已取消删除")
    })
}
// #endregion

onMounted(() => {
  xGridDom.value?.commitProxy("query")
})
</script>

<template>
  <div class="app-container">
    <!-- 表格 -->
    <vxe-grid ref="xGridDom" v-bind="xGridOpt">
      <!-- 工具栏 -->
      <template #toolbar-btns>
        <vxe-button status="primary" icon="vxe-icon-add" @click="handleCreate">
          新增
        </vxe-button>
        <vxe-button status="danger" icon="vxe-icon-delete" @click="handleBatchDelete">
          批量删除
        </vxe-button>
      </template>

      <!-- 状态插槽 -->
      <template #status-slot="{ row }">
        <el-tag :type="getProductStatusType(row.status)">
          {{ getProductStatusLabel(row.status) }}
        </el-tag>
      </template>

      <!-- 操作插槽 -->
      <template #action-slot="{ row }">
        <vxe-button status="primary" icon="vxe-icon-edit" @click="handleUpdate(row)">
          编辑
        </vxe-button>
        <vxe-button status="danger" icon="vxe-icon-delete" @click="handleDelete(row)">
          删除
        </vxe-button>
      </template>
    </vxe-grid>

    <!-- 抽屉表单 -->
    <el-drawer v-model="drawerVisible" :title="drawerTitle" size="500px" @close="closeDrawer">
      <vxe-form ref="xFormDom" v-bind="xFormOpt" @submit="submitForm" @reset="resetForm" />

      <template #footer>
        <div style="padding: 0 20px 20px">
          <el-button @click="closeDrawer">
            取消
          </el-button>
          <el-button type="primary" :loading="drawerLoading" @click="submitForm">
            提交
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<style lang="scss" scoped>
.app-container {
  padding: 20px;
}
</style>
