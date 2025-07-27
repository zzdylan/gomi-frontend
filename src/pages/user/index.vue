<script lang="ts" setup>
import type { ElMessageBoxOptions } from "element-plus"
import type { VxeFormInstance, VxeFormProps, VxeGridInstance, VxeGridProps } from "vxe-table"
// import type { UserInfo } from "@@/apis/users/type"
import { batchDeleteUserApi, createUserApi, deleteUserApi, getUserListApi, updateUserApi } from "@@/apis/users"

defineOptions({
  name: "UserManagement"
})

// #region vxe-grid
interface RowMeta {
  id: string
  username: string
  name: string
  email?: string
  phone?: string
  roles?: string[]
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
        field: "username",
        itemRender: {
          name: "VxeInput",
          props: {
            placeholder: "用户名",
            clearable: true
          }
        }
      },
      {
        field: "name",
        itemRender: {
          name: "VxeInput",
          props: {
            placeholder: "姓名",
            clearable: true
          }
        }
      },
      {
        field: "email",
        itemRender: {
          name: "VxeInput",
          props: {
            placeholder: "邮箱",
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
    checkMethod: ({ column }) => !["username", "name"].includes(column.field)
  },
  /** 列配置 */
  columns: [
    {
      type: "checkbox",
      width: "50px"
    },
    {
      field: "username",
      title: "用户名",
      minWidth: "150px"
    },
    {
      field: "roles",
      title: "角色",
      minWidth: "200px",
      align: "center",
      slots: {
        default: "roles-slot"
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
            ...(form.username && { username: form.username }),
            ...(form.name && { name: form.name }),
            ...(form.email && { email: form.email })
          }
          // 调用接口
          getUserListApi(params).then(callback).catch(callback)
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
    username: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    roles: []
  },
  /** 项列表 */
  items: [
    {
      field: "username",
      title: "用户名",
      itemRender: {
        name: "$input",
        props: {
          placeholder: "请输入用户名"
        }
      }
    },
    {
      field: "name",
      title: "姓名",
      itemRender: {
        name: "$input",
        props: {
          placeholder: "请输入姓名"
        }
      }
    },
    {
      field: "email",
      title: "邮箱",
      itemRender: {
        name: "$input",
        props: {
          placeholder: "请输入邮箱",
          type: "email"
        }
      }
    },
    {
      field: "phone",
      title: "手机号",
      itemRender: {
        name: "$input",
        props: {
          placeholder: "请输入手机号"
        }
      }
    },
    {
      field: "password",
      title: "密码",
      itemRender: {
        name: "$input",
        props: {
          placeholder: "请输入密码（修改时可选）",
          type: "password",
          showPassword: true
        }
      }
    },
    {
      field: "roles",
      title: "角色",
      itemRender: {
        name: "VxeSelect",
        props: {
          placeholder: "请选择角色",
          multiple: true,
          options: [
            { label: "超级管理员", value: "super_admin" },
            { label: "普通用户", value: "normal_user" }
          ]
        }
      }
    }
  ],
  /** 校验规则 */
  rules: {
    username: [
      {
        required: true,
        validator: ({ itemValue }) => {
          switch (true) {
            case !itemValue:
              return new Error("请输入用户名")
            case !itemValue.trim():
              return new Error("用户名不能为空格")
            case itemValue.trim().length < 3:
              return new Error("用户名长度不能少于3个字符")
            case itemValue.trim().length > 50:
              return new Error("用户名长度不能超过50个字符")
          }
        }
      }
    ],
    name: [
      {
        validator: ({ itemValue }) => {
          if (itemValue && itemValue.trim() && itemValue.trim().length > 100) {
            return new Error("姓名长度不能超过100个字符")
          }
        }
      }
    ],
    email: [
      {
        validator: ({ itemValue }) => {
          if (itemValue && itemValue.trim()) {
            const emailRegex = /^[\w.%+-]+@[\w.-]+\.[a-z]{2,}$/i
            if (!emailRegex.test(itemValue.trim())) {
              return new Error("请输入有效的邮箱地址")
            }
          }
        }
      }
    ],
    phone: [
      {
        validator: ({ itemValue }) => {
          if (itemValue && itemValue.trim()) {
            const phoneRegex = /^1[3-9]\d{9}$/
            if (!phoneRegex.test(itemValue.trim())) {
              return new Error("请输入有效的手机号")
            }
          }
        }
      }
    ],
    password: [
      {
        validator: ({ itemValue }) => {
          if (!crudStore.isUpdate) {
            switch (true) {
              case !itemValue:
                return new Error("请输入密码")
              case !itemValue.trim():
                return new Error("密码不能为空格")
              case itemValue.trim().length < 6:
                return new Error("密码长度不能少于6个字符")
            }
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
      drawerTitle.value = "修改用户"
      // 赋值
      xFormOpt.data.username = row.username
      xFormOpt.data.name = row.name
      xFormOpt.data.email = row.email || ""
      xFormOpt.data.phone = row.phone || ""
      xFormOpt.data.password = ""
      xFormOpt.data.roles = row.roles || []
    } else {
      crudStore.isUpdate = false
      crudStore.currentRow = null
      drawerTitle.value = "新增用户"
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
        const updateData: any = {
          username: xFormOpt.data.username.trim(),
          name: xFormOpt.data.name?.trim() || undefined,
          email: xFormOpt.data.email?.trim() || undefined,
          phone: xFormOpt.data.phone?.trim() || undefined,
          roles: xFormOpt.data.roles
        }
        // 如果填写了密码，则包含在更新数据中
        if (xFormOpt.data.password && xFormOpt.data.password.trim()) {
          updateData.password = xFormOpt.data.password.trim()
        }
        updateUserApi(crudStore.currentRow.id, updateData).then(callback).catch(errorCallback)
      } else {
        // 调用新增接口
        const createData = {
          username: xFormOpt.data.username.trim(),
          name: xFormOpt.data.name?.trim() || undefined,
          email: xFormOpt.data.email?.trim() || undefined,
          phone: xFormOpt.data.phone?.trim() || undefined,
          password: xFormOpt.data.password,
          roles: xFormOpt.data.roles
        }
        createUserApi(createData).then(callback).catch(errorCallback)
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
    const tip = `确定 <strong style="color: var(--el-color-danger);"> 删除 </strong> 用户 <strong style="color: var(--el-color-primary);"> ${row.username} </strong> ？`
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
      deleteUserApi(row.id).then(() => {
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
      ElMessage.warning("请选择要删除的用户")
      return
    }

    const names = checkedRows.map(row => row.username).join("、")
    const tip = `确定 <strong style="color: var(--el-color-danger);"> 批量删除 </strong> 以下用户：<strong style="color: var(--el-color-primary);"> ${names} </strong> ？`
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
      batchDeleteUserApi({ ids }).then(() => {
        ElMessage.success(`成功删除 ${checkedRows.length} 个用户`)
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

// 角色映射
const roleMap = {
  super_admin: "超级管理员",
  normal_user: "普通用户"
}

function getRoleLabel(role: string) {
  return roleMap[role as keyof typeof roleMap] || role
}
// #endregion
</script>

<template>
  <div class="app-container">
    <!-- <el-alert
      title="用户管理 (抽屉模式)"
      type="info"
      description="用户信息的增删改查管理，支持用户名、姓名、邮箱、手机号和角色管理"
      show-icon
    /> -->
    <!-- 表格 -->
    <vxe-grid ref="xGridDom" v-bind="xGridOpt">
      <!-- 左侧按钮列表 -->
      <template #toolbar-btns>
        <vxe-button status="primary" icon="vxe-icon-add" @click="crudStore.onShowDrawer()">
          新增用户
        </vxe-button>
        <vxe-button status="danger" icon="vxe-icon-delete" @click="crudStore.onBatchDelete()">
          批量删除
        </vxe-button>
      </template>
      <!-- 角色列 -->
      <template #roles-slot="{ row }">
        <div style="display: flex; flex-wrap: wrap; gap: 4px; justify-content: center;">
          <el-tag
            v-for="role in row.roles"
            :key="role"
            size="small"
            type="primary"
          >
            {{ getRoleLabel(role) }}
          </el-tag>
        </div>
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

/* 重置 Element Plus 抽屉头部默认样式 */
:deep(.el-drawer__header) {
  margin-bottom: 0;
}
</style>
