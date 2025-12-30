<script setup lang="ts">
import { useKonva } from "@@/composables/useKonva"
import { FolderOpened, Upload } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import CanvasEditorKonva from "./components/canvas-editor-konva.vue"
import ElementToolbar from "./components/element-toolbar.vue"
import LayerPanel from "./components/layer-panel.vue"
import PropertyPanelKonva from "./components/property-panel-konva.vue"

const leftActiveTab = ref("materials")
const canvasEditorRef = ref<InstanceType<typeof CanvasEditorKonva>>()

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
function handleExportImage() {
  const dataURL = canvasEditorRef.value?.exportToDataURL()
  if (dataURL) {
    const a = document.createElement("a")
    a.href = dataURL
    a.download = `template-${Date.now()}.png`
    a.click()
    ElMessage.success("图片导出成功")
  }
}

// 保存模板
function handleSave() {
  const json = exportJSON()
  if (json) {
    localStorage.setItem("konva-template", JSON.stringify(json))
    ElMessage.success("模板已保存到本地")
  }
}

// 加载模板
function handleLoad() {
  const savedTemplate = localStorage.getItem("konva-template")
  if (savedTemplate) {
    try {
      const json = JSON.parse(savedTemplate)
      loadFromJSON(json)
      ElMessage.success("模板加载成功")
    } catch {
      ElMessage.error("模板加载失败")
    }
  } else {
    ElMessage.warning("没有保存的模板")
  }
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
</script>

<template>
  <div class="template-editor">
    <!-- 顶部工具栏 -->
    <div class="editor-header">
      <h2 class="editor-title">
        模板编辑器 (Konva)
      </h2>
      <div class="header-actions">
        <el-button @click="handleSave">
          <el-icon><FolderOpened /></el-icon>
          保存模板
        </el-button>
        <el-button @click="handleLoad">
          <el-icon><Upload /></el-icon>
          加载模板
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
