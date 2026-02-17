<script setup lang="ts">
import type { SceneConfig, SceneType, SceneTypeLabel } from "./apis/type"
import type { MaterialItem } from "@/pages/material/apis/type"
import { ArrowLeft, Close, Delete, Plus } from "@element-plus/icons-vue"
import MaterialSelector from "@/common/components/MaterialSelector/index.vue"
import { createXunProjectApi, createXunTaskApi, getXunProjectDetailApi, updateXunProjectApi } from "./apis"
import GlobalSettingsPanel from "./components/GlobalSettingsPanel.vue"
import SubmitDialog from "./components/SubmitDialog.vue"
import { useXunclipForm } from "./composables/useXunclipForm"

const router = useRouter()
const route = useRoute()

const {
  projectId,
  projectTitle,
  aspect,
  isGlobalMode,
  scenes,
  selectedSceneIndex,
  selectedScene,
  hasOpening,
  hasEnding,
  globalSettings,
  selectScene,
  addScene,
  removeScene,
  addMaterialToScene,
  removeMaterialFromScene,
  toggleMode,
  buildConfig,
  loadFromProject,
  validate
} = useXunclipForm()

// 弹窗状态
const materialSelectorVisible = ref(false)
const submitDialogVisible = ref(false)
const saving = ref(false)
const loading = ref(false)

// 场景折叠状态
const collapsedScenes = ref(new Set<number>())

function isCollapsed(index: number) {
  return collapsedScenes.value.has(index)
}

function toggleCollapse(index: number) {
  const s = new Set(collapsedScenes.value)
  if (s.has(index)) {
    s.delete(index)
  } else {
    s.add(index)
  }
  collapsedScenes.value = s
}

// 素材操作（指定场景）
function handleAddMaterial(sceneIndex: number) {
  selectScene(sceneIndex)
  materialSelectorVisible.value = true
}

function handleRemoveMaterial(sceneIndex: number, materialIndex: number) {
  selectScene(sceneIndex)
  removeMaterialFromScene(materialIndex)
}

function handleMaterialSelectMultiple(materials: MaterialItem[]) {
  for (const material of materials) {
    addMaterialToScene(material)
  }
  materialSelectorVisible.value = false
}

// 格式化时长
function formatDuration(ms: number): string {
  if (!ms) return ""
  const seconds = Math.floor(ms / 1000)
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function getSceneDuration(scene: SceneConfig): string {
  const totalMs = scene.materials.reduce((sum, m) => sum + (m.duration || 0), 0)
  if (!totalMs) return ""
  return `${formatDuration(totalMs)}s`
}

function getMaterialThumb(material: { url?: string, cover_url?: string, media_type?: string }): string {
  return (material.media_type === "video" ? (material.cover_url || material.url) : material.url) ?? ""
}

// 加载已有工程
onMounted(async () => {
  const id = route.query.id
  if (id) {
    loading.value = true
    try {
      const { data } = await getXunProjectDetailApi(id as string)
      loadFromProject(data)
    } catch {
      ElMessage.error("加载工程失败")
    } finally {
      loading.value = false
    }
  }
})

// 保存草稿
async function handleSave() {
  const result = validate()
  if (!result.valid) {
    ElMessage.warning(result.message)
    return
  }

  saving.value = true
  try {
    const configJson = JSON.stringify(buildConfig())
    const payload = {
      title: projectTitle.value,
      content: configJson,
      aspect: aspect.value
    }

    if (projectId.value) {
      await updateXunProjectApi(projectId.value, payload)
      ElMessage.success("保存成功")
    } else {
      const { data } = await createXunProjectApi(payload)
      projectId.value = data.id
      ElMessage.success("创建成功")
    }
  } catch {
    ElMessage.error("保存失败")
  } finally {
    saving.value = false
  }
}

// 提交任务
async function handleSubmitTask(resultLimit: number) {
  if (!projectId.value) {
    ElMessage.warning("请先保存工程")
    return
  }

  try {
    await createXunTaskApi({
      project_id: projectId.value,
      result_limit: resultLimit
    })
    ElMessage.success("任务已提交")
  } catch {
    ElMessage.error("提交任务失败")
  }
}

function goBack() {
  router.push({ name: "XunClipProjects" })
}
</script>

<template>
  <div v-loading="loading" class="xunclip-page">
    <!-- 顶部工具栏 -->
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" text @click="goBack">
          返回
        </el-button>
        <el-input v-model="projectTitle" placeholder="工程标题" class="title-input" />
        <el-radio-group v-model="aspect" size="small">
          <el-radio-button value="9:16">
            9:16
          </el-radio-button>
          <el-radio-button value="16:9">
            16:9
          </el-radio-button>
          <el-radio-button value="1:1">
            1:1
          </el-radio-button>
        </el-radio-group>
      </div>
      <div class="header-right">
        <el-button :loading="saving" @click="handleSave">
          保存草稿
        </el-button>
        <el-button type="primary" @click="submitDialogVisible = true">
          提交任务
        </el-button>
      </div>
    </div>

    <!-- 主体两栏 -->
    <div class="page-body">
      <!-- 左栏：镜头内容与配置 -->
      <div class="scenes-panel">
        <div class="scenes-header">
          <div>
            <h3>镜头内容与配置</h3>
            <p class="scenes-subtitle">
              为各个镜头组配置素材、文案、时长等信息
            </p>
          </div>
          <div class="scenes-header-actions">
            <!-- 全局模式：时长模式选择器 -->
            <el-select
              v-if="isGlobalMode"
              v-model="globalSettings.mode"
              size="small"
              style="width: 130px"
            >
              <el-option value="follow_material" label="素材原始时长" />
              <el-option value="follow_audio" label="跟随解说时长" />
              <el-option value="custom" label="自定义时长" />
            </el-select>
            <el-switch
              :model-value="isGlobalMode"
              active-text="全局"
              inactive-text="局部"
              @change="toggleMode"
            />
          </div>
        </div>

        <div class="scenes-body">
          <template v-for="(scene, index) in scenes" :key="index">
            <!-- 场景卡片 -->
            <div
              class="scene-section"
              :class="{ active: index === selectedSceneIndex }"
            >
              <div class="scene-header" @click="selectScene(index)">
                <div class="sh-left">
                  <el-icon
                    class="collapse-arrow"
                    :class="{ collapsed: isCollapsed(index) }"
                    @click.stop="toggleCollapse(index)"
                  >
                    <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M831.872 340.864 512 652.672 192.128 340.864a30.592 30.592 0 0 0-42.752 0 29.12 29.12 0 0 0 0 41.6L489.664 714.24a32 32 0 0 0 44.672 0l340.288-331.712a29.12 29.12 0 0 0 0-41.728 30.592 30.592 0 0 0-42.752 0z" /></svg>
                  </el-icon>
                  <span class="scene-type">{{ SceneTypeLabel[scene.type] }}({{ scene.materials.length }})</span>
                </div>
                <div class="sh-right">
                  <!-- 局部模式：正片场景显示时长模式选择器 -->
                  <template v-if="!isGlobalMode && scene.type === SceneType.Main && scene.local_settings">
                    <el-select
                      v-model="scene.local_settings.mode"
                      size="small"
                      style="width: 130px"
                      @click.stop
                    >
                      <el-option value="follow_material" label="素材原始时长" />
                      <el-option value="follow_audio" label="跟随解说时长" />
                      <el-option value="custom" label="自定义时长" />
                    </el-select>
                    <el-input-number
                      v-if="scene.local_settings.mode === 'custom'"
                      v-model="scene.local_settings.duration"
                      :min="0"
                      :step="1000"
                      size="small"
                      controls-position="right"
                      placeholder="时长(ms)"
                      class="scene-duration-input"
                      @click.stop
                    />
                  </template>
                  <span v-else-if="getSceneDuration(scene)" class="scene-duration">{{ getSceneDuration(scene) }}</span>
                  <el-button
                    v-if="scenes.length > 1"
                    :icon="Delete"
                    text
                    type="danger"
                    size="small"
                    class="scene-delete"
                    @click.stop="removeScene(index)"
                  />
                </div>
              </div>

              <div v-show="!isCollapsed(index)" class="scene-body">
                <div class="scene-materials">
                  <div class="material-add" @click="handleAddMaterial(index)">
                    <el-icon :size="20">
                      <Plus />
                    </el-icon>
                    <span>添加素材</span>
                  </div>
                  <div
                    v-for="(material, mIdx) in scene.materials"
                    :key="`${material.id}-${mIdx}`"
                    class="material-thumb"
                  >
                    <img :src="getMaterialThumb(material)" alt="" crossorigin="anonymous">
                    <div v-if="material.media_type === 'video'" class="video-badge">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                    <span v-if="material.duration" class="duration-label">{{ formatDuration(material.duration) }}</span>
                    <div class="material-remove" @click.stop="handleRemoveMaterial(index, mIdx)">
                      <el-icon :size="12">
                        <Close />
                      </el-icon>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 场景之间的连接线 -->
            <div v-if="index < scenes.length - 1" class="scene-connector">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="#409eff">
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" opacity="0.5" />
              </svg>
            </div>
          </template>
        </div>

        <!-- 底部添加按钮 -->
        <div class="scenes-footer">
          <el-button size="small" :disabled="hasOpening" @click="addScene(SceneType.Opening)">
            + 新增片头
          </el-button>
          <el-button size="small" :disabled="hasEnding" @click="addScene(SceneType.Ending)">
            + 新增片尾
          </el-button>
          <el-button size="small" type="primary" @click="addScene(SceneType.Main)">
            + 新增镜头组
          </el-button>
        </div>
      </div>

      <!-- 右栏：视频配置 -->
      <div class="config-panel">
        <GlobalSettingsPanel
          :key="isGlobalMode ? 'global' : 'local'"
          :settings="globalSettings"
          :is-global-mode="isGlobalMode"
          :local-settings="selectedScene?.local_settings"
        />
      </div>
    </div>

    <!-- 素材选择弹窗 -->
    <el-dialog
      v-model="materialSelectorVisible"
      title="选择素材"
      width="800px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <MaterialSelector
        :accept-types="['image', 'video']"
        multiple
        @select-multiple="handleMaterialSelectMultiple"
      />
    </el-dialog>

    <!-- 提交任务弹窗 -->
    <SubmitDialog
      v-model:visible="submitDialogVisible"
      :project-id="projectId"
      @submitted="handleSubmitTask"
    />
  </div>
</template>

<style scoped lang="scss">
.xunclip-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f7fa;

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    background: #fff;
    border-bottom: 1px solid #ebeef5;

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .title-input {
        width: 200px;
      }
    }

    .header-right {
      display: flex;
      gap: 8px;
    }
  }

  .page-body {
    flex: 1;
    display: flex;
    min-height: 0;
    overflow: hidden;
  }
}

/* 左栏：镜头内容与配置 */
.scenes-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;

  .scenes-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 20px 24px 16px;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }

    .scenes-subtitle {
      margin: 4px 0 0;
      font-size: 13px;
      color: #909399;
    }

    .scenes-header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }

  .scenes-body {
    flex: 1;
    overflow-y: auto;
    padding: 0 24px;
  }

  .scenes-footer {
    display: flex;
    gap: 10px;
    padding: 16px 24px;
    border-top: 1px solid #ebeef5;
    background: #fff;
  }
}

/* 场景卡片 */
.scene-section {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fff;
  transition: border-color 0.2s;

  &.active {
    border-color: #409eff;
  }

  .scene-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    cursor: pointer;
    user-select: none;

    &:hover {
      background: #fafafa;
    }

    .sh-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .sh-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .collapse-arrow {
      font-size: 14px;
      color: #909399;
      transition: transform 0.25s;

      &.collapsed {
        transform: rotate(-90deg);
      }
    }

    .scene-type {
      font-size: 14px;
      font-weight: 500;
      color: #303133;
    }

    .scene-duration {
      font-size: 13px;
      color: #909399;
    }

    .scene-duration-input {
      width: 140px;
    }

    .scene-delete {
      opacity: 0;
      transition: opacity 0.2s;
    }

    &:hover .scene-delete {
      opacity: 1;
    }
  }

  .scene-body {
    padding: 8px 16px 16px;
    border-top: 1px solid #f0f0f0;
  }
}

/* 场景内素材网格 */
.scene-materials {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;

  .material-add {
    width: 130px;
    height: 130px;
    border: 2px dashed #dcdfe6;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
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

  .material-thumb {
    width: 130px;
    height: 130px;
    border-radius: 6px;
    overflow: hidden;
    position: relative;
    background: #000;
    cursor: default;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .video-badge {
      position: absolute;
      top: 6px;
      left: 6px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      padding-left: 1px;
      pointer-events: none;
    }

    .duration-label {
      position: absolute;
      bottom: 6px;
      right: 6px;
      background: rgba(0, 0, 0, 0.7);
      color: #fff;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 3px;
      pointer-events: none;
    }

    .material-remove {
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

    &:hover .material-remove {
      opacity: 1;
    }
  }
}

/* 场景连接器 */
.scene-connector {
  display: flex;
  justify-content: center;
  padding: 4px 0;
}

/* 右栏：视频配置 */
.config-panel {
  width: 420px;
  flex-shrink: 0;
  background: #fff;
  border-left: 1px solid #ebeef5;
  overflow-y: auto;
}
</style>
