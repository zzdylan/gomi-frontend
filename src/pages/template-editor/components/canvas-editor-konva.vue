<script setup lang="ts">
import type { KonvaElement } from "@@/composables/useKonva"

const props = defineProps<{
  elements: KonvaElement[]
  selectedId: string | null
  stageSize: { width: number, height: number }
}>()

const emit = defineEmits<{
  select: [id: string | null]
  update: [id: string, updates: Partial<KonvaElement>]
}>()

const stageRef = ref<any>(null)
const transformerRef = ref<any>(null)
const textEditorRef = ref<HTMLTextAreaElement | null>(null)
const editingTextId = ref<string | null>(null)

// 图片缓存：存储已加载的图片对象
const imageCache = ref<Map<string, HTMLImageElement>>(new Map())

// 加载图片
function loadImage(url: string): HTMLImageElement | undefined {
  if (imageCache.value.has(url)) {
    return imageCache.value.get(url)
  }

  const img = new Image()
  img.crossOrigin = "anonymous" // 处理跨域问题
  img.onload = () => {
    imageCache.value.set(url, img)
  }
  img.src = url

  return undefined
}

// 获取图片元素的 config，包含加载的图片对象
function getImageConfig(element: KonvaElement) {
  const img = loadImage(element.imageUrl || "")
  return {
    id: element.id,
    name: element.id,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    scaleX: element.scaleX,
    scaleY: element.scaleY,
    rotation: element.rotation,
    opacity: element.opacity,
    draggable: true,
    image: img // 关键：传递实际的 Image 对象
  }
}

// 监听选中状态变化，更新 Transformer
// 这是官方示例的核心逻辑
watch(() => props.selectedId, () => {
  nextTick(() => {
    updateTransformer()
  })
})

// 监听元素数量变化，也需要更新 Transformer
watch(() => props.elements.length, () => {
  nextTick(() => {
    updateTransformer()
  })
})

// 更新 Transformer - 基于官方示例
function updateTransformer() {
  if (!transformerRef.value || !stageRef.value) {
    return
  }

  const transformerNode = transformerRef.value.getNode()
  const stage = transformerNode.getStage()

  if (!stage) {
    return
  }

  const { selectedId } = props

  // 如果没有选中，清空 transformer
  if (!selectedId) {
    transformerNode.nodes([])
    return
  }

  // 查找选中的节点（通过 ID）
  const selectedNode = stage.findOne(`#${selectedId}`)

  // 如果找到了节点，绑定 transformer
  if (selectedNode) {
    transformerNode.nodes([selectedNode])
  } else {
    transformerNode.nodes([])
  }
}

// 处理舞台点击（取消选中）
function handleStageMouseDown(e: any) {
  // 点击空白区域
  if (e.target === e.target.getStage()) {
    emit("select", null)
    return
  }

  // 点击 Transformer 上的控制点，不做处理
  const clickedOnTransformer = e.target.getParent().className === "Transformer"
  if (clickedOnTransformer) {
    return
  }

  // 获取点击的元素 ID
  const id = e.target.id()
  if (id) {
    emit("select", id)
  } else {
    emit("select", null)
  }
}

// 处理拖拽结束
function handleDragEnd(id: string, e: any) {
  emit("update", id, {
    x: e.target.x(),
    y: e.target.y()
  })
}

// 处理变换结束（缩放、旋转）- 基于官方示例
function handleTransformEnd(id: string, e: any) {
  const node = e.target
  const scaleX = node.scaleX()
  const scaleY = node.scaleY()

  const updates: Partial<KonvaElement> = {
    x: node.x(),
    y: node.y(),
    rotation: node.rotation()
  }

  const element = props.elements.find(el => el.id === id)

  if (element?.type === "rect") {
    // 对于矩形，将缩放应用到宽高，然后重置 scale
    updates.width = Math.max(5, node.width() * scaleX)
    updates.height = Math.max(5, node.height() * scaleY)
    // 立即重置节点的 scale，避免跳变
    node.scaleX(1)
    node.scaleY(1)
  } else if (element?.type === "circle") {
    // 对于圆形，将缩放应用到半径
    updates.radius = Math.max(5, (element.radius || 50) * scaleX)
    // 立即重置节点的 scale，避免跳变
    node.scaleX(1)
    node.scaleY(1)
  } else if (element?.type === "text") {
    // 对于文本，调整宽度和字号
    updates.width = Math.max(20, node.width() * scaleX)
    updates.fontSize = Math.max(12, (element.fontSize || 24) * scaleY)
    // 立即重置节点的 scale，避免跳变
    node.scaleX(1)
    node.scaleY(1)
  } else if (element?.type === "image") {
    // 对于图片，保持 scale
    updates.scaleX = scaleX
    updates.scaleY = scaleY
  }

  emit("update", id, updates)
}

// 处理文本双击编辑
function handleTextDblClick(id: string, e: any) {
  const textNode = e.target
  const element = props.elements.find(el => el.id === id)

  if (!element || element.type !== "text") return

  // 隐藏 transformer
  const transformerNode = transformerRef.value?.getNode()
  if (transformerNode) {
    transformerNode.nodes([])
  }

  // 设置编辑状态
  editingTextId.value = id

  // 隐藏文本节点
  textNode.hide()

  // 等待 DOM 更新后聚焦 textarea
  nextTick(() => {
    textEditorRef.value?.focus()
    textEditorRef.value?.select()
  })
}

// 完成文本编辑
function finishTextEdit() {
  if (!editingTextId.value) return

  const element = props.elements.find(el => el.id === editingTextId.value)
  if (!element) return

  // 更新文本内容
  const newText = textEditorRef.value?.value || element.text
  emit("update", editingTextId.value, { text: newText })

  // 清除编辑状态
  editingTextId.value = null

  // 重新选中文本
  nextTick(() => {
    updateTransformer()
  })
}

// 导出舞台为图片
function exportToDataURL() {
  if (!stageRef.value) return null
  const stage = stageRef.value.getNode()
  return stage.toDataURL({
    pixelRatio: 2
  })
}

defineExpose({
  exportToDataURL
})
</script>

<template>
  <div class="canvas-editor-konva">
    <v-stage
      ref="stageRef"
      :config="{
        width: stageSize.width,
        height: stageSize.height,
      }"
      @mousedown="handleStageMouseDown"
      @touchstart="handleStageMouseDown"
    >
      <v-layer>
        <!-- 白色背景 -->
        <v-rect
          :config="{
            x: 0,
            y: 0,
            width: stageSize.width,
            height: stageSize.height,
            fill: '#ffffff',
          }"
        />

        <!-- 渲染所有元素 - 核心：必须设置 id 属性用于 Transformer 查找 -->
        <template v-for="element in elements" :key="element.id">
          <!-- 矩形 -->
          <v-rect
            v-if="element.type === 'rect'"
            :config="{
              id: element.id,
              name: element.id,
              x: element.x,
              y: element.y,
              width: element.width,
              height: element.height,
              fill: element.fill,
              stroke: element.stroke,
              strokeWidth: element.strokeWidth,
              rotation: element.rotation,
              opacity: element.opacity,
              draggable: true,
            }"
            @dragend="handleDragEnd(element.id, $event)"
            @transformend="handleTransformEnd(element.id, $event)"
          />

          <!-- 圆形 -->
          <v-circle
            v-else-if="element.type === 'circle'"
            :config="{
              id: element.id,
              name: element.id,
              x: element.x,
              y: element.y,
              radius: element.radius,
              fill: element.fill,
              stroke: element.stroke,
              strokeWidth: element.strokeWidth,
              rotation: element.rotation,
              opacity: element.opacity,
              draggable: true,
            }"
            @dragend="handleDragEnd(element.id, $event)"
            @transformend="handleTransformEnd(element.id, $event)"
          />

          <!-- 文本 -->
          <v-text
            v-else-if="element.type === 'text'"
            :config="{
              id: element.id,
              name: element.id,
              x: element.x,
              y: element.y,
              text: element.text,
              fontSize: element.fontSize,
              fontFamily: 'Arial',
              fill: element.fill,
              width: element.width,
              align: element.textAlign,
              fontStyle: element.fontWeight,
              rotation: element.rotation,
              opacity: element.opacity,
              draggable: true,
              visible: editingTextId !== element.id,
            }"
            @dragend="handleDragEnd(element.id, $event)"
            @transformend="handleTransformEnd(element.id, $event)"
            @dblclick="handleTextDblClick(element.id, $event)"
          />

          <!-- 图片 -->
          <v-image
            v-else-if="element.type === 'image'"
            :config="getImageConfig(element)"
            @dragend="handleDragEnd(element.id, $event)"
            @transformend="handleTransformEnd(element.id, $event)"
          />
        </template>

        <!-- Transformer - 用于选中元素的变换控制 -->
        <v-transformer
          ref="transformerRef"
          :config="{
            enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
            rotateEnabled: true,
            borderStroke: '#1890ff',
            anchorStroke: '#1890ff',
            anchorFill: '#ffffff',
            anchorSize: 8,
            borderStrokeWidth: 2,
          }"
        />
      </v-layer>
    </v-stage>

    <!-- 文本编辑器 -->
    <textarea
      v-if="editingTextId"
      ref="textEditorRef"
      :value="elements.find(el => el.id === editingTextId)?.text"
      :style="{
        position: 'absolute',
        left: `${elements.find(el => el.id === editingTextId)?.x || 0}px`,
        top: `${elements.find(el => el.id === editingTextId)?.y || 0}px`,
        width: `${elements.find(el => el.id === editingTextId)?.width || 200}px`,
        fontSize: `${elements.find(el => el.id === editingTextId)?.fontSize || 24}px`,
        fontFamily: 'Arial',
        color: elements.find(el => el.id === editingTextId)?.fill || '#000',
        padding: '0',
        margin: '0',
        border: '1px solid #1890ff',
        outline: 'none',
        background: 'rgba(255, 255, 255, 0.9)',
        resize: 'none',
        overflow: 'hidden',
        lineHeight: '1.2',
      }"
      @blur="finishTextEdit"
      @keydown.enter.exact="finishTextEdit"
      @keydown.esc="finishTextEdit"
    />
  </div>
</template>

<style scoped lang="scss">
.canvas-editor-konva {
  width: 375px;
  height: 667px;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  background: #ffffff;
  overflow: hidden;
}
</style>
