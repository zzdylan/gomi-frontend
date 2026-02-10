<script lang="ts" setup>
import type { ElMessageBoxOptions } from "element-plus"
import type { VxeFormInstance, VxeFormProps, VxeGridInstance, VxeGridProps } from "vxe-table"
import { createAiProviderApi, deleteAiProviderApi, getAiProviderListApi, updateAiProviderApi } from "./apis"

defineOptions({
  name: "AiProviderManagement"
})

// #region 常量定义
const STATUS_OPTIONS = [
  { label: "禁用", value: 0 },
  { label: "启用", value: 1 }
]

function getStatusLabel(status: number) {
  return STATUS_OPTIONS.find(item => item.value === status)?.label || "未知"
}

function getStatusType(status: number) {
  return status === 1 ? "success" : "info"
}
// #endregion

// #region vxe-grid
interface RowMeta {
  id: string
  provider: string
  name: string
  host: string
  api_key: string
  status: number
  remark: string
  created_at: string
  updated_at: string
  _VXE_ID?: string
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
        field: "name",
        itemRender: {
          name: "VxeInput",
          props: {
            placeholder: "厂商名称",
            clearable: true
          }
        }
      },
      {
        field: "status",
        itemRender: {
          name: "VxeSelect",
          options: STATUS_OPTIONS,
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
  toolbarConfig: {
    refresh: true,
    custom: true,
    slots: {
      buttons: "toolbar-btns"
    }
  },
  customConfig: {
    checkMethod: ({ column }) => !["name", "provider"].includes(column.field)
  },
  columns: [
    {
      field: "provider",
      title: "厂商标识",
      minWidth: 120
    },
    {
      field: "name",
      title: "厂商名称",
      minWidth: 150
    },
    {
      field: "host",
      title: "API地址",
      minWidth: 250,
      showOverflow: true
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
      field: "remark",
      title: "备注",
      minWidth: 150,
      showOverflow: true
    },
    {
      field: "created_at",
      title: "创建时间",
      width: 180,
      sortable: true
    },
    {
      title: "操作",
      width: 100,
      fixed: "right",
      showOverflow: false,
      slots: {
        default: "action-slot"
      }
    }
  ],
  proxyConfig: {
    form: true,
    props: {
      result: "data.items",
      total: "data.pager.total_count"
    },
    ajax: {
      query: async ({ page, form }) => {
        xGridOpt.loading = true
        return getAiProviderListApi({
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
  provider: string
  name: string
  host: string
  api_key: string
  status: number
  remark: string
}

const formData = reactive<FormData>({
  provider: "",
  name: "",
  host: "",
  api_key: "",
  status: 1,
  remark: ""
})

const xFormOpt = reactive<VxeFormProps>({
  titleWidth: "100px",
  titleAlign: "right",
  items: [
    {
      field: "provider",
      title: "厂商标识",
      span: 24,
      itemRender: {
        name: "VxeInput",
        props: {
          placeholder: "如：doubao、deepseek、qwen"
        }
      }
    },
    {
      field: "name",
      title: "厂商名称",
      span: 24,
      itemRender: {
        name: "VxeInput",
        props: {
          placeholder: "如：豆包、DeepSeek、通义千问"
        }
      }
    },
    {
      field: "host",
      title: "API地址",
      span: 24,
      itemRender: {
        name: "VxeInput",
        props: {
          placeholder: "如：https://api.deepseek.com/v1"
        }
      }
    },
    {
      field: "api_key",
      title: "API密钥",
      span: 24,
      itemRender: {
        name: "VxeInput",
        props: {
          placeholder: "请输入API密钥",
          type: "password",
          showPassword: true
        }
      }
    },
    {
      field: "status",
      title: "状态",
      span: 24,
      itemRender: {
        name: "VxeSelect",
        options: STATUS_OPTIONS,
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
    provider: [{ required: true, message: "请输入厂商标识" }],
    name: [{ required: true, message: "请输入厂商名称" }],
    host: [{ required: true, message: "请输入API地址" }],
    api_key: [{ required: true, message: "请输入API密钥" }]
  },
  data: formData
})

function resetForm() {
  Object.assign(formData, {
    provider: "",
    name: "",
    host: "",
    api_key: "",
    status: 1,
    remark: ""
  })
}

function openDrawer(type: "create" | "update", row?: RowMeta) {
  currentFormType.value = type
  if (type === "create") {
    drawerTitle.value = "新增AI厂商"
    resetForm()
  } else if (type === "update" && row) {
    drawerTitle.value = "编辑AI厂商"
    currentRowId.value = row.id
    Object.assign(formData, {
      provider: row.provider,
      name: row.name,
      host: row.host,
      api_key: row.api_key,
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
      await createAiProviderApi(formData)
      ElMessage.success("创建成功")
    } else {
      await updateAiProviderApi(currentRowId.value, formData)
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
      h("span", null, "确定删除厂商 "),
      h("b", { style: "color: var(--el-color-danger)" }, row.name),
      h("span", null, " 吗？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }

  ElMessageBox.confirm(options.message!, options.title, options)
    .then(async () => {
      await deleteAiProviderApi(row.id)
      ElMessage.success("删除成功")
      xGridDom.value?.commitProxy("query")
    })
    .catch(() => {
      ElMessage.info("已取消删除")
    })
}
// #endregion
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
      </template>

      <!-- 状态插槽 -->
      <template #status-slot="{ row }">
        <el-tag :type="getStatusType(row.status)">
          {{ getStatusLabel(row.status) }}
        </el-tag>
      </template>

      <!-- 操作插槽 -->
      <template #action-slot="{ row }">
        <el-button link type="primary" @click="handleUpdate(row)">
          编辑
        </el-button>
        <el-button link type="danger" @click="handleDelete(row)">
          删除
        </el-button>
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
