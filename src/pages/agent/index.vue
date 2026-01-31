<script lang="ts" setup>
import type { ElMessageBoxOptions } from "element-plus"
import type { VxeFormInstance, VxeFormProps, VxeGridInstance, VxeGridProps } from "vxe-table"
import { batchDeleteAgentApi, createAgentApi, deleteAgentApi, getAgentListApi, updateAgentApi } from "./apis"

defineOptions({
  name: "AgentManagement"
})

// #region 常量定义
const AGENT_TYPE_OPTIONS = [
  { label: "总代理", value: 1 },
  { label: "普通代理", value: 2 },
  { label: "下级代理", value: 3 }
]

const AGENT_STATUS_OPTIONS = [
  { label: "待审核", value: 0 },
  { label: "已通过", value: 1 },
  { label: "已拒绝", value: 2 },
  { label: "已封禁", value: 3 }
]

function getAgentTypeLabel(type: number) {
  return AGENT_TYPE_OPTIONS.find(item => item.value === type)?.label || "未知"
}

function getAgentStatusLabel(status: number) {
  return AGENT_STATUS_OPTIONS.find(item => item.value === status)?.label || "未知"
}

function getAgentStatusType(status: number): "success" | "primary" | "warning" | "info" | "danger" {
  const typeMap: Record<number, "success" | "primary" | "warning" | "info" | "danger"> = {
    0: "warning",
    1: "success",
    2: "danger",
    3: "info"
  }
  return typeMap[status] || "info"
}

// 余额格式化(分转元)
function formatBalance(balance: number) {
  return (balance / 100).toFixed(2)
}
// #endregion

// #region vxe-grid
interface RowMeta {
  id: string
  user_id: string
  user?: {
    id: string
    username: string
    name?: string
  }
  type: number
  parent_id: string
  company_name: string
  contact_name: string
  contact_phone: string
  contact_email?: string
  address?: string
  balance: number
  status: number
  remark?: string
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
        field: "company_name",
        itemRender: {
          name: "VxeInput",
          props: {
            placeholder: "公司名称",
            clearable: true
          }
        }
      },
      {
        field: "contact_name",
        itemRender: {
          name: "VxeInput",
          props: {
            placeholder: "联系人",
            clearable: true
          }
        }
      },
      {
        field: "phone",
        itemRender: {
          name: "VxeInput",
          props: {
            placeholder: "联系电话",
            clearable: true
          }
        }
      },
      {
        field: "type",
        itemRender: {
          name: "VxeSelect",
          options: AGENT_TYPE_OPTIONS,
          props: {
            placeholder: "代理类型",
            clearable: true
          }
        }
      },
      {
        field: "status",
        itemRender: {
          name: "VxeSelect",
          options: AGENT_STATUS_OPTIONS,
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
    checkMethod: ({ column }) => !["company_name", "contact_name"].includes(column.field)
  },
  /** 列配置 */
  columns: [
    {
      type: "checkbox",
      width: 50
    },
    {
      field: "company_name",
      title: "公司名称",
      minWidth: 180
    },
    {
      field: "contact_name",
      title: "联系人",
      minWidth: 100
    },
    {
      field: "contact_phone",
      title: "联系电话",
      minWidth: 130
    },
    {
      field: "type",
      title: "代理类型",
      width: 100,
      slots: {
        default: "type-slot"
      }
    },
    {
      field: "balance",
      title: "余额(元)",
      width: 120,
      slots: {
        default: "balance-slot"
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
        return getAgentListApi({
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
  // 账号信息（仅新增时）
  username?: string
  password?: string
  // 代理商信息
  type: number
  parent_id?: string
  company_name: string
  contact_name: string
  contact_phone: string
  contact_email?: string
  address?: string
  balance?: number
  status: number
  remark?: string
}

const formData = reactive<FormData>({
  username: "",
  password: "",
  type: 2,
  company_name: "",
  contact_name: "",
  contact_phone: "",
  contact_email: "",
  address: "",
  balance: 0,
  status: 0,
  remark: ""
})

const xFormOpt = reactive<VxeFormProps>({
  titleWidth: "100px",
  titleAlign: "right",
  items: [
    // 账号信息（新增时可编辑，编辑时只读展示）
    {
      field: "username",
      title: "用户名",
      span: 24,
      itemRender: {
        name: "VxeInput",
        props: {
          placeholder: "请输入登录用户名"
        }
      },
      visibleMethod: () => currentFormType.value === "create"
    },
    {
      field: "username",
      title: "登录账号",
      span: 24,
      itemRender: {
        name: "VxeInput",
        props: {
          disabled: true
        }
      },
      visibleMethod: () => currentFormType.value === "update"
    },
    {
      field: "password",
      title: "密码",
      span: 24,
      itemRender: {
        name: "VxeInput",
        props: {
          type: "password",
          placeholder: "请输入登录密码"
        }
      },
      visibleMethod: () => currentFormType.value === "create"
    },
    // 代理商信息
    {
      field: "type",
      title: "代理类型",
      span: 24,
      itemRender: {
        name: "VxeSelect",
        options: AGENT_TYPE_OPTIONS,
        props: {
          placeholder: "请选择代理类型"
        }
      }
    },
    {
      field: "company_name",
      title: "公司名称",
      span: 24,
      itemRender: {
        name: "VxeInput",
        props: {
          placeholder: "请输入公司名称"
        }
      }
    },
    {
      field: "contact_name",
      title: "联系人",
      span: 24,
      itemRender: {
        name: "VxeInput",
        props: {
          placeholder: "请输入联系人姓名"
        }
      }
    },
    {
      field: "contact_phone",
      title: "联系电话",
      span: 24,
      itemRender: {
        name: "VxeInput",
        props: {
          placeholder: "请输入联系电话"
        }
      }
    },
    {
      field: "contact_email",
      title: "联系邮箱",
      span: 24,
      itemRender: {
        name: "VxeInput",
        props: {
          placeholder: "请输入联系邮箱"
        }
      }
    },
    {
      field: "address",
      title: "地址",
      span: 24,
      itemRender: {
        name: "VxeInput",
        props: {
          placeholder: "请输入地址"
        }
      }
    },
    {
      field: "balance",
      title: "初始余额(元)",
      span: 24,
      itemRender: {
        name: "VxeInput",
        props: {
          type: "number",
          placeholder: "请输入初始余额"
        }
      },
      visibleMethod: () => currentFormType.value === "create"
    },
    {
      field: "status",
      title: "状态",
      span: 24,
      itemRender: {
        name: "VxeSelect",
        options: AGENT_STATUS_OPTIONS,
        props: {
          placeholder: "请选择状态"
        }
      }
    },
    {
      field: "remark",
      title: "备注",
      span: 24,
      itemRender: {
        name: "VxeTextarea",
        props: {
          placeholder: "请输入备注",
          rows: 3
        }
      }
    }
  ],
  rules: {
    username: [
      { required: true, message: "请输入用户名" },
      { min: 3, max: 50, message: "用户名长度需在 3~50 之间" }
    ],
    password: [
      { required: true, message: "请输入密码" },
      { min: 6, max: 50, message: "密码长度需在 6~50 之间" }
    ],
    type: [{ required: true, message: "请选择代理类型" }],
    company_name: [{ required: true, message: "请输入公司名称" }],
    contact_name: [{ required: true, message: "请输入联系人姓名" }],
    contact_phone: [
      { required: true, message: "请输入联系电话" },
      { pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号" }
    ]
  },
  data: formData
})

function resetForm() {
  Object.assign(formData, {
    username: "",
    password: "",
    type: 2,
    parent_id: "",
    company_name: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    address: "",
    balance: 0,
    status: 0,
    remark: ""
  })
}

function openDrawer(type: "create" | "update", row?: RowMeta) {
  currentFormType.value = type
  if (type === "create") {
    drawerTitle.value = "新增代理商"
    resetForm()
  } else if (type === "update" && row) {
    drawerTitle.value = "编辑代理商"
    currentRowId.value = row.id
    Object.assign(formData, {
      username: row.user?.username || "", // 展示关联的用户名
      type: row.type,
      parent_id: row.parent_id,
      company_name: row.company_name,
      contact_name: row.contact_name,
      contact_phone: row.contact_phone,
      contact_email: row.contact_email,
      address: row.address,
      status: row.status,
      remark: row.remark
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
      // 新增时提交账号信息
      const submitData = {
        username: formData.username || "",
        password: formData.password || "",
        type: formData.type,
        parent_id: formData.parent_id ? Number(formData.parent_id) : undefined,
        company_name: formData.company_name,
        contact_name: formData.contact_name,
        contact_phone: formData.contact_phone,
        contact_email: formData.contact_email,
        address: formData.address,
        balance: formData.balance ? Math.round(formData.balance * 100) : 0,
        status: formData.status,
        remark: formData.remark
      }
      await createAgentApi(submitData)
      ElMessage.success("创建成功")
    } else {
      // 更新时不提交账号信息
      const submitData = {
        type: formData.type,
        parent_id: formData.parent_id ? String(formData.parent_id) : undefined,
        company_name: formData.company_name,
        contact_name: formData.contact_name,
        contact_phone: formData.contact_phone,
        contact_email: formData.contact_email,
        address: formData.address,
        status: formData.status,
        remark: formData.remark
      }
      await updateAgentApi(currentRowId.value, submitData)
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
      h("span", null, "确定删除代理商 "),
      h("b", { style: "color: var(--el-color-danger)" }, row.company_name),
      h("span", null, " 吗？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }

  ElMessageBox.confirm(options.message!, options.title, options)
    .then(async () => {
      await deleteAgentApi(row.id)
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
      await batchDeleteAgentApi({ ids })
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

      <!-- 代理类型插槽 -->
      <template #type-slot="{ row }">
        <el-tag :type="row.type === 1 ? 'success' : row.type === 2 ? 'warning' : 'info'">
          {{ getAgentTypeLabel(row.type) }}
        </el-tag>
      </template>

      <!-- 余额插槽 -->
      <template #balance-slot="{ row }">
        <span style="color: var(--el-color-primary); font-weight: bold">¥{{ formatBalance(row.balance) }}</span>
      </template>

      <!-- 状态插槽 -->
      <template #status-slot="{ row }">
        <el-tag :type="getAgentStatusType(row.status)">
          {{ getAgentStatusLabel(row.status) }}
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
