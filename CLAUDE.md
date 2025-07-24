# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

V3 Admin Vite 是一个基于现代前端技术构建的 Vue3 后台管理模板。这是一个精心制作的管理系统模板，使用 Vue3、Vite、TypeScript、Element Plus 等技术，包含多主题、多布局、权限管理等功能。

## 开发命令

### 包管理器
- 使用 `pnpm` 进行所有包管理操作
- 安装依赖：`pnpm i`

### 开发与构建
- 启动开发服务器：`pnpm dev`（运行在端口 3333）
- 构建预发布环境：`pnpm build:staging`
- 构建生产环境：`pnpm build`
- 本地预览构建：`pnpm preview`

### 代码质量与测试
- 代码检查和格式化：`pnpm lint`
- 运行单元测试：`pnpm test`
- TypeScript 类型检查：`vue-tsc`（包含在构建命令中）

## 技术栈

- **框架**：Vue 3.5+ 组合式 API 和 `<script setup>`
- **构建工具**：Vite 7+
- **开发语言**：TypeScript
- **UI 组件库**：Element Plus
- **状态管理**：Pinia
- **路由管理**：Vue Router 4
- **CSS**：Scss + UnoCSS 原子化 CSS
- **网络请求**：Axios
- **测试框架**：Vitest + happy-dom
- **代码质量**：ESLint + @antfu/eslint-config

## 项目架构

### 目录结构
- `src/common/` (`@@/`) - 通用工具、组件和资源
  - `apis/` - 通用接口定义
  - `assets/` - 静态资源（图标、图片、样式）
  - `components/` - 可复用组件
  - `composables/` - Vue 组合式函数
  - `constants/` - 应用常量
  - `utils/` - 工具函数
- `src/layouts/` - 布局组件（左侧、顶部、混合模式）
- `src/pages/` - 按功能组织的页面组件
- `src/pinia/` - Pinia 状态存储
- `src/router/` - Vue 路由配置
- `src/plugins/` - 全局插件和指令
- `src/http/` - HTTP 客户端配置

### 路径别名
- `@/` 指向 `src/`
- `@@/` 指向 `src/common/`

### 核心架构模式

**布局系统**：支持三种布局模式（左侧、顶部、混合），具备响应式设计和移动端兼容性。

**权限系统**：实现页面级（动态路由）和按钮级权限，使用基于角色的访问控制。

**主题系统**：多主题支持（普通、暗色、深蓝），使用 CSS 变量进行自定义。

**状态管理**：使用 Pinia 的 setup store 语法。主要存储：
- `user.ts` - 用户认证和数据
- `settings.ts` - 应用设置
- `permission.ts` - 路由权限
- `tags-view.ts` - 标签页导航

**HTTP 层**：集中式 axios 配置，包含：
- 请求/响应拦截器
- 基于 Token 的身份认证
- 用户友好的错误处理
- 开发环境 Mock API 集成

**组件组织**：
- 全局组件在 `src/common/components/`
- 功能特定组件在各自页面目录内
- Vue API 和 Element Plus 组件自动导入

### 开发模式

**Vue 开发**：
- 使用组合式 API 和 `<script setup lang="ts">`
- 组件命名：组件使用 PascalCase，页面使用 kebab-case
- Props：定义时使用 camelCase，模板中使用 kebab-case
- 优先使用 `ref` 而非 `reactive` 进行状态管理

**TypeScript**：
- 启用严格模式
- 类型定义在 `types/` 目录
- 组件和导入的自动生成类型

**样式**：
- 优先使用作用域 CSS：`<style scoped lang="scss">`
- 使用 CSS 变量进行主题化
- UnoCSS 快捷方式：`wh-full`、`flex-center` 等

## 代码质量标准

- 使用 @antfu/eslint-config 配置
- 字符串使用双引号，不使用分号
- 2 空格缩进
- Husky 预提交钩子进行代码格式化
- 生产构建中移除 console.log/debugger

## 开发服务器配置

- 启用热重载
- `/api/v1` 端点代理配置
- 启动时自动打开浏览器
- 开发环境启用 CORS

## 测试配置

- Vitest + happy-dom 环境
- 测试文件在 `tests/` 目录
- Element Plus 内联依赖配置