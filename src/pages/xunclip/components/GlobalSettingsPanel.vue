<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import type { GlobalSettings, LocalSettings } from "../apis/type"
import type { CopyLibraryItem } from "@/pages/copy-library/apis/type"
import type { TemplateInfoItem, TemplateItem } from "@/pages/template-manage/apis/type"
import { Close, Plus } from "@element-plus/icons-vue"
import TemplateSelector from "@/common/components/TemplateSelector/index.vue"
import { getCopyLibraryListApi } from "@/pages/copy-library/apis"
import { batchInfoTemplateApi } from "@/pages/template-manage/apis"
import BackgroundSettingsForm from "./BackgroundSettingsForm.vue"
import CopySettingsForm from "./CopySettingsForm.vue"
import VoiceSettingsForm from "./VoiceSettingsForm.vue"

interface Props {
  settings: GlobalSettings
  /** 是否全局模式 */
  isGlobalMode?: boolean
  /** 局部模式下当前场景的局部设置 */
  localSettings?: LocalSettings | null
}

const props = withDefaults(defineProps<Props>(), {
  isGlobalMode: true,
  localSettings: null
})

// Tab 切换
const activeTab = ref<"copy" | "template" | "bgm">("copy")

// 模板选择
const templateDialogVisible = ref(false)
const selectedTemplates = ref<TemplateInfoItem[]>([])

function handleTemplatesSelected(templates: TemplateItem[]) {
  const existingIds = new Set(selectedTemplates.value.map(t => t.id))
  const newItems = templates.filter(t => !existingIds.has(t.id))
  for (const t of newItems) {
    selectedTemplates.value.push({ id: t.id, name: t.name, thumbnail: t.thumbnail })
  }
  props.settings.template_ids = selectedTemplates.value.map(t => t.id)
}

function removeTemplate(index: number) {
  selectedTemplates.value.splice(index, 1)
  props.settings.template_ids = selectedTemplates.value.map(t => t.id)
}

// 回显已选模板：根据 template_ids 批量获取模板信息
watch(() => props.settings.template_ids, async (ids) => {
  if (!ids || ids.length === 0) {
    selectedTemplates.value = []
    return
  }
  // 过滤掉已有的
  const existingIds = new Set(selectedTemplates.value.map(t => t.id))
  const missingIds = ids.filter(id => !existingIds.has(id))
  if (missingIds.length === 0) return
  try {
    const { data } = await batchInfoTemplateApi({ ids: missingIds })
    selectedTemplates.value.push(...data.templates)
  } catch {
    console.error("加载模板信息失败")
  }
}, { immediate: true })

// 局部模式：文案库列表
const copyLibraries = ref<CopyLibraryItem[]>([])
const loadingCopyLibraries = ref(false)

async function loadCopyLibraries() {
  loadingCopyLibraries.value = true
  try {
    const { data } = await getCopyLibraryListApi({ per_page: 100 })
    copyLibraries.value = data.items
  } catch {
    console.error("加载文案库失败")
  } finally {
    loadingCopyLibraries.value = false
  }
}

// 局部模式下需要加载文案库列表
watch(() => props.isGlobalMode, (isGlobal) => {
  if (!isGlobal && copyLibraries.value.length === 0) {
    loadCopyLibraries()
  }
}, { immediate: true })
</script>

<template>
  <div class="global-settings-panel">
    <!-- 标题区 -->
    <div class="panel-header">
      <h3>视频配置</h3>
      <p class="panel-subtitle">
        设置视频各分镜的配置属性
      </p>
    </div>

    <!-- 基础设置 -->
    <div class="basic-settings">
      <el-form label-position="left" size="small" label-width="70px">
        <el-form-item label="素材复用">
          <el-switch v-model="settings.allow_repeat" active-text="允许重复" />
        </el-form-item>
      </el-form>
    </div>

    <!-- 图标 Tab 导航 -->
    <div class="tab-nav">
      <div
        class="tab-item"
        :class="{ active: activeTab === 'copy' }"
        @click="activeTab = 'copy'"
      >
        <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" class="tab-icon">
          <path fill="currentColor" d="M256 128h512a64 64 0 0 1 64 64v640a64 64 0 0 1-64 64H256a64 64 0 0 1-64-64V192a64 64 0 0 1 64-64zm0 64v640h512V192H256zm96 128h320v64H352V320zm0 128h320v64H352V448zm0 128h192v64H352V576z" />
        </svg>
        <span>文案配音</span>
      </div>
      <div
        class="tab-item"
        :class="{ active: activeTab === 'template' }"
        @click="activeTab = 'template'"
      >
        <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" class="tab-icon">
          <path fill="currentColor" d="M160 128h288a32 32 0 0 1 32 32v288a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32V160a32 32 0 0 1 32-32zm0 64v224h224V192H160zm416-64h288a32 32 0 0 1 32 32v288a32 32 0 0 1-32 32H576a32 32 0 0 1-32-32V160a32 32 0 0 1 32-32zm0 64v224h224V192H576zM160 544h288a32 32 0 0 1 32 32v288a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32V576a32 32 0 0 1 32-32zm0 64v224h224V608H160zm416-64h288a32 32 0 0 1 32 32v288a32 32 0 0 1-32 32H576a32 32 0 0 1-32-32V576a32 32 0 0 1 32-32zm0 64v224h224V608H576z" />
        </svg>
        <span>模板</span>
        <el-badge v-if="selectedTemplates.length" :value="selectedTemplates.length" class="tab-badge" />
      </div>
      <div
        class="tab-item"
        :class="{ active: activeTab === 'bgm' }"
        @click="activeTab = 'bgm'"
      >
        <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" class="tab-icon">
          <path fill="currentColor" d="M725.333 128a42.667 42.667 0 0 1 42.667 42.667v554.666A170.667 170.667 0 1 1 640 554.667V356.267L384 433.067v335.6A170.667 170.667 0 1 1 256 597.333V213.333a42.667 42.667 0 0 1 30.72-40.96l384-117.333A42.667 42.667 0 0 1 725.333 128zM213.333 768a85.333 85.333 0 1 0 85.334-85.333 85.333 85.333 0 0 0-85.334 85.333zm426.667-42.667a85.333 85.333 0 1 0 85.333-85.333 85.333 85.333 0 0 0-85.333 85.333zM682.667 213.333 341.333 317.867v29.866l341.334-104.533V213.333z" />
        </svg>
        <span>背景音乐</span>
      </div>
    </div>

    <!-- Tab 内容 -->
    <div class="tab-content">
      <!-- 文案配音 -->
      <div v-show="activeTab === 'copy'" class="tab-pane">
        <!-- 文案描述：全局模式用 CopySettingsForm，局部模式用文案库选择器 -->
        <div class="pane-section">
          <h4 class="pane-section-title">
            文案描述
          </h4>
          <CopySettingsForm v-if="isGlobalMode" v-model="settings.copy" />
          <el-form v-else-if="localSettings" label-position="top" size="small">
            <el-form-item label="文案库">
              <el-select
                v-model="localSettings.copy_id"
                placeholder="选择文案库"
                clearable
                filterable
                :loading="loadingCopyLibraries"
                style="width: 100%"
              >
                <el-option
                  v-for="lib in copyLibraries"
                  :key="lib.id"
                  :label="lib.name"
                  :value="lib.id"
                />
              </el-select>
            </el-form-item>
          </el-form>
          <div v-else class="pane-empty">
            请在左侧选择一个场景
          </div>
        </div>

        <!-- 设置配音（始终使用全局设置） -->
        <div class="pane-section">
          <h4 class="pane-section-title">
            设置配音
          </h4>
          <VoiceSettingsForm v-model="settings.voice" />
        </div>
      </div>

      <!-- 模板（始终使用全局设置） -->
      <div v-show="activeTab === 'template'" class="tab-pane">
        <div class="template-grid">
          <div class="template-add-card" @click="templateDialogVisible = true">
            <el-icon :size="28">
              <Plus />
            </el-icon>
            <span>选择模板</span>
          </div>
          <div
            v-for="(tpl, index) in selectedTemplates"
            :key="tpl.id"
            class="template-card"
          >
            <img v-if="tpl.thumbnail" :src="tpl.thumbnail" :alt="tpl.name" crossorigin="anonymous">
            <div v-else class="no-thumb">
              {{ tpl.name }}
            </div>
            <div class="template-card-name" :title="tpl.name">
              {{ tpl.name }}
            </div>
            <div class="template-card-remove" @click="removeTemplate(index)">
              <el-icon :size="12">
                <Close />
              </el-icon>
            </div>
          </div>
        </div>
        <div v-if="selectedTemplates.length" class="template-count">
          已选 {{ selectedTemplates.length }} 个模板，随机使用
        </div>
      </div>

      <!-- 背景音乐（始终使用全局设置） -->
      <div v-show="activeTab === 'bgm'" class="tab-pane">
        <BackgroundSettingsForm v-model="settings.background" />
      </div>
    </div>

    <!-- 模板选择弹窗 -->
    <el-dialog
      v-model="templateDialogVisible"
      title="选择模板"
      width="900px"
      :close-on-click-modal="false"
      append-to-body
      destroy-on-close
    >
      <TemplateSelector
        multiple
        @select-multiple="handleTemplatesSelected"
        @close="templateDialogVisible = false"
      />
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.global-settings-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 标题区 */
.panel-header {
  padding: 20px 20px 16px;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }

  .panel-subtitle {
    margin: 4px 0 0;
    font-size: 13px;
    color: #909399;
  }
}

/* 基础设置 */
.basic-settings {
  padding: 0 20px 12px;
  border-bottom: 1px solid #f0f0f0;

  :deep(.el-form-item) {
    margin-bottom: 10px;
  }

  :deep(.el-form-item__label) {
    font-size: 13px;
    color: #606266;
  }
}

/* Tab 导航 */
.tab-nav {
  display: flex;
  padding: 16px 12px 12px;
  gap: 8px;

  .tab-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 14px 8px;
    border-radius: 10px;
    cursor: pointer;
    color: #909399;
    transition: all 0.25s;
    position: relative;

    .tab-icon {
      width: 26px;
      height: 26px;
    }

    span {
      font-size: 12px;
      font-weight: 500;
    }

    .tab-badge {
      position: absolute;
      top: 6px;
      right: 12px;

      :deep(.el-badge__content) {
        font-size: 10px;
      }
    }

    &:hover:not(.active) {
      background: #f5f7fa;
      color: #606266;
    }

    &.active {
      background: #ecf5ff;
      color: #409eff;
    }
  }
}

/* Tab 内容 */
.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 20px;

  .tab-pane {
    .pane-section {
      margin-bottom: 20px;

      .pane-section-title {
        margin: 0 0 12px;
        font-size: 14px;
        font-weight: 600;
        color: #303133;
        padding-bottom: 8px;
        border-bottom: 1px solid #f0f0f0;
      }
    }

    .pane-empty {
      text-align: center;
      padding: 40px 0;
      font-size: 13px;
      color: #c0c4cc;
    }
  }
}

/* 模板网格 */
.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 12px;

  .template-add-card {
    aspect-ratio: 3 / 4;
    border: 2px dashed #dcdfe6;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    color: #909399;
    transition: all 0.2s;

    span {
      font-size: 12px;
    }

    &:hover {
      border-color: #409eff;
      color: #409eff;
    }
  }

  .template-card {
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #ebeef5;
    position: relative;
    background: #f5f5f5;
    transition: border-color 0.2s;

    &:hover {
      border-color: #409eff;

      .template-card-remove {
        opacity: 1;
      }
    }

    img {
      width: 100%;
      aspect-ratio: 3 / 4;
      object-fit: cover;
      display: block;
    }

    .no-thumb {
      width: 100%;
      aspect-ratio: 3 / 4;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: #c0c4cc;
      padding: 8px;
      text-align: center;
      word-break: break-all;
    }

    .template-card-name {
      padding: 6px 8px;
      font-size: 12px;
      color: #606266;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      background: #fff;
      border-top: 1px solid #ebeef5;
    }

    .template-card-remove {
      position: absolute;
      top: 6px;
      right: 6px;
      width: 20px;
      height: 20px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.2s;

      &:hover {
        background: rgba(245, 108, 108, 0.9);
      }
    }
  }
}

.template-count {
  margin-top: 12px;
  font-size: 12px;
  color: #909399;
}
</style>
