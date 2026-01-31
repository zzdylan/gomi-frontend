<script lang="ts" setup>
import type { UserBenefitSummary } from "@@/apis/users/type"
import { getMyBenefitsApi } from "@@/apis/users"
import Notify from "@@/components/Notify/index.vue"
import Screenfull from "@@/components/Screenfull/index.vue"
import SearchMenu from "@@/components/SearchMenu/index.vue"
import ThemeSwitch from "@@/components/ThemeSwitch/index.vue"
import { useDevice } from "@@/composables/useDevice"
import { useLayoutMode } from "@@/composables/useLayoutMode"
import { UserFilled } from "@element-plus/icons-vue"
import { useAppStore } from "@/pinia/stores/app"
import { useSettingsStore } from "@/pinia/stores/settings"
import { useUserStore } from "@/pinia/stores/user"
import { Breadcrumb, Hamburger, Sidebar } from "../index"

const { isMobile } = useDevice()

const { isTop } = useLayoutMode()

const router = useRouter()

const appStore = useAppStore()

const userStore = useUserStore()

const settingsStore = useSettingsStore()

const { showNotify, showThemeSwitch, showScreenfull, showSearchMenu } = storeToRefs(settingsStore)

/** 切换侧边栏 */
function toggleSidebar() {
  appStore.toggleSidebar(false)
}

/** 登出 */
function logout() {
  userStore.logout()
  router.push("/login")
}

// 角色映射
const roleMap: Record<string, string> = {
  super_admin: "超级管理员",
  agent: "代理商",
  normal_user: "普通用户"
}

function getRoleLabel(role: string) {
  return roleMap[role] || role
}

// 权益数据
const benefits = ref<UserBenefitSummary[]>([])
const benefitsLoading = ref(false)
const pageSize = 3 // 每页显示3个权益

// 按页分组权益
const benefitPages = computed(() => {
  const pages: UserBenefitSummary[][] = []
  for (let i = 0; i < benefits.value.length; i += pageSize) {
    pages.push(benefits.value.slice(i, i + pageSize))
  }
  return pages
})

// 下拉菜单打开时获取权益
async function handleDropdownVisible(visible: boolean) {
  if (visible) {
    benefitsLoading.value = true
    try {
      const { data } = await getMyBenefitsApi()
      benefits.value = data.items || []
    } catch {
      benefits.value = []
    } finally {
      benefitsLoading.value = false
    }
  }
}
</script>

<template>
  <div class="navigation-bar">
    <Hamburger
      v-if="!isTop || isMobile"
      :is-active="appStore.sidebar.opened"
      class="hamburger"
      @toggle-click="toggleSidebar"
    />
    <Breadcrumb v-if="!isTop || isMobile" class="breadcrumb" />
    <Sidebar v-if="isTop && !isMobile" class="sidebar" />
    <div class="right-menu">
      <SearchMenu v-if="showSearchMenu" class="right-menu-item" />
      <Screenfull v-if="showScreenfull" class="right-menu-item" />
      <ThemeSwitch v-if="showThemeSwitch" class="right-menu-item" />
      <Notify v-if="showNotify" class="right-menu-item" />
      <el-dropdown @visible-change="handleDropdownVisible">
        <div class="right-menu-item user">
          <el-avatar
            :src="userStore.avatar"
            :icon="UserFilled"
            :size="30"
          />
          <span>{{ userStore.username }}</span>
        </div>
        <template #dropdown>
          <div class="user-dropdown-content">
            <!-- 用户信息 -->
            <div class="user-info">
              <el-avatar :src="userStore.avatar" :icon="UserFilled" :size="50" />
              <div class="user-detail">
                <div class="username">
                  {{ userStore.username }}
                </div>
                <div class="user-roles">
                  <el-tag
                    v-for="role in userStore.roles"
                    :key="role"
                    size="small"
                    type="info"
                  >
                    {{ getRoleLabel(role) }}
                  </el-tag>
                </div>
              </div>
            </div>
            <!-- 权益卡片 -->
            <div v-loading="benefitsLoading" class="benefits-card">
              <el-carousel
                v-if="benefits.length > 0"
                height="90px"
                :autoplay="false"
                indicator-position="outside"
                arrow="always"
              >
                <el-carousel-item v-for="(page, index) in benefitPages" :key="index">
                  <div class="benefits-list">
                    <div v-for="benefit in page" :key="benefit.benefit_id" class="benefit-item">
                      <div class="benefit-value">
                        {{ benefit.total_left }}<span class="benefit-unit">{{ benefit.unit_name }}</span>
                      </div>
                      <div class="benefit-label">
                        {{ benefit.benefit_name }}
                      </div>
                    </div>
                  </div>
                </el-carousel-item>
              </el-carousel>
              <div v-else class="no-benefits">
                暂无权益
              </div>
            </div>
            <!-- 菜单 -->
            <el-dropdown-menu>
              <el-dropdown-item @click="router.push('/profile')">
                个人中心
              </el-dropdown-item>
              <el-dropdown-item @click="logout">
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </div>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.navigation-bar {
  height: var(--v3-navigationbar-height);
  overflow: hidden;
  color: var(--v3-navigationbar-text-color);
  display: flex;
  justify-content: space-between;
  .hamburger {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 15px;
    cursor: pointer;
  }
  .breadcrumb {
    flex: 1;
    // 参考 Bootstrap 的响应式设计将宽度设置为 576
    @media screen and (max-width: 576px) {
      display: none;
    }
  }
  .sidebar {
    flex: 1;
    // 设置 min-width 是为了让 Sidebar 里的 el-menu 宽度自适应
    min-width: 0px;
    :deep(.el-menu) {
      background-color: transparent;
    }
    :deep(.el-sub-menu) {
      &.is-active {
        .el-sub-menu__title {
          color: var(--el-color-primary);
        }
      }
    }
  }
  .right-menu {
    margin-right: 10px;
    height: 100%;
    display: flex;
    align-items: center;
    &-item {
      margin: 0 10px;
      cursor: pointer;
      &:last-child {
        margin-left: 20px;
      }
    }
    .user {
      display: flex;
      align-items: center;
      .el-avatar {
        margin-right: 10px;
      }
      span {
        font-size: 16px;
      }
    }
  }
}

// 用户下拉菜单内容
.user-dropdown-content {
  padding: 16px;
  min-width: 420px;

  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;

    .user-detail {
      .username {
        font-size: 16px;
        font-weight: 500;
        color: #303133;
      }

      .user-roles {
        display: flex;
        gap: 4px;
        margin-top: 4px;
      }
    }
  }

  .benefits-card {
    background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
    border-radius: 12px;
    padding: 16px 12px;
    margin-bottom: 12px;
    min-height: 100px;

    :deep(.el-carousel) {
      .el-carousel__arrow {
        background: rgba(255, 255, 255, 0.15);
        width: 28px;
        height: 28px;

        &:hover {
          background: rgba(255, 255, 255, 0.25);
        }
      }

      .el-carousel__indicators--outside {
        margin-top: 8px;

        .el-carousel__button {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
        }

        .is-active .el-carousel__button {
          background: #fff;
        }
      }
    }

    .benefits-list {
      display: flex;
      justify-content: space-around;
      height: 100%;
      align-items: center;
      padding: 0 40px;
    }

    .benefit-item {
      text-align: center;
      color: #fff;
      min-width: 70px;

      .benefit-value {
        font-size: 24px;
        font-weight: 600;
        color: #fff;

        .benefit-unit {
          font-size: 12px;
          font-weight: 400;
          margin-left: 2px;
        }
      }

      .benefit-label {
        font-size: 12px;
        color: #8b9cb3;
        margin-top: 4px;
        white-space: nowrap;
      }
    }

    .no-benefits {
      color: #8b9cb3;
      text-align: center;
      padding: 20px 0;
    }
  }

  :deep(.el-dropdown-menu) {
    border: none;
    box-shadow: none;
    padding: 0;
    margin: 0;

    .el-dropdown-menu__item {
      padding: 12px 0;
      border-top: 1px solid #ebeef5;
    }
  }
}
</style>
