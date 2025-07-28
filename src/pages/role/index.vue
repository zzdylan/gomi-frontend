<script lang="ts" setup>
import type { ElMessageBoxOptions } from "element-plus"
import type { VxeFormInstance, VxeFormProps, VxeGridInstance, VxeGridProps } from "vxe-table"
import { batchDeleteRoleApi, createRoleApi, deleteRoleApi, getRoleListApi, updateRoleApi } from "@@/apis/roles"

defineOptions({
  name: "RoleManagement"
})

// #region vxe-grid
interface RowMeta {
  id: string
  name: string
  slug: string
  description?: string
  status: number
  permissions?: Array<{ resource: string, action: string }>
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
            placeholder: "角色名称",
            clearable: true
          }
        }
      },
      {
        field: "slug",
        itemRender: {
          name: "VxeInput",
          props: {
            placeholder: "角色标识",
            clearable: true
          }
        }
      },
      {
        field: "status",
        itemRender: {
          name: "VxeSelect",
          props: {
            placeholder: "状态",
            clearable: true,
            options: [
              { label: "启用", value: 1 },
              { label: "禁用", value: 0 }
            ]
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
    checkMethod: ({ column }) => !["name", "slug"].includes(column.field)
  },
  /** 列配置 */
  columns: [
    {
      type: "checkbox",
      width: "50px"
    },
    {
      field: "name",
      title: "角色名称",
      minWidth: "150px"
    },
    {
      field: "slug",
      title: "角色标识",
      minWidth: "150px"
    },
    {
      field: "description",
      title: "描述",
      minWidth: "200px"
    },
    {
      field: "status",
      title: "状态",
      width: "100px",
      align: "center",
      slots: {
        default: "status-slot"
      }
    },
    {
      field: "permissions",
      title: "权限数量",
      width: "120px",
      align: "center",
      slots: {
        default: "permissions-slot"
      }
    },
    {
      field: "created_at",
      title: "创建时间",
      minWidth: "180px"
    },
    {
      field: "updated_at",
      title: "更新时间",
      minWidth: "180px"
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
            ...(form.name && { name: form.name }),
            ...(form.slug && { slug: form.slug }),
            ...(form.status !== undefined && form.status !== "" && { status: form.status })
          }
          // 调用接口
          getRoleListApi(params).then(callback).catch(callback)
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
  titleWidth: "100px",
  loading: false,
  /** 是否显示标题冒号 */
  titleColon: false,
  /** 表单数据 */
  data: {
    name: "",
    slug: "",
    description: "",
    status: 1,
    permissions: []
  },
  /** 项列表 */
  items: [
    {
      field: "name",
      title: "角色名称",
      itemRender: {
        name: "$input",
        props: {
          placeholder: "请输入角色名称"
        }
      }
    },
    {
      field: "slug",
      title: "角色标识",
      itemRender: {
        name: "$input",
        props: {
          placeholder: "请输入角色标识（英文、数字、下划线）"
        }
      }
    },
    {
      field: "description",
      title: "描述",
      itemRender: {
        name: "$textarea",
        props: {
          placeholder: "请输入角色描述",
          rows: 3
        }
      }
    },
    {
      field: "status",
      title: "状态",
      itemRender: {
        name: "VxeSelect",
        props: {
          placeholder: "请选择状态",
          options: [
            { label: "启用", value: 1 },
            { label: "禁用", value: 0 }
          ]
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
              return new Error("请输入角色名称")
            case !itemValue.trim():
              return new Error("角色名称不能为空格")
            case itemValue.trim().length < 2:
              return new Error("角色名称长度不能少于2个字符")
            case itemValue.trim().length > 100:
              return new Error("角色名称长度不能超过100个字符")
          }
        }
      }
    ],
    slug: [
      {
        required: true,
        validator: ({ itemValue }) => {
          switch (true) {
            case !itemValue:
              return new Error("请输入角色标识")
            case !itemValue.trim():
              return new Error("角色标识不能为空格")
            case itemValue.trim().length < 2:
              return new Error("角色标识长度不能少于2个字符")
            case itemValue.trim().length > 100:
              return new Error("角色标识长度不能超过100个字符")
            case !/^[\w-]+$/.test(itemValue.trim()):
              return new Error("角色标识只能包含英文、数字、下划线和横杠")
          }
        }
      }
    ],
    description: [
      {
        validator: ({ itemValue }) => {
          if (itemValue && itemValue.trim() && itemValue.trim().length > 255) {
            return new Error("描述长度不能超过255个字符")
          }
        }
      }
    ]
  }
})
// #endregion

// #region permissions
// 权限管理相关
const permissionsDialogVisible = ref(false)
const permissionsList = ref<Array<{ resource: string, action: string }>>([])

// 预定义的HTTP动作选项
const actionOptions = [
  { label: "所有方法 (*)", value: "*" },
  { label: "查看 (GET)", value: "GET" },
  { label: "创建 (POST)", value: "POST" },
  { label: "更新 (PUT)", value: "PUT" },
  { label: "删除 (DELETE)", value: "DELETE" }
]

// 添加权限
function addPermission() {
  permissionsList.value.push({ resource: "", action: "" })
}

// 删除权限
function removePermission(index: number) {
  permissionsList.value.splice(index, 1)
}

// 显示权限设置弹窗
function showPermissionsDialog() {
  // 复制当前表单中的权限数据
  permissionsList.value = [...(xFormOpt.data.permissions || [])]
  permissionsDialogVisible.value = true
}

// 确认权限设置
function confirmPermissions() {
  xFormOpt.data.permissions = [...permissionsList.value]
  permissionsDialogVisible.value = false
}
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
      drawerTitle.value = "修改角色"
      // 赋值
      xFormOpt.data.name = row.name
      xFormOpt.data.slug = row.slug
      xFormOpt.data.description = row.description || ""
      xFormOpt.data.status = row.status
      xFormOpt.data.permissions = row.permissions || []
    } else {
      crudStore.isUpdate = false
      crudStore.currentRow = null
      drawerTitle.value = "新增角色"
    }
    drawerVisible.value = true
    nextTick(() => {
      if (!crudStore.isUpdate) {
        xFormDom.value?.reset()
        // 确保新增时状态默认为启用
        xFormOpt.data.status = 1
      }
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
      const errorCallback = (_error: any) => {
        xFormOpt.loading = false
      }

      if (crudStore.isUpdate && crudStore.currentRow) {
        // 调用修改接口
        const updateData: any = {
          name: xFormOpt.data.name.trim(),
          slug: xFormOpt.data.slug.trim(),
          description: xFormOpt.data.description?.trim() || undefined,
          status: xFormOpt.data.status,
          permissions: xFormOpt.data.permissions
        }
        updateRoleApi(crudStore.currentRow.id, updateData).then(callback).catch(errorCallback)
      } else {
        // 调用新增接口
        const createData = {
          name: xFormOpt.data.name.trim(),
          slug: xFormOpt.data.slug.trim(),
          description: xFormOpt.data.description?.trim() || undefined,
          status: xFormOpt.data.status,
          permissions: xFormOpt.data.permissions
        }
        createRoleApi(createData).then(callback).catch(errorCallback)
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
    const tip = `确定 <strong style="color: var(--el-color-danger);"> 删除 </strong> 角色 <strong style="color: var(--el-color-primary);"> ${row.name} </strong> ？`
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
      deleteRoleApi(row.id).then(() => {
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
      ElMessage.warning("请选择要删除的角色")
      return
    }

    const names = checkedRows.map(row => row.name).join("、")
    const tip = `确定 <strong style="color: var(--el-color-danger);"> 批量删除 </strong> 以下角色：<strong style="color: var(--el-color-primary);"> ${names} </strong> ？`
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
      batchDeleteRoleApi({ ids }).then(() => {
        ElMessage.success(`成功删除 ${checkedRows.length} 个角色`)
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

// 状态映射
const statusMap = {
  1: { type: "success", text: "启用" },
  0: { type: "info", text: "禁用" }
}

function getStatusInfo(status: number) {
  return statusMap[status as keyof typeof statusMap] || { type: "info", text: "未知" }
}
// #endregion
</script>

<template>
  <div class="app-container">
    <!-- 表格 -->
    <vxe-grid ref="xGridDom" v-bind="xGridOpt">
      <!-- 左侧按钮列表 -->
      <template #toolbar-btns>
        <vxe-button status="primary" icon="vxe-icon-add" @click="crudStore.onShowDrawer()">
          新增角色
        </vxe-button>
        <vxe-button status="danger" icon="vxe-icon-delete" @click="crudStore.onBatchDelete()">
          批量删除
        </vxe-button>
      </template>
      <!-- 状态列 -->
      <template #status-slot="{ row }">
        <el-tag :type="getStatusInfo(row.status).type as any" size="small">
          {{ getStatusInfo(row.status).text }}
        </el-tag>
      </template>
      <!-- 权限数量列 -->
      <template #permissions-slot="{ row }">
        <el-tag type="primary" size="small">
          {{ row.permissions?.length || 0 }} 个权限
        </el-tag>
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
      :title="drawerTitle"
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

          <!-- 权限设置 -->
          <div class="permissions-section">
            <div class="permissions-header">
              <span>权限设置</span>
              <el-button type="primary" size="small" @click="showPermissionsDialog">
                设置权限 ({{ xFormOpt.data.permissions?.length || 0 }})
              </el-button>
            </div>
            <div v-if="xFormOpt.data.permissions?.length" class="permissions-preview">
              <el-tag
                v-for="(perm, index) in xFormOpt.data.permissions"
                :key="index"
                type="primary"
                size="small"
                style="margin: 2px;"
              >
                {{ perm.action }} {{ perm.resource }}
              </el-tag>
            </div>
          </div>
        </div>
      </template>
    </el-drawer>

    <!-- 权限设置弹窗 -->
    <el-dialog
      v-model="permissionsDialogVisible"
      title="权限设置"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="permissions-dialog">
        <div class="permissions-actions">
          <el-button type="primary" size="small" @click="addPermission">
            添加权限
          </el-button>
        </div>

        <div v-if="permissionsList.length === 0" class="empty-permissions">
          暂无权限设置，点击"添加权限"开始设置
        </div>

        <div
          v-for="(permission, index) in permissionsList"
          :key="index"
          class="permission-item"
        >
          <el-input
            v-model="permission.resource"
            placeholder="请输入资源路径，如：/api/v1/users"
            style="width: 250px; margin-right: 10px;"
          />

          <el-select
            v-model="permission.action"
            placeholder="选择HTTP方法"
            style="width: 150px; margin-right: 10px;"
          >
            <el-option
              v-for="action in actionOptions"
              :key="action.value"
              :label="action.label"
              :value="action.value"
            />
          </el-select>

          <el-button
            type="danger"
            size="small"
            @click="removePermission(index)"
          >
            删除
          </el-button>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="permissionsDialogVisible = false">
            取消
          </el-button>
          <el-button type="primary" @click="confirmPermissions">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  position: relative;
}

.drawer-header::after {
  content: "";
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

.permissions-section {
  margin-top: 20px;
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
}

.permissions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-weight: 500;
}

.permissions-preview {
  min-height: 40px;
  padding: 8px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
}

.permissions-dialog {
  .permissions-actions {
    margin-bottom: 16px;
  }

  .empty-permissions {
    text-align: center;
    padding: 40px 0;
    color: var(--el-text-color-secondary);
  }

  .permission-item {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
  }
}

/* 重置 Element Plus 抽屉头部默认样式 */
:deep(.el-drawer__header) {
  margin-bottom: 0;
}
</style>
