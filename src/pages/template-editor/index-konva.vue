<script setup lang="ts">
import type { TemplateFolderItem } from "@/pages/template-manage/apis/type"
import { useKonva } from "@@/composables/useKonva"
import { ArrowLeft, Check, Close, FolderAdd, FolderOpened } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { useRoute, useRouter } from "vue-router"
import { uploadBlobApi } from "@/api/upload"
import CanvasEditorKonva from "@/pages/template-editor/components/canvas-editor-konva.vue"
import ElementToolbar from "@/pages/template-editor/components/element-toolbar.vue"
import LayerPanel from "@/pages/template-editor/components/layer-panel.vue"
import PropertyPanelKonva from "@/pages/template-editor/components/property-panel-konva.vue"
import {
  createTemplateApi,
  createTemplateFolderApi,
  getTemplateDetailApi,
  getTemplateFolderListApi,
  updateTemplateApi
} from "@/pages/template-manage/apis"

const leftActiveTab = ref("materials")
const canvasEditorRef = ref<InstanceType<typeof CanvasEditorKonva>>()
const route = useRoute()
const router = useRouter()

// 模板信息
const currentTemplateId = ref<number | null>(null)
const currentTemplateName = ref("")

// 使用 Konva composable
const {
  elements,
  selectedId,
  activeElement,
  stageSize,
  addText,
  addImage,
  deleteSelected,
  selectElement,
  deleteElement,
  reorderLayers,
  clearCanvas,
  exportJSON,
  loadFromJSON,
  updateElement
} = useKonva()

// 处理属性更新 - 超级简单，因为是响应式的
function handlePropertyUpdate(updates: any) {
  if (selectedId.value) {
    updateElement(selectedId.value, updates)
  }
}

// 处理画布选择
function handleCanvasSelect(id: string | null) {
  selectedId.value = id
}

// 处理画布更新
function handleCanvasUpdate(id: string, updates: any) {
  updateElement(id, updates)
}

// 处理图层重排序
function handleReorderLayers(newLayerElements: any[]) {
  // 根据新的图层顺序，从完整元素数组中找到对应的元素
  const reorderedElements = newLayerElements.map((layerEl) => {
    return elements.value.find(el => el.id === layerEl.id)
  }).filter(Boolean) as any[]

  reorderLayers(reorderedElements)
}

// 清空画布
function handleClearCanvas() {
  clearCanvas()
  ElMessage.success("画布已清空")
}

// 导出 JSON
function handleExportJSON() {
  const json = exportJSON()
  if (json) {
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `template-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success("JSON 导出成功")
  }
}

// 导出图片
async function handleExportImage() {
  try {
    const dataURL = await canvasEditorRef.value?.exportToDataURL()
    if (dataURL) {
      const a = document.createElement("a")
      a.href = dataURL
      a.download = `template-${Date.now()}.png`
      a.click()
      ElMessage.success("图片导出成功")
    } else {
      ElMessage.warning("图片导出失败")
    }
  } catch (error) {
    ElMessage.error("图片导出失败")
    console.error(error)
  }
}

// 保存模板对话框
const saveDialogVisible = ref(false)
const saveForm = reactive({
  name: "",
  folder_id: 0
})
const folders = ref<TemplateFolderItem[]>([])
const isSaving = ref(false)

// 内联新建文件夹
const isCreatingFolder = ref(false)
const newFolderName = ref("")

// 打开保存对话框
async function handleSave() {
  saveForm.name = currentTemplateName.value || ""

  // 加载文件夹列表
  try {
    const { data } = await getTemplateFolderListApi({ parent_id: 0 })
    folders.value = data.folders

    // 默认选择文件夹的优先级：
    // 1. 如果是编辑模式且已有 folder_id，保持原来的
    // 2. 如果 URL 中有 folderId 参数（从文件夹进入创建），选择该文件夹
    // 3. 否则选择第一个文件夹
    if (!currentTemplateId.value && folders.value.length > 0) {
      const folderIdFromRoute = route.query.folderId
      if (folderIdFromRoute) {
        const folderId = Number(folderIdFromRoute)
        // 确保该文件夹存在于列表中
        if (folders.value.some(f => f.id === folderId)) {
          saveForm.folder_id = folderId
        } else {
          saveForm.folder_id = folders.value[0].id
        }
      } else {
        saveForm.folder_id = folders.value[0].id
      }
    }
  } catch (error) {
    console.error("加载文件夹失败:", error)
  }

  // 如果没有文件夹，提示用户可以在对话框中创建
  if (folders.value.length === 0) {
    ElMessage.info("暂无文件夹，请先创建一个文件夹")
  }

  saveDialogVisible.value = true
}

// 确认保存模板
async function handleSaveConfirm() {
  if (!saveForm.name.trim()) {
    ElMessage.warning("请输入模板名称")
    return
  }

  if (!saveForm.folder_id) {
    ElMessage.warning("请选择文件夹")
    return
  }

  const json = exportJSON()
  if (!json) {
    ElMessage.error("导出模板数据失败")
    return
  }

  isSaving.value = true
  try {
    // 1. 生成并上传缩略图
    let thumbnailUrl = ""
    let hasTaintedCanvas = false

    try {
      // exportToDataURL 现在是异步的，需要 await
      const dataURL = await canvasEditorRef.value?.exportToDataURL()
      if (dataURL) {
        // 将 DataURL 转换为 Blob
        const blob = await dataURLToBlob(dataURL)
        // 上传缩略图
        const uploadData = await uploadBlobApi(
          blob,
          `template-${Date.now()}.png`,
          "templates/thumbnails"
        )
        thumbnailUrl = uploadData.data.url
      } else {
        hasTaintedCanvas = true
      }
    } catch (thumbnailError) {
      console.error("缩略图生成失败:", thumbnailError)
      hasTaintedCanvas = true
    }

    // 如果无法生成缩略图，提示用户
    if (hasTaintedCanvas) {
      ElMessage.warning("缩略图生成失败，模板将保存但不含预览图")
    }

    // 2. 保存模板数据
    const templateData = {
      name: saveForm.name,
      folder_id: saveForm.folder_id,
      canvas_width: stageSize.width,
      canvas_height: stageSize.height,
      content: JSON.stringify(json),
      thumbnail: thumbnailUrl
    }

    if (currentTemplateId.value) {
      // 更新现有模板
      await updateTemplateApi(currentTemplateId.value, templateData)
      ElMessage.success("模板更新成功")
    } else {
      // 创建新模板
      const { data } = await createTemplateApi(templateData)
      currentTemplateId.value = data.id
      ElMessage.success("模板保存成功")
    }

    currentTemplateName.value = saveForm.name
    saveDialogVisible.value = false
  } catch (error: any) {
    ElMessage.error(error.message || "保存失败")
  } finally {
    isSaving.value = false
  }
}

// 将 DataURL 转换为 Blob
function dataURLToBlob(dataURL: string): Promise<Blob> {
  return new Promise((resolve, _reject) => {
    const arr = dataURL.split(",")
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png"
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    resolve(new Blob([u8arr], { type: mime }))
  })
}

// 显示内联创建文件夹输入框
function showInlineFolderInput() {
  isCreatingFolder.value = true
  newFolderName.value = ""
}

// 取消内联创建文件夹
function cancelInlineFolderCreation() {
  isCreatingFolder.value = false
  newFolderName.value = ""
}

// 确认内联创建文件夹
async function confirmInlineFolderCreation() {
  if (!newFolderName.value.trim()) {
    ElMessage.warning("请输入文件夹名称")
    return
  }

  try {
    const { data } = await createTemplateFolderApi({
      name: newFolderName.value,
      parent_id: 0
    })
    ElMessage.success("文件夹创建成功")

    // 重新加载文件夹列表
    const { data: folderData } = await getTemplateFolderListApi({ parent_id: 0 })
    folders.value = folderData.folders

    // 自动选择新创建的文件夹
    saveForm.folder_id = data.id

    // 重置状态
    isCreatingFolder.value = false
    newFolderName.value = ""
  } catch (error: any) {
    ElMessage.error(error.message || "创建文件夹失败")
  }
}

// 加载模板（从URL参数）
async function loadTemplateFromRoute() {
  const templateId = route.query.templateId
  if (templateId) {
    try {
      const { data } = await getTemplateDetailApi(Number(templateId))
      currentTemplateId.value = data.id
      currentTemplateName.value = data.name
      saveForm.folder_id = data.folder_id // 保存原文件夹ID

      // 加载模板内容
      const templateContent = JSON.parse(data.content)
      loadFromJSON(templateContent)

      ElMessage.success("模板加载成功")
    } catch (error) {
      ElMessage.error("模板加载失败")
      console.error("加载模板失败:", error)
    }
  }
}

// 返回模板列表
function handleBack() {
  router.push({ name: "TemplateManage" })
}

// 转换元素格式供图层面板使用 - 传递必要的显示字段
const layerElements = computed(() => {
  return elements.value.map(el => ({
    id: el.id,
    type: el.type,
    name: el.name,
    text: el.text, // 文本元素的文字内容
    imageUrl: el.imageUrl // 图片元素的URL
  }))
})

// 页面标题
const pageTitle = computed(() => {
  if (currentTemplateName.value) {
    return `编辑模板 - ${currentTemplateName.value}`
  }
  return "新建模板"
})

// 组件挂载时加载模板
onMounted(() => {
  loadTemplateFromRoute()
})
</script>

<template>
  <div class="template-editor">
    <!-- 顶部工具栏 -->
    <div class="editor-header">
      <div class="header-left">
        <el-button text @click="handleBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h2 class="editor-title">
          {{ pageTitle }}
        </h2>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="handleSave">
          <el-icon><FolderOpened /></el-icon>
          保存模板
        </el-button>
      </div>
    </div>

    <!-- 主体区域 -->
    <div class="editor-body">
      <!-- 左侧：素材和图层 -->
      <div class="editor-sidebar left">
        <el-tabs v-model="leftActiveTab" tab-position="top">
          <el-tab-pane label="素材库" name="materials">
            <ElementToolbar
              :has-selection="!!selectedId"
              @add-text="addText"
              @add-image="addImage"
              @delete-selected="deleteSelected"
              @clear-canvas="handleClearCanvas"
              @export-j-s-o-n="handleExportJSON"
              @export-image="handleExportImage"
            />
          </el-tab-pane>
          <el-tab-pane label="图层" name="layers">
            <LayerPanel
              :elements="layerElements"
              :active-object-id="selectedId"
              @select-element="selectElement"
              @delete-element="deleteElement"
              @reorder-layers="handleReorderLayers"
            />
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- 中间：画布预览 -->
      <div class="editor-canvas">
        <div class="canvas-container">
          <CanvasEditorKonva
            ref="canvasEditorRef"
            :elements="elements"
            :selected-id="selectedId"
            :stage-size="stageSize"
            @select="handleCanvasSelect"
            @update="handleCanvasUpdate"
          />
        </div>
      </div>

      <!-- 右侧：属性面板 -->
      <div class="editor-sidebar right">
        <PropertyPanelKonva
          :element="activeElement"
          @update="handlePropertyUpdate"
        />
      </div>
    </div>

    <!-- 保存模板对话框 -->
    <el-dialog v-model="saveDialogVisible" title="保存模板" width="500px">
      <el-form label-width="90px">
        <el-form-item label="模板名称" required>
          <el-input v-model="saveForm.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="保存到" required>
          <div style="display: flex; gap: 8px; align-items: flex-start; width: 100%;">
            <el-select v-model="saveForm.folder_id" placeholder="选择文件夹" style="flex: 1; min-width: 200px;">
              <el-option
                v-for="folder in folders"
                :key="folder.id"
                :label="folder.name"
                :value="folder.id"
              />
            </el-select>
            <el-button v-if="!isCreatingFolder" @click="showInlineFolderInput" style="flex-shrink: 0;">
              <el-icon><FolderAdd /></el-icon>
              新建
            </el-button>
          </div>
        </el-form-item>
        <el-form-item v-if="isCreatingFolder" label="文件夹名称" required>
          <div style="display: flex; gap: 8px;">
            <el-input
              v-model="newFolderName"
              placeholder="请输入文件夹名称"
              style="flex: 1"
              @keyup.enter="confirmInlineFolderCreation"
            />
            <el-button type="primary" @click="confirmInlineFolderCreation" style="flex-shrink: 0;">
              <el-icon><Check /></el-icon>
            </el-button>
            <el-button @click="cancelInlineFolderCreation" style="flex-shrink: 0;">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="saveDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="isSaving" @click="handleSaveConfirm">
          {{ isSaving ? "保存中..." : "确定" }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.template-editor {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
}

.editor-header {
  height: 60px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.editor-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.editor-body {
  flex: 1;
  display: flex;
  gap: 16px;
  padding: 16px;
  overflow: hidden;
}

.editor-sidebar {
  width: 280px;
  flex-shrink: 0;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.left {
    :deep(.el-tabs) {
      display: flex;
      flex-direction: column;
      height: 100%;

      .el-tabs__header {
        margin: 0;
        padding: 0;
        background: #fafafa;
        border-bottom: 1px solid #e8e8e8;
        order: -1; // 强制 header 在上面
        flex-shrink: 0;
      }

      .el-tabs__nav-wrap {
        padding: 0 16px;
        min-height: 40px;
        display: flex;
        align-items: flex-end;
      }

      .el-tabs__content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        order: 1; // 内容在下面
      }

      .el-tab-pane {
        height: 100%;
      }
    }
  }

  &.right {
    width: 300px;
    padding-top: 0; // 确保顶部对齐
  }
}

.editor-canvas {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
}

.canvas-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.canvas-title {
  font-size: 14px;
  font-weight: 500;
  color: #666;
}
</style>
