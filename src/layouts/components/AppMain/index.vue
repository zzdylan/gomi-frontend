<script lang="ts" setup>
import { Close } from "@element-plus/icons-vue"
import { useSettingsStore } from "@/pinia/stores/settings"
import { useTagsViewStore } from "@/pinia/stores/tags-view"
import { useUserStore } from "@/pinia/stores/user"
import { Footer } from "../index"

const tagsViewStore = useTagsViewStore()

const settingsStore = useSettingsStore()

const userStore = useUserStore()

// 模拟登录状态
const impersonateUsername = ref(localStorage.getItem("impersonate_username") || "")
const adminBackupUsername = ref(localStorage.getItem("admin_backup_username") || "")
const isImpersonating = computed(() => !!impersonateUsername.value)
const showImpersonateBar = ref(true)

// 返回管理后台
function handleReturnToAdmin() {
  const backupToken = localStorage.getItem("admin_backup_token")
  if (!backupToken) {
    ElMessage.error("无法返回管理后台")
    return
  }

  // 清除模拟登录状态
  localStorage.removeItem("impersonate_username")
  localStorage.removeItem("admin_backup_token")
  localStorage.removeItem("admin_backup_username")

  // 恢复管理员 token
  userStore.setToken(backupToken)

  ElMessage.success("已返回管理后台")

  // 跳转到首页
  location.href = "/"
}
</script>

<template>
  <section class="app-main">
    <div class="app-scrollbar">
      <!-- 模拟登录提示条 -->
      <div v-if="isImpersonating && showImpersonateBar" class="impersonate-bar">
        <span>您正在以「{{ impersonateUsername }}」身份登录</span>
        <el-button type="primary" size="small" @click="handleReturnToAdmin">
          返回{{ adminBackupUsername }}管理后台
        </el-button>
        <el-icon class="close-btn" @click="showImpersonateBar = false">
          <Close />
        </el-icon>
      </div>
      <!-- key 采用 route.path 和 route.fullPath 有着不同的效果，大多数时候 path 更通用 -->
      <router-view v-slot="{ Component, route }">
        <transition name="el-fade-in" mode="out-in">
          <keep-alive :include="tagsViewStore.cachedViews">
            <component :is="Component" :key="route.path" class="app-container-grow" />
          </keep-alive>
        </transition>
      </router-view>
      <!-- 页脚 -->
      <Footer v-if="settingsStore.showFooter" />
    </div>
    <!-- 返回顶部 -->
    <el-backtop />
    <!-- 返回顶部（固定 Header 情况下） -->
    <el-backtop target=".app-scrollbar" />
  </section>
</template>

<style lang="scss" scoped>
@import "@@/assets/styles/mixins.scss";

.app-main {
  width: 100%;
  display: flex;
}

.app-scrollbar {
  flex-grow: 1;
  overflow: auto;
  @extend %scrollbar;
  display: flex;
  flex-direction: column;
  .app-container-grow {
    flex-grow: 1;
  }
}

.impersonate-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #ff9a56 0%, #ff6b35 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  position: relative;

  .el-button {
    background-color: #fff;
    color: #ff6b35;
    border: none;

    &:hover {
      background-color: #f5f5f5;
    }
  }

  .close-btn {
    position: absolute;
    right: 16px;
    cursor: pointer;
    font-size: 16px;
    opacity: 0.8;

    &:hover {
      opacity: 1;
    }
  }
}
</style>
