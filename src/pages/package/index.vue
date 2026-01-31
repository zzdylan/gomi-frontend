<script lang="ts" setup>
import type { ElMessageBoxOptions } from "element-plus"
import type { VxeFormInstance, VxeFormProps, VxeGridInstance, VxeGridProps } from "vxe-table"
import type { BenefitInfo } from "../benefit/apis/type"
import type { PackageBenefitConfig } from "./apis/type"
import { getAllBenefitsApi } from "../benefit/apis"
import { batchDeletePackageApi, createPackageApi, deletePackageApi, getPackageListApi, updatePackageApi } from "./apis"

defineOptions({
  name: "PackageManagement"
})

// #region 常量定义
const PACKAGE_STATUS_OPTIONS = [
  { label: "停用", value: 0 },
  { label: "启用", value: 1 }
]

const IS_MAIN_OPTIONS = [
  { label: "主套餐", value: true },
  { label: "附加套餐", value: false }
]

function getPackageStatusLabel(status: number) {
  return PACKAGE_STATUS_OPTIONS.find(item => item.value === status)?.label || "未知"
}

function getPackageStatusType(status: number) {
  return status === 1 ? "success" : "info"
}

// 价格格式化(分转元)
function formatPrice(price: number) {
  return (price / 100).toFixed(2)
}
// #endregion

// #region vxe-grid
interface RowMeta {
  id: string
  name: string
  code: string
  description?: string
  price: number
  is_main: boolean
  duration: number
  status: number
  benefits?: Array<{
    benefit_id: string
    benefit_name: string
    benefit_code: string
    unit_name: string
    amount: number
  }>
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
            placeholder: "套餐名称",
            clearable: true
          }
        }
      },
      {
        field: "is_main",
        itemRender: {
          name: "VxeSelect",
          options: IS_MAIN_OPTIONS,
          props: {
            placeholder: "套餐类型",
            clearable: true
          }
        }
      },
      {
        field: "status",
        itemRender: {
          name: "VxeSelect",
          options: PACKAGE_STATUS_OPTIONS,
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
      title: "套餐名称",
      minWidth: 150
    },
    {
      field: "code",
      title: "套餐编码",
      minWidth: 120
    },
    {
      field: "price",
      title: "价格(元)",
      width: 120,
      slots: {
        default: "price-slot"
      }
    },
    {
      field: "is_main",
      title: "套餐类型",
      width: 100,
      slots: {
        default: "is-main-slot"
      }
    },
    {
      field: "duration",
      title: "有效期(天)",
      width: 120
    },
    {
      field: "benefits",
      title: "包含权益",
      minWidth: 200,
      slots: {
        default: "benefits-slot"
      }
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
        return getPackageListApi({
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
  description?: string
  price: number
  is_main: boolean
  duration: number
  status: number
  benefits: PackageBenefitConfig[]
}

const formData = reactive<FormData>({
  name: "",
  code: "",
  description: "",
  price: 0,
  is_main: true,
  duration: 30,
  status: 1,
  benefits: []
})

// 所有可用的权益列表
const allBenefits = ref<BenefitInfo[]>([])

// 加载所有启用的权益
async function loadAllBenefits() {
  try {
    const res = await getAllBenefitsApi()
    allBenefits.value = res.data.items || []
  } catch (error) {
    console.error("加载权益列表失败", error)
  }
}

// 添加权益配置
function addBenefitConfig() {
  formData.benefits.push({
    benefit_id: "",
    amount: 1
  })
}

// 删除权益配置
function removeBenefitConfig(index: number) {
  formData.benefits.splice(index, 1)
}

const xFormOpt = reactive<VxeFormProps>({
  titleWidth: "120px",
  titleAlign: "right",
  items: [
    {
      field: "name",
      title: "套餐名称",
      span: 24,
      itemRender: {
        name: "VxeInput",
        props: {
          placeholder: "请输入套餐名称"
        }
      }
    },
    {
      field: "code",
      title: "套餐编码",
      span: 24,
      itemRender: {
        name: "VxeInput",
        props: {
          placeholder: "请输入套餐编码（字母、数字、下划线）"
        }
      }
    },
    {
      field: "price",
      title: "套餐价格(元)",
      span: 24,
      itemRender: {
        name: "VxeInput",
        props: {
          type: "number",
          placeholder: "请输入套餐价格"
        }
      }
    },
    {
      field: "is_main",
      title: "套餐类型",
      span: 24,
      itemRender: {
        name: "VxeSelect",
        options: IS_MAIN_OPTIONS,
        props: {
          placeholder: "请选择套餐类型"
        }
      }
    },
    {
      field: "duration",
      title: "有效期(天)",
      span: 24,
      itemRender: {
        name: "VxeInput",
        props: {
          type: "number",
          placeholder: "请输入有效期"
        }
      }
    },
    {
      field: "description",
      title: "套餐描述",
      span: 24,
      itemRender: {
        name: "VxeTextarea",
        props: {
          placeholder: "请输入套餐描述",
          rows: 3
        }
      }
    },
    {
      field: "status",
      title: "状态",
      span: 24,
      itemRender: {
        name: "VxeSelect",
        options: PACKAGE_STATUS_OPTIONS,
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
    name: [{ required: true, message: "请输入套餐名称" }],
    code: [
      { required: true, message: "请输入套餐编码" },
      { pattern: /^[\w-]+$/, message: "只能包含字母、数字、下划线和破折号" }
    ],
    price: [{ required: true, message: "请输入套餐价格" }],
    duration: [{ required: true, message: "请输入有效期" }]
  },
  data: formData
})

function resetForm() {
  Object.assign(formData, {
    name: "",
    code: "",
    description: "",
    price: 0,
    is_main: true,
    duration: 30,
    status: 1,
    benefits: []
  })
}

function openDrawer(type: "create" | "update", row?: RowMeta) {
  currentFormType.value = type
  loadAllBenefits() // 加载权益列表

  if (type === "create") {
    drawerTitle.value = "新增套餐"
    resetForm()
  } else if (type === "update" && row) {
    drawerTitle.value = "编辑套餐"
    currentRowId.value = row.id

    // 转换权益数据
    const benefits: PackageBenefitConfig[] = (row.benefits || []).map(b => ({
      benefit_id: b.benefit_id,
      amount: b.amount
    }))

    Object.assign(formData, {
      name: row.name,
      code: row.code,
      description: row.description,
      price: row.price / 100, // 分转元
      is_main: row.is_main,
      duration: row.duration,
      status: row.status,
      benefits
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
    const submitData = {
      ...formData,
      price: Math.round(formData.price * 100), // 元转分
      duration: Number(formData.duration) // 确保是数字类型
    }

    if (currentFormType.value === "create") {
      await createPackageApi(submitData)
      ElMessage.success("创建成功")
    } else {
      await updatePackageApi(currentRowId.value, submitData)
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
      h("span", null, "确定删除套餐 "),
      h("b", { style: "color: var(--el-color-danger)" }, row.name),
      h("span", null, " 吗？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }

  ElMessageBox.confirm(options.message!, options.title, options)
    .then(async () => {
      await deletePackageApi(row.id)
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
      await batchDeletePackageApi({ ids })
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
  loadAllBenefits()
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

      <!-- 价格插槽 -->
      <template #price-slot="{ row }">
        <span style="color: var(--el-color-danger); font-weight: bold">¥{{ formatPrice(row.price) }}</span>
      </template>

      <!-- 套餐类型插槽 -->
      <template #is-main-slot="{ row }">
        <el-tag :type="row.is_main ? 'danger' : 'warning'">
          {{ row.is_main ? "主套餐" : "附加套餐" }}
        </el-tag>
      </template>

      <!-- 包含权益插槽 -->
      <template #benefits-slot="{ row }">
        <div v-if="row.benefits && row.benefits.length > 0">
          <el-tag v-for="benefit in row.benefits" :key="benefit.benefit_id" size="small" style="margin: 2px">
            {{ benefit.benefit_name }}: {{ benefit.amount }}{{ benefit.unit_name }}
          </el-tag>
        </div>
        <span v-else style="color: #909399">暂无权益</span>
      </template>

      <!-- 状态插槽 -->
      <template #status-slot="{ row }">
        <el-tag :type="getPackageStatusType(row.status)">
          {{ getPackageStatusLabel(row.status) }}
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
    <el-drawer v-model="drawerVisible" :title="drawerTitle" size="600px" @close="closeDrawer">
      <vxe-form ref="xFormDom" v-bind="xFormOpt" @submit="submitForm" @reset="resetForm" />

      <!-- 权益配置 -->
      <div style="padding: 0 20px 20px">
        <el-divider content-position="left">
          套餐权益配置
        </el-divider>

        <div v-for="(benefit, index) in formData.benefits" :key="index" style="margin-bottom: 15px">
          <el-row :gutter="10">
            <el-col :span="12">
              <el-select v-model="benefit.benefit_id" placeholder="请选择权益" style="width: 100%">
                <el-option
                  v-for="item in allBenefits"
                  :key="item.id"
                  :label="`${item.name} (${item.unit_name})`"
                  :value="item.id"
                />
              </el-select>
            </el-col>
            <el-col :span="8">
              <el-input-number
                v-model="benefit.amount"
                :min="1"
                :step="1"
                placeholder="数量"
                style="width: 100%"
              />
            </el-col>
            <el-col :span="4">
              <el-button type="danger" icon="Delete" @click="removeBenefitConfig(index)" />
            </el-col>
          </el-row>
        </div>

        <el-button type="primary" icon="Plus" @click="addBenefitConfig" style="width: 100%">
          添加权益
        </el-button>
      </div>

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
