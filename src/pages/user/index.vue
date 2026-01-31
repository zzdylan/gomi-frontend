<script lang="ts" setup>
import type { UserBenefitInfo, UserPackageInfo } from "@@/apis/users/type"
import type { ElMessageBoxOptions } from "element-plus"
import type { VxeFormInstance, VxeFormProps, VxeGridInstance, VxeGridProps } from "vxe-table"
import type { PackageInfo } from "@/pages/package/apis/type"
import { batchDeleteUserApi, createUserApi, deleteUserApi, deleteUserPackageApi, getUserBenefitsApi, getUserListApi, getUserPackagesApi, grantUserPackageApi, impersonateUserApi, updateUserApi } from "@@/apis/users"
import { getAllPackagesApi } from "@/pages/package/apis"
import { useUserStore } from "@/pinia/stores/user"

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
      width: "260px",
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
            { label: "代理商", value: "agent" },
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
      const errorCallback = (_error: any) => {
        xFormOpt.loading = false
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
const roleMap: Record<string, string> = {
  super_admin: "超级管理员",
  agent: "代理商",
  normal_user: "普通用户"
}

function getRoleLabel(role: string) {
  return roleMap[role as keyof typeof roleMap] || role
}

// 一键登录
const userStore = useUserStore()

async function handleImpersonate(row: RowMeta) {
  try {
    await ElMessageBox.confirm(
      `确定要以 <strong style="color: var(--el-color-primary);">${row.username}</strong> 的身份登录吗？`,
      "一键登录",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
        dangerouslyUseHTMLString: true
      }
    )

    const res = await impersonateUserApi(row.id)
    const { token, username } = res.data

    // 保存当前管理员信息，用于返回
    localStorage.setItem("admin_backup_token", userStore.token)
    localStorage.setItem("admin_backup_username", userStore.username)

    // 设置新 token
    userStore.setToken(token)

    // 标记为模拟登录状态
    localStorage.setItem("impersonate_username", username)

    ElMessage.success(`已切换到用户 ${username}`)

    // 跳转到首页
    location.href = "/"
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("一键登录失败", error)
    }
  }
}
// #endregion

// #region 套餐管理
const packageDrawerVisible = ref(false)
const packageDrawerLoading = ref(false)
const currentPackageUser = ref<RowMeta | null>(null)
const userPackages = ref<UserPackageInfo[]>([])
const userBenefits = ref<UserBenefitInfo[]>([])
const packageList = ref<PackageInfo[]>([])
const selectedPackageId = ref<number | undefined>(undefined)
const grantLoading = ref(false)

// 套餐状态
const packageStatusMap: Record<number, { label: string, type: "success" | "info" | "warning" }> = {
  1: { label: "正常", type: "success" },
  2: { label: "已过期", type: "info" },
  3: { label: "已取消", type: "warning" }
}

function getPackageStatus(status: number) {
  return packageStatusMap[status] || { label: "未知", type: "info" }
}

// 打开套餐管理抽屉
async function openPackageDrawer(row: RowMeta) {
  currentPackageUser.value = row
  packageDrawerVisible.value = true
  packageDrawerLoading.value = true
  selectedPackageId.value = undefined

  try {
    // 并行加载数据
    const [packagesRes, benefitsRes, packageListRes] = await Promise.all([
      getUserPackagesApi(row.id),
      getUserBenefitsApi(row.id),
      getAllPackagesApi()
    ])

    userPackages.value = packagesRes.data.items || []
    userBenefits.value = benefitsRes.data.items || []
    packageList.value = packageListRes.data.items || []
  } catch (error) {
    console.error("加载套餐数据失败", error)
    ElMessage.error("加载数据失败")
  } finally {
    packageDrawerLoading.value = false
  }
}

// 关闭套餐管理抽屉
function closePackageDrawer() {
  packageDrawerVisible.value = false
  currentPackageUser.value = null
  userPackages.value = []
  userBenefits.value = []
  selectedPackageId.value = undefined
}

// 开通套餐
async function handleGrantPackage() {
  if (!selectedPackageId.value) {
    ElMessage.warning("请选择要开通的套餐")
    return
  }

  if (!currentPackageUser.value) return

  grantLoading.value = true
  try {
    await grantUserPackageApi(currentPackageUser.value.id, {
      package_id: selectedPackageId.value
    })
    ElMessage.success("开通成功")

    // 刷新数据
    const [packagesRes, benefitsRes] = await Promise.all([
      getUserPackagesApi(currentPackageUser.value.id),
      getUserBenefitsApi(currentPackageUser.value.id)
    ])
    userPackages.value = packagesRes.data.items || []
    userBenefits.value = benefitsRes.data.items || []
    selectedPackageId.value = undefined
  } catch (error) {
    console.error("开通套餐失败", error)
  } finally {
    grantLoading.value = false
  }
}

// 计算权益剩余数量
function getBenefitLeft(benefit: UserBenefitInfo) {
  return benefit.total_amount - benefit.used_amount
}

// 判断权益是否过期
function isBenefitExpired(benefit: UserBenefitInfo) {
  return new Date(benefit.expire_at) < new Date()
}

// 删除用户套餐
async function handleDeletePackage(pkg: UserPackageInfo) {
  if (!currentPackageUser.value) return

  try {
    await ElMessageBox.confirm(
      `确定删除套餐 "${pkg.package_name}" 吗？关联的权益也会一并删除。`,
      "删除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    )

    await deleteUserPackageApi(currentPackageUser.value.id, pkg.id)
    ElMessage.success("删除成功")

    // 刷新数据
    const [packagesRes, benefitsRes] = await Promise.all([
      getUserPackagesApi(currentPackageUser.value.id),
      getUserBenefitsApi(currentPackageUser.value.id)
    ])
    userPackages.value = packagesRes.data.items || []
    userBenefits.value = benefitsRes.data.items || []
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("删除套餐失败", error)
    }
  }
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
        <el-button link type="success" @click="openPackageDrawer(row)">
          套餐
        </el-button>
        <el-button link type="warning" @click="handleImpersonate(row)">
          登录
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

    <!-- 套餐管理抽屉 -->
    <el-drawer
      v-model="packageDrawerVisible"
      :title="`套餐管理 - ${currentPackageUser?.username || ''}`"
      direction="rtl"
      size="600px"
      @close="closePackageDrawer"
    >
      <div v-loading="packageDrawerLoading" class="package-drawer-content">
        <!-- 开通套餐 -->
        <div class="section">
          <div class="section-title">
            开通套餐
          </div>
          <div class="grant-form">
            <el-select
              v-model="selectedPackageId"
              placeholder="选择要开通的套餐"
              style="width: 300px"
            >
              <el-option
                v-for="pkg in packageList"
                :key="pkg.id"
                :label="`${pkg.name} (${pkg.duration}天 / ¥${(pkg.price / 100).toFixed(2)})`"
                :value="Number(pkg.id)"
              />
            </el-select>
            <el-button
              type="primary"
              :loading="grantLoading"
              :disabled="!selectedPackageId"
              @click="handleGrantPackage"
            >
              开通
            </el-button>
          </div>
        </div>

        <!-- 已有套餐 -->
        <div class="section">
          <div class="section-title">
            已有套餐
          </div>
          <el-table :data="userPackages" style="width: 100%" empty-text="暂无套餐">
            <el-table-column prop="package_name" label="套餐名称" />
            <el-table-column label="类型" width="80">
              <template #default="{ row }">
                <el-tag :type="row.is_main ? 'primary' : 'info'" size="small">
                  {{ row.is_main ? '主套餐' : '附加' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="getPackageStatus(row.status).type" size="small">
                  {{ getPackageStatus(row.status).label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="expire_at" label="过期时间" width="160" />
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ row }">
                <el-button link type="danger" size="small" @click="handleDeletePackage(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 权益余额 -->
        <div class="section">
          <div class="section-title">
            权益余额
          </div>
          <el-table :data="userBenefits" style="width: 100%" empty-text="暂无权益">
            <el-table-column label="权益名称" min-width="120">
              <template #default="{ row }">
                {{ row.benefit?.name || `权益${row.benefit_id}` }}
              </template>
            </el-table-column>
            <el-table-column label="剩余/总量" width="140">
              <template #default="{ row }">
                <span :class="{ 'text-danger': getBenefitLeft(row) <= 0 }">
                  {{ getBenefitLeft(row) }} / {{ row.total_amount }} {{ row.benefit?.unit_name || '' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="isBenefitExpired(row) ? 'info' : 'success'" size="small">
                  {{ isBenefitExpired(row) ? '已过期' : '有效' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="expire_at" label="过期时间" width="160" />
          </el-table>
        </div>
      </div>
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

/* 套餐管理抽屉样式 */
.package-drawer-content {
  padding: 0 10px;
}

.section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.grant-form {
  display: flex;
  gap: 12px;
  align-items: center;
}

.text-danger {
  color: var(--el-color-danger);
}
</style>
