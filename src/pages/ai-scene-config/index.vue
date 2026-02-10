<script lang="ts" setup>
import type { ElMessageBoxOptions } from "element-plus"
import type { VxeFormInstance, VxeFormProps, VxeGridInstance, VxeGridProps } from "vxe-table"
import type { AiProviderInfo } from "@/pages/ai-provider/apis/type"
import { getAllAiProvidersApi } from "@/pages/ai-provider/apis"
import { createAiSceneConfigApi, deleteAiSceneConfigApi, getAiSceneConfigListApi, updateAiSceneConfigApi } from "./apis"

defineOptions({
  name: "AiSceneConfigManagement"
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

// 厂商列表（用于下拉选择）
const providerOptions = ref<{ label: string, value: number }[]>([])

// 加载厂商列表
async function loadProviders() {
  try {
    const res = await getAllAiProvidersApi()
    providerOptions.value = res.data.items.map((item: AiProviderInfo) => ({
      label: item.name,
      value: item.id
    }))
    // 更新表单中的选项
    const providerItem = xFormOpt.items?.find(item => item.field === "provider_id")
    if (providerItem?.itemRender) {
      providerItem.itemRender.options = providerOptions.value
    }
  } catch (error) {
    console.error("加载厂商列表失败", error)
  }
}
// #endregion

// #region vxe-grid
interface RowMeta {
  id: string
  scene: string
  scene_name: string
  provider_id: number
  model: string
  params: string
  status: number
  remark: string
  created_at: string
  updated_at: string
  provider: AiProviderInfo
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
        field: "scene",
        itemRender: {
          name: "VxeInput",
          props: {
            placeholder: "场景标识",
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
    checkMethod: ({ column }) => !["scene", "scene_name"].includes(column.field)
  },
  columns: [
    {
      field: "scene",
      title: "场景标识",
      minWidth: 120
    },
    {
      field: "scene_name",
      title: "场景名称",
      minWidth: 150
    },
    {
      field: "provider.name",
      title: "AI厂商",
      minWidth: 120
    },
    {
      field: "model",
      title: "模型",
      minWidth: 150
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
        return getAiSceneConfigListApi({
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
  scene: string
  scene_name: string
  provider_id: number | null
  model: string
  params: string
  status: number
  remark: string
}

const formData = reactive<FormData>({
  scene: "",
  scene_name: "",
  provider_id: null,
  model: "",
  params: "",
  status: 1,
  remark: ""
})

const xFormOpt = reactive<VxeFormProps>({
  titleWidth: "100px",
  titleAlign: "right",
  items: [
    {
      field: "scene",
      title: "场景标识",
      span: 24,
      itemRender: {
        name: "VxeInput",
        props: {
          placeholder: "如：smart_copy、copywriting"
        }
      }
    },
    {
      field: "scene_name",
      title: "场景名称",
      span: 24,
      itemRender: {
        name: "VxeInput",
        props: {
          placeholder: "如：智能文案、文案生成"
        }
      }
    },
    {
      field: "provider_id",
      title: "AI厂商",
      span: 24,
      itemRender: {
        name: "VxeSelect",
        options: [],
        props: {
          placeholder: "请选择AI厂商"
        }
      }
    },
    {
      field: "model",
      title: "模型名称",
      span: 24,
      itemRender: {
        name: "VxeInput",
        props: {
          placeholder: "如：deepseek-chat、gpt-4"
        }
      }
    },
    {
      field: "params",
      title: "额外参数",
      span: 24,
      itemRender: {
        name: "VxeTextarea",
        props: {
          placeholder: "JSON格式的额外参数（可选）",
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
    scene: [{ required: true, message: "请输入场景标识" }],
    scene_name: [{ required: true, message: "请输入场景名称" }],
    provider_id: [{ required: true, message: "请选择AI厂商" }],
    model: [{ required: true, message: "请输入模型名称" }]
  },
  data: formData
})

function resetForm() {
  Object.assign(formData, {
    scene: "",
    scene_name: "",
    provider_id: null,
    model: "",
    params: "",
    status: 1,
    remark: ""
  })
}

function openDrawer(type: "create" | "update", row?: RowMeta) {
  currentFormType.value = type
  if (type === "create") {
    drawerTitle.value = "新增场景配置"
    resetForm()
  } else if (type === "update" && row) {
    drawerTitle.value = "编辑场景配置"
    currentRowId.value = row.id
    Object.assign(formData, {
      scene: row.scene,
      scene_name: row.scene_name,
      provider_id: row.provider_id,
      model: row.model,
      params: row.params,
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
    const submitData = {
      ...formData,
      provider_id: formData.provider_id as number
    }

    if (currentFormType.value === "create") {
      await createAiSceneConfigApi(submitData)
      ElMessage.success("创建成功")
    } else {
      await updateAiSceneConfigApi(currentRowId.value, submitData)
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
      h("span", null, "确定删除场景 "),
      h("b", { style: "color: var(--el-color-danger)" }, row.scene_name),
      h("span", null, " 吗？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }

  ElMessageBox.confirm(options.message!, options.title, options)
    .then(async () => {
      await deleteAiSceneConfigApi(row.id)
      ElMessage.success("删除成功")
      xGridDom.value?.commitProxy("query")
    })
    .catch(() => {
      ElMessage.info("已取消删除")
    })
}
// #endregion

onMounted(() => {
  loadProviders()
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
