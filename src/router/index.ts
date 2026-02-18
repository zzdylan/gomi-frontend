import type { RouteRecordRaw } from "vue-router"
import { createRouter } from "vue-router"
import { routerConfig } from "@/router/config"
import { registerNavigationGuard } from "@/router/guard"
import { flatMultiLevelRoutes } from "./helper"

const Layouts = () => import("@/layouts/index.vue")

/**
 * @name 常驻路由
 * @description 除了 redirect/403/404/login 等隐藏页面，其他页面建议设置唯一的 Name 属性
 */
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: "/redirect",
    component: Layouts,
    meta: {
      hidden: true
    },
    children: [
      {
        path: ":path(.*)",
        component: () => import("@/pages/redirect/index.vue")
      }
    ]
  },
  {
    path: "/403",
    component: () => import("@/pages/error/403.vue"),
    meta: {
      hidden: true
    }
  },
  {
    path: "/404",
    component: () => import("@/pages/error/404.vue"),
    meta: {
      hidden: true
    },
    alias: "/:pathMatch(.*)*"
  },
  {
    path: "/login",
    component: () => import("@/pages/login/index.vue"),
    meta: {
      hidden: true
    }
  },
  {
    path: "/",
    component: Layouts,
    redirect: "/dashboard",
    children: [
      {
        path: "dashboard",
        component: () => import("@/pages/dashboard/index.vue"),
        name: "Dashboard",
        meta: {
          title: "首页",
          svgIcon: "dashboard",
          affix: true
        }
      }
    ]
  },
  {
    path: "/profile",
    component: Layouts,
    meta: {
      hidden: true
    },
    children: [
      {
        path: "",
        component: () => import("@/pages/profile/index.vue"),
        name: "Profile",
        meta: {
          title: "个人中心"
        }
      }
    ]
  }
  // 示例路由 - 已注释，可作为参考
  // {
  //   path: "/demo",
  //   component: Layouts,
  //   redirect: "/demo/unocss",
  //   name: "Demo",
  //   meta: {
  //     title: "示例集合",
  //     elIcon: "DataBoard"
  //   },
  //   children: [
  //     {
  //       path: "unocss",
  //       component: () => import("@/pages/demo/unocss/index.vue"),
  //       name: "UnoCSS",
  //       meta: {
  //         title: "UnoCSS"
  //       }
  //     },
  //     {
  //       path: "element-plus",
  //       component: () => import("@/pages/demo/element-plus/index.vue"),
  //       name: "ElementPlus",
  //       meta: {
  //         title: "Element Plus",
  //         keepAlive: false
  //       }
  //     },
  //     {
  //       path: "vxe-table",
  //       component: () => import("@/pages/demo/vxe-table/index.vue"),
  //       name: "VxeTable",
  //       meta: {
  //         title: "Vxe Table",
  //         keepAlive: false
  //       }
  //     },
  //     {
  //       path: "level2",
  //       component: () => import("@/pages/demo/level2/index.vue"),
  //       redirect: "/demo/level2/level3",
  //       name: "Level2",
  //       meta: {
  //         title: "二级路由",
  //         alwaysShow: true
  //       },
  //       children: [
  //         {
  //           path: "level3",
  //           component: () => import("@/pages/demo/level2/level3/index.vue"),
  //           name: "Level3",
  //           meta: {
  //             title: "三级路由",
  //             keepAlive: false
  //           }
  //         }
  //       ]
  //     },
  //     {
  //       path: "composable-demo",
  //       redirect: "/demo/composable-demo/use-fetch-select",
  //       name: "ComposableDemo",
  //       meta: {
  //         title: "组合式函数"
  //       },
  //       children: [
  //         {
  //           path: "use-fetch-select",
  //           component: () => import("@/pages/demo/composable-demo/use-fetch-select.vue"),
  //           name: "UseFetchSelect",
  //           meta: {
  //             title: "useFetchSelect"
  //           }
  //         },
  //         {
  //           path: "use-fullscreen-loading",
  //           component: () => import("@/pages/demo/composable-demo/use-fullscreen-loading.vue"),
  //           name: "UseFullscreenLoading",
  //           meta: {
  //             title: "useFullscreenLoading"
  //           }
  //         },
  //         {
  //           path: "use-watermark",
  //           component: () => import("@/pages/demo/composable-demo/use-watermark.vue"),
  //           name: "UseWatermark",
  //           meta: {
  //             title: "useWatermark"
  //           }
  //         }
  //       ]
  //     }
  //   ]
  // },
  // {
  //   path: "/link",
  //   meta: {
  //     title: "文档链接",
  //     elIcon: "Link"
  //   },
  //   children: [
  //     {
  //       path: "https://juejin.cn/post/7445151895121543209",
  //       component: () => {},
  //       name: "Link1",
  //       meta: {
  //         title: "中文文档"
  //       }
  //     },
  //     {
  //       path: "https://juejin.cn/column/7207659644487139387",
  //       component: () => {},
  //       name: "Link2",
  //       meta: {
  //         title: "新手教程"
  //       }
  //     }
  //   ]
  // }
]

/**
 * @name 动态路由
 * @description 用来放置有权限 (Roles 属性) 的路由
 * @description 必须带有唯一的 Name 属性
 */
export const dynamicRoutes: RouteRecordRaw[] = [
  // Demo管理 - 超级管理员和普通用户可见（代理商不可见）
  {
    path: "/demo",
    component: Layouts,
    redirect: "/demo/demo-list",
    name: "Demo",
    meta: {
      title: "Demo管理",
      elIcon: "DataBoard",
      roles: ["super_admin", "normal_user"]
    },
    children: [
      {
        path: "demo-list",
        component: () => import("@/pages/demo/demo-list/index.vue"),
        name: "DemoList",
        meta: {
          title: "Demo列表",
          keepAlive: false,
          roles: ["super_admin", "normal_user"]
        }
      },
      {
        path: "demo-drawer",
        component: () => import("@/pages/demo/demo-drawer/index.vue"),
        name: "DemoDrawer",
        meta: {
          title: "Demo抽屉",
          keepAlive: false,
          roles: ["super_admin", "normal_user"]
        }
      }
    ]
  },
  // 创作空间 - 超级管理员和普通用户可见（代理商不可见）
  {
    path: "/creative",
    component: Layouts,
    name: "Creative",
    meta: {
      title: "创作空间",
      elIcon: "Picture",
      alwaysShow: true,
      roles: ["super_admin", "normal_user"]
    },
    children: [
      {
        path: "template",
        component: () => import("@/pages/template-manage/index.vue"),
        name: "TemplateManage",
        meta: {
          title: "模板库",
          keepAlive: false,
          roles: ["super_admin", "normal_user"]
        }
      },
      {
        path: "template/editor",
        component: () => import("@/pages/template-editor/index-konva.vue"),
        name: "TemplateEditorKonva",
        meta: {
          title: "模板编辑器",
          keepAlive: false,
          hidden: true,
          roles: ["super_admin", "normal_user"]
        }
      },
      {
        path: "material",
        component: () => import("@/pages/material/index.vue"),
        name: "MaterialLibrary",
        meta: {
          title: "素材库",
          keepAlive: false,
          roles: ["super_admin", "normal_user"]
        }
      },
      {
        path: "copy-library",
        component: () => import("@/pages/copy-library/index.vue"),
        name: "CopyLibraryList",
        meta: {
          title: "文案库",
          keepAlive: false,
          roles: ["super_admin", "normal_user"]
        }
      },
      {
        path: "copy-library/combine",
        component: () => import("@/pages/copy-library/combine.vue"),
        name: "CopyLibraryCombine",
        meta: {
          title: "组合文案",
          keepAlive: false,
          hidden: true,
          roles: ["super_admin", "normal_user"]
        }
      },
      {
        path: "copy-library/smart",
        component: () => import("@/pages/copy-library/smart.vue"),
        name: "CopyLibrarySmart",
        meta: {
          title: "智能文案",
          keepAlive: false,
          hidden: true,
          roles: ["super_admin", "normal_user"]
        }
      },
      {
        path: "composition",
        component: () => import("@/pages/composition/index.vue"),
        name: "CompositionLibrary",
        meta: {
          title: "作品集",
          keepAlive: false,
          roles: ["super_admin", "normal_user"]
        }
      },
      {
        path: "xunclip",
        component: () => import("@/pages/xunclip/projects.vue"),
        name: "XunClipProjects",
        meta: {
          title: "讯剪",
          keepAlive: true,
          roles: ["super_admin", "normal_user"]
        }
      },
      {
        path: "xunclip/editor",
        component: () => import("@/pages/xunclip/index.vue"),
        name: "XunClipSubmit",
        meta: {
          title: "讯剪编辑器",
          keepAlive: false,
          hidden: true,
          roles: ["super_admin", "normal_user"]
        }
      }
    ]
  },
  // 模板编辑器独立页面 - 超级管理员和普通用户可见
  {
    path: "/template-editor",
    component: () => import("@/pages/template-editor/index-konva.vue"),
    name: "TemplateEditor",
    meta: {
      title: "模板编辑器",
      hidden: true,
      roles: ["super_admin", "normal_user"]
    }
  },
  {
    path: "/admin",
    component: Layouts,
    redirect: "/admin/user",
    name: "Admin",
    meta: {
      title: "后台管理",
      elIcon: "Setting",
      roles: ["super_admin", "level1_agent", "level2_agent", "level3_agent"],
      alwaysShow: true
    },
    children: [
      {
        path: "user",
        component: () => import("@/pages/user/index.vue"),
        name: "UserManagement",
        meta: {
          title: "用户管理",
          keepAlive: false,
          // 所有代理商都能看用户管理（后端会过滤只显示自己的用户）
          roles: ["super_admin", "level1_agent", "level2_agent", "level3_agent"]
        }
      },
      {
        path: "role",
        component: () => import("@/pages/role/index.vue"),
        name: "RoleManagement",
        meta: {
          title: "角色管理",
          keepAlive: false,
          // 角色管理仅超级管理员可见
          roles: ["super_admin"]
        }
      }
    ]
  },
  {
    path: "/agent",
    component: Layouts,
    redirect: "/agent/index",
    name: "Agent",
    meta: {
      title: "代理商管理",
      elIcon: "UserFilled",
      // level1和level2代理可以管理下级代理，level3没有下级代理所以不显示
      roles: ["super_admin", "level1_agent", "level2_agent"]
    },
    children: [
      {
        path: "index",
        component: () => import("@/pages/agent/index.vue"),
        name: "AgentManagement",
        meta: {
          title: "代理商管理",
          elIcon: "UserFilled",
          keepAlive: false,
          roles: ["super_admin", "level1_agent", "level2_agent"]
        }
      }
    ]
  },
  {
    path: "/package-system",
    component: Layouts,
    redirect: "/package-system/product",
    name: "PackageSystem",
    meta: {
      title: "套餐管理",
      elIcon: "Box",
      roles: ["super_admin"],
      alwaysShow: true
    },
    children: [
      {
        path: "product",
        component: () => import("@/pages/product/index.vue"),
        name: "ProductManagement",
        meta: {
          title: "产品管理",
          keepAlive: false,
          roles: ["super_admin"]
        }
      },
      {
        path: "benefit",
        component: () => import("@/pages/benefit/index.vue"),
        name: "BenefitManagement",
        meta: {
          title: "权益管理",
          keepAlive: false,
          roles: ["super_admin"]
        }
      },
      {
        path: "package",
        component: () => import("@/pages/package/index.vue"),
        name: "PackageManagement",
        meta: {
          title: "套餐管理",
          keepAlive: false,
          roles: ["super_admin"]
        }
      }
    ]
  },
  {
    path: "/system-config",
    component: Layouts,
    redirect: "/system-config/service",
    name: "SystemConfig",
    meta: {
      title: "系统配置",
      elIcon: "Tools",
      roles: ["super_admin"],
      alwaysShow: true
    },
    children: [
      {
        path: "service",
        component: () => import("@/pages/service-config/index.vue"),
        name: "ServiceConfigManagement",
        meta: {
          title: "服务配置",
          keepAlive: false,
          roles: ["super_admin"]
        }
      },
      {
        path: "ai-provider",
        component: () => import("@/pages/ai-provider/index.vue"),
        name: "AiProviderManagement",
        meta: {
          title: "AI厂商",
          keepAlive: false,
          roles: ["super_admin"]
        }
      },
      {
        path: "ai-scene",
        component: () => import("@/pages/ai-scene-config/index.vue"),
        name: "AiSceneConfigManagement",
        meta: {
          title: "AI场景配置",
          keepAlive: false,
          roles: ["super_admin"]
        }
      }
    ]
  },
  {
    path: "/permission",
    component: Layouts,
    redirect: "/permission/page-level",
    name: "Permission",
    meta: {
      title: "权限演示",
      elIcon: "Lock",
      // 可以在根路由中设置角色
      roles: ["admin", "editor"],
      alwaysShow: true
    },
    children: [
      {
        path: "page-level",
        component: () => import("@/pages/demo/permission/page-level.vue"),
        name: "PermissionPageLevel",
        meta: {
          title: "页面级",
          // 或者在子路由中设置角色
          roles: ["admin"]
        }
      },
      {
        path: "button-level",
        component: () => import("@/pages/demo/permission/button-level.vue"),
        name: "PermissionButtonLevel",
        meta: {
          title: "按钮级",
          // 如果未设置角色，则表示：该页面不需要权限，但会继承根路由的角色
          roles: undefined
        }
      }
    ]
  }
]

/** 路由实例 */
export const router = createRouter({
  history: routerConfig.history,
  routes: routerConfig.thirdLevelRouteCache ? flatMultiLevelRoutes(constantRoutes) : constantRoutes
})

/** 重置路由 */
export function resetRouter() {
  try {
    // 注意：所有动态路由路由必须带有 Name 属性，否则可能会不能完全重置干净
    router.getRoutes().forEach((route) => {
      const { name, meta } = route
      if (name && meta.roles?.length) {
        router.hasRoute(name) && router.removeRoute(name)
      }
    })
  } catch {
    // 强制刷新浏览器也行，只是交互体验不是很好
    location.reload()
  }
}

// 注册路由导航守卫
registerNavigationGuard(router)
