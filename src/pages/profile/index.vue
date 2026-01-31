<script lang="ts" setup>
import type { UpdatePasswordRequestData, UpdateProfileRequestData, UserInfo } from "@@/apis/users/type"
import type { FormInstance, FormRules } from "element-plus"
import { getCurrentUserApi, updatePasswordApi, updateProfileApi } from "@@/apis/users"
import { Avatar, Camera, Key, Phone, User } from "@element-plus/icons-vue"
import { uploadFileApi } from "@/api/upload"

defineOptions({
  name: "Profile"
})

// 用户信息
const userInfo = ref<UserInfo | null>(null)
const loading = ref(false)

// 角色映射
const roleMap: Record<string, string> = {
  super_admin: "超级管理员",
  agent: "代理商",
  normal_user: "普通用户"
}

// 格式化上次登录时间
function formatLastLogin(timestamp?: number) {
  if (!timestamp) return "暂无记录"
  const date = new Date(timestamp * 1000)
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).replace(/\//g, "-")
}

// 加载用户信息
async function loadUserInfo() {
  loading.value = true
  try {
    const { data } = await getCurrentUserApi()
    userInfo.value = data
  } catch (error) {
    console.error("加载用户信息失败", error)
  } finally {
    loading.value = false
  }
}

// ===== 修改用户名对话框 =====
const nameDialogVisible = ref(false)
const nameFormRef = ref<FormInstance>()
const nameForm = reactive({ name: "" })
const nameLoading = ref(false)

const nameRules: FormRules = {
  name: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 1, max: 50, message: "用户名长度在 1-50 个字符", trigger: "blur" }
  ]
}

function openNameDialog() {
  nameForm.name = userInfo.value?.name || ""
  nameDialogVisible.value = true
}

async function handleSaveName() {
  if (!nameFormRef.value) return
  await nameFormRef.value.validate(async (valid) => {
    if (!valid) return
    nameLoading.value = true
    try {
      const data: UpdateProfileRequestData = { name: nameForm.name }
      await updateProfileApi(data)
      ElMessage.success("修改成功")
      nameDialogVisible.value = false
      loadUserInfo()
    } catch (error) {
      console.error("修改失败", error)
    } finally {
      nameLoading.value = false
    }
  })
}

// ===== 修改手机号对话框 =====
const phoneDialogVisible = ref(false)
const phoneFormRef = ref<FormInstance>()
const phoneForm = reactive({ phone: "" })
const phoneLoading = ref(false)

const phoneRules: FormRules = {
  phone: [
    { required: true, message: "请输入手机号", trigger: "blur" },
    { pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号格式", trigger: "blur" }
  ]
}

function openPhoneDialog() {
  phoneForm.phone = ""
  phoneDialogVisible.value = true
}

async function handleSavePhone() {
  if (!phoneFormRef.value) return
  await phoneFormRef.value.validate(async (valid) => {
    if (!valid) return
    phoneLoading.value = true
    try {
      const data: UpdateProfileRequestData = { phone: phoneForm.phone }
      await updateProfileApi(data)
      ElMessage.success("修改成功")
      phoneDialogVisible.value = false
      loadUserInfo()
    } catch (error) {
      console.error("修改失败", error)
    } finally {
      phoneLoading.value = false
    }
  })
}

// ===== 修改密码对话框 =====
const passwordDialogVisible = ref(false)
const passwordFormRef = ref<FormInstance>()
const passwordForm = reactive({
  old_password: "",
  new_password: "",
  confirm_password: ""
})
const passwordLoading = ref(false)

function validateConfirmPassword(_rule: any, value: string, callback: any) {
  if (value !== passwordForm.new_password) {
    callback(new Error("两次输入的密码不一致"))
  } else {
    callback()
  }
}

const passwordRules: FormRules = {
  old_password: [
    { required: true, message: "请输入旧密码", trigger: "blur" },
    { min: 6, message: "密码长度不能少于6位", trigger: "blur" }
  ],
  new_password: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { min: 6, message: "密码长度不能少于6位", trigger: "blur" }
  ],
  confirm_password: [
    { required: true, message: "请再次输入新密码", trigger: "blur" },
    { validator: validateConfirmPassword, trigger: "blur" }
  ]
}

function openPasswordDialog() {
  passwordForm.old_password = ""
  passwordForm.new_password = ""
  passwordForm.confirm_password = ""
  passwordDialogVisible.value = true
}

async function handleSavePassword() {
  if (!passwordFormRef.value) return
  await passwordFormRef.value.validate(async (valid) => {
    if (!valid) return
    passwordLoading.value = true
    try {
      const data: UpdatePasswordRequestData = {
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password
      }
      await updatePasswordApi(data)
      ElMessage.success("密码修改成功")
      passwordDialogVisible.value = false
    } catch (error) {
      console.error("修改密码失败", error)
    } finally {
      passwordLoading.value = false
    }
  })
}

// ===== 头像上传 =====
const avatarInputRef = ref<HTMLInputElement>()
const avatarUploading = ref(false)

function triggerAvatarUpload() {
  avatarInputRef.value?.click()
}

async function handleAvatarChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // 验证文件类型
  if (!file.type.startsWith("image/")) {
    ElMessage.error("请选择图片文件")
    return
  }

  // 验证文件大小（最大 2MB）
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error("图片大小不能超过 2MB")
    return
  }

  avatarUploading.value = true
  try {
    // 上传图片
    const uploadRes = await uploadFileApi(file, "avatars")
    const avatarUrl = uploadRes.data.url

    // 更新头像
    const data: UpdateProfileRequestData = { avatar: avatarUrl }
    await updateProfileApi(data)

    ElMessage.success("头像更新成功")
    loadUserInfo()
  } catch (error) {
    console.error("上传头像失败", error)
    ElMessage.error("上传头像失败")
  } finally {
    avatarUploading.value = false
    // 清空 input，允许重复选择同一文件
    input.value = ""
  }
}

onMounted(() => {
  loadUserInfo()
})
</script>

<template>
  <div class="profile-container">
    <div v-loading="loading" class="profile-content">
      <!-- 基础信息卡片 -->
      <div class="info-card">
        <div class="info-card-header">
          <span>基础信息</span>
        </div>
        <div class="info-card-body">
          <div class="avatar-section" @click="triggerAvatarUpload">
            <el-avatar :size="80" :src="userInfo?.avatar" v-loading="avatarUploading">
              <el-icon :size="40">
                <Avatar />
              </el-icon>
            </el-avatar>
            <div class="avatar-overlay">
              <el-icon :size="20">
                <Camera />
              </el-icon>
            </div>
            <input
              ref="avatarInputRef"
              type="file"
              accept="image/*"
              style="display: none"
              @change="handleAvatarChange"
            >
          </div>
          <div class="basic-info">
            <div class="phone-display">
              {{ userInfo?.phone || "未设置手机号" }}
            </div>
            <div class="last-login">
              上次登录：{{ formatLastLogin(userInfo?.last_login) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 设置列表 -->
      <div class="settings-list">
        <!-- 用户名 -->
        <div class="setting-item">
          <div class="setting-icon" style="background: #e8f4fd;">
            <el-icon :size="20" color="#409eff">
              <User />
            </el-icon>
          </div>
          <div class="setting-content">
            <div class="setting-title">
              用户名
            </div>
            <div class="setting-desc">
              用于展示您在平台内显示的用户名称
            </div>
          </div>
          <div class="setting-value">
            {{ userInfo?.name || userInfo?.username || "未设置" }}
          </div>
          <el-button type="primary" @click="openNameDialog">
            更改
          </el-button>
        </div>

        <!-- 手机号 -->
        <div class="setting-item">
          <div class="setting-icon" style="background: #e8f4fd;">
            <el-icon :size="20" color="#409eff">
              <Phone />
            </el-icon>
          </div>
          <div class="setting-content">
            <div class="setting-title">
              手机号
            </div>
            <div class="setting-desc">
              用于登录时接收验证码等功能
            </div>
          </div>
          <div class="setting-value">
            {{ userInfo?.phone || "未设置" }}
          </div>
          <el-button type="primary" @click="openPhoneDialog">
            {{ userInfo?.phone ? "更改" : "设置" }}
          </el-button>
        </div>

        <!-- 角色 -->
        <div class="setting-item">
          <div class="setting-icon" style="background: #fef0e6;">
            <el-icon :size="20" color="#e6a23c">
              <Avatar />
            </el-icon>
          </div>
          <div class="setting-content">
            <div class="setting-title">
              角色
            </div>
            <div class="setting-desc">
              用于展示您在当前系统的角色
            </div>
          </div>
          <div class="setting-value">
            <template v-if="userInfo?.roles?.length">
              {{ userInfo.roles.map(r => roleMap[r] || r).join("、") }}
            </template>
            <template v-else>
              普通用户
            </template>
          </div>
        </div>

        <!-- 登录密码 -->
        <div class="setting-item">
          <div class="setting-icon" style="background: #e8f4fd;">
            <el-icon :size="20" color="#409eff">
              <Key />
            </el-icon>
          </div>
          <div class="setting-content">
            <div class="setting-title">
              登录密码
            </div>
            <div class="setting-desc">
              建议您定期更换密码，设置包含大小写字母、符号或数字三种组合且长度8-24位之间的密码
            </div>
          </div>
          <div class="setting-value">
            ******
          </div>
          <el-button type="primary" @click="openPasswordDialog">
            更改
          </el-button>
        </div>
      </div>
    </div>

    <!-- 修改用户名对话框 -->
    <el-dialog v-model="nameDialogVisible" title="修改用户名" width="400px" :close-on-click-modal="false">
      <el-form ref="nameFormRef" :model="nameForm" :rules="nameRules" label-width="80px">
        <el-form-item label="用户名" prop="name">
          <el-input v-model="nameForm.name" placeholder="请输入用户名" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="nameDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="nameLoading" @click="handleSaveName">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 修改手机号对话框 -->
    <el-dialog v-model="phoneDialogVisible" title="修改手机号" width="400px" :close-on-click-modal="false">
      <el-form ref="phoneFormRef" :model="phoneForm" :rules="phoneRules" label-width="80px">
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="phoneForm.phone" placeholder="请输入新手机号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="phoneDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="phoneLoading" @click="handleSavePhone">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 修改密码对话框 -->
    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="400px" :close-on-click-modal="false">
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="100px">
        <el-form-item label="旧密码" prop="old_password">
          <el-input v-model="passwordForm.old_password" type="password" placeholder="请输入旧密码" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="new_password">
          <el-input v-model="passwordForm.new_password" type="password" placeholder="请输入新密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirm_password">
          <el-input v-model="passwordForm.confirm_password" type="password" placeholder="请再次输入新密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="passwordLoading" @click="handleSavePassword">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.profile-container {
  padding: 20px;
}

.profile-content {
  min-height: 400px;
}

// 基础信息卡片
.info-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 20px;
  color: #fff;

  .info-card-header {
    font-size: 14px;
    opacity: 0.9;
    margin-bottom: 16px;
  }

  .info-card-body {
    display: flex;
    align-items: center;
    gap: 20px;

    .avatar-section {
      position: relative;
      cursor: pointer;

      .el-avatar {
        background: rgba(255, 255, 255, 0.2);
        border: 3px solid rgba(255, 255, 255, 0.3);
      }

      .avatar-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 28px;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 0 0 50% 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s;
      }

      &:hover .avatar-overlay {
        opacity: 1;
      }
    }

    .basic-info {
      .phone-display {
        font-size: 20px;
        font-weight: 500;
        margin-bottom: 8px;
      }

      .last-login {
        font-size: 13px;
        opacity: 0.8;
      }
    }
  }
}

// 设置列表
.settings-list {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

  .setting-item {
    display: flex;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    .setting-icon {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      flex-shrink: 0;
    }

    .setting-content {
      flex: 1;
      min-width: 0;

      .setting-title {
        font-size: 15px;
        font-weight: 500;
        color: #303133;
        margin-bottom: 4px;
      }

      .setting-desc {
        font-size: 13px;
        color: #909399;
        line-height: 1.5;
      }
    }

    .setting-value {
      font-size: 14px;
      color: #606266;
      margin-right: 16px;
      flex-shrink: 0;
    }

    .el-button {
      flex-shrink: 0;
    }
  }
}
</style>
