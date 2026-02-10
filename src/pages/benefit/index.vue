<script lang="ts" setup>
import type { ElMessageBoxOptions } from "element-plus"
import type { VxeFormInstance, VxeFormProps, VxeGridInstance, VxeGridProps } from "vxe-table"
import type { ProductInfo } from "@/pages/product/apis/type"
import { getAllProductsApi } from "@/pages/product/apis"
import { batchDeleteBenefitApi, createBenefitApi, deleteBenefitApi, getBenefitListApi, updateBenefitApi } from "./apis"

defineOptions({
  name: "BenefitManagement"
})

// #region 产品数据
const productList = ref<ProductInfo[]>([])
const productOptions = computed(() => productList.value.map(item => ({ label: item.name, value: Number(item.id) })))

async function loadProducts() {
  try {
    const res = await getAllProductsApi()
    productList.value = res.data.items || []
  } catch (error) {
    console.error("加载产品列表失败", error)
  }
}

function getProductName(productId: number) {
  const product = productList.value.find(item => Number(item.id) === productId)
  return product?.name || "-"
}
// #endregion

// #region 常量定义
const BENEFIT_STATUS_OPTIONS = [
  { label: "停用", value: 0 },
  { label: "启用", value: 1 }
]

function getBenefitStatusLabel(status: number) {
  return BENEFIT_STATUS_OPTIONS.find(item => item.value === status)?.label || "未知"
}

function getBenefitStatusType(status: number) {
  return status === 1 ? "success" : "info"
}
// #endregion

// #region vxe-grid
interface RowMeta {
  id: string
  product_id: number
  name: string
  code: string
  unit_name: string
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
        field: "product_id",
        itemRender: {
          name: "VxeSelect",
          options: [],
          props: {
            placeholder: "所属产品",
            clearable: true
          }
        }
      },
      {
        field: "name",
        itemRender: {
          name: "VxeInput",
          props: {
            placeholder: "权益名称",
            clearable: true
          }
        }
      },
      {
        field: "status",
        itemRender: {
          name: "VxeSelect",
          options: BENEFIT_STATUS_OPTIONS,
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
      field: "product_id",
      title: "所属产品",
      minWidth: 120,
      slots: {
        default: "product-slot"
      }
    },
    {
      field: "name",
      title: "权益名称",
      minWidth: 150
    },
    {
      field: "code",
      title: "权益编码",
      minWidth: 150
    },
    {
      field: "unit_name",
      title: "单位",
      width: 100
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
        return getBenefitListApi({
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
  product_id: number | null
  name: string
  code: string
  unit_name: string
  status: number
}

const formData = reactive<FormData>({
  product_id: null,
  name: "",
  code: "",
  unit_name: "",
  status: 1
})

const xFormOpt = reactive<VxeFormProps>({
  titleWidth: "100px",
  titleAlign: "right",
  items: [
    {
      field: "product_id",
      title: "所属产品",
      span: 24,
      itemRender: {
        name: "VxeSelect",
        options: [],
        props: {
          placeholder: "请选择所属产品"
        }
      }
    },
    {
      field: "name",
      title: "权益名称",
      span: 24,
      itemRender: {
        name: "VxeInput",
        props: {
          placeholder: "请输入权益名称"
        }
      }
    },
    {
      field: "code",
      title: "权益编码",
      span: 24,
      itemRender: {
        name: "VxeInput",
        props: {
          placeholder: "请输入权益编码（字母、数字、下划线）"
        }
      }
    },
    {
      field: "unit_name",
      title: "单位名称",
      span: 24,
      itemRender: {
        name: "VxeInput",
        props: {
          placeholder: "如：次、GB、个"
        }
      }
    },
    {
      field: "status",
      title: "状态",
      span: 24,
      itemRender: {
        name: "VxeSelect",
        options: BENEFIT_STATUS_OPTIONS,
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
    product_id: [{ required: true, message: "请选择所属产品" }],
    name: [{ required: true, message: "请输入权益名称" }],
    code: [
      { required: true, message: "请输入权益编码" },
      { pattern: /^[\w-]+$/, message: "只能包含字母、数字、下划线和破折号" }
    ],
    unit_name: [{ required: true, message: "请输入单位名称" }]
  },
  data: formData
})

function resetForm() {
  Object.assign(formData, {
    product_id: null,
    name: "",
    code: "",
    unit_name: "",
    status: 1
  })
}

function openDrawer(type: "create" | "update", row?: RowMeta) {
  currentFormType.value = type
  if (type === "create") {
    drawerTitle.value = "新增权益类型"
    resetForm()
  } else if (type === "update" && row) {
    drawerTitle.value = "编辑权益类型"
    currentRowId.value = row.id
    Object.assign(formData, {
      product_id: row.product_id,
      name: row.name,
      code: row.code,
      unit_name: row.unit_name,
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
      if (!formData.product_id) {
        ElMessage.warning("请选择所属产品")
        return
      }
      await createBenefitApi({ ...formData, product_id: formData.product_id })
      ElMessage.success("创建成功")
    } else {
      await updateBenefitApi(currentRowId.value, formData)
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
      h("span", null, "确定删除权益类型 "),
      h("b", { style: "color: var(--el-color-danger)" }, row.name),
      h("span", null, " 吗？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }

  ElMessageBox.confirm(options.message!, options.title, options)
    .then(async () => {
      await deleteBenefitApi(row.id)
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
      await batchDeleteBenefitApi({ ids })
      ElMessage.success("删除成功")
      xGridDom.value?.commitProxy("query")
    })
    .catch(() => {
      ElMessage.info("已取消删除")
    })
}
// #endregion

onMounted(async () => {
  await loadProducts()
  // 更新查询表单和编辑表单的产品下拉选项
  if (xGridOpt.formConfig?.items) {
    const productItem = xGridOpt.formConfig.items.find(item => item.field === "product_id")
    if (productItem?.itemRender) {
      productItem.itemRender.options = productOptions.value
    }
  }
  if (xFormOpt.items) {
    const productItem = xFormOpt.items.find(item => item.field === "product_id")
    if (productItem?.itemRender) {
      productItem.itemRender.options = productOptions.value
    }
  }
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

      <!-- 产品插槽 -->
      <template #product-slot="{ row }">
        {{ getProductName(row.product_id) }}
      </template>

      <!-- 状态插槽 -->
      <template #status-slot="{ row }">
        <el-tag :type="getBenefitStatusType(row.status)">
          {{ getBenefitStatusLabel(row.status) }}
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
