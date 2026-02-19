<script setup lang="ts">
import type { CSSProperties } from "vue"
import type { SubtitleTrackClip, VideoTrackClip, VisualClip } from "@/types/timeline"

const props = defineProps<{
  visualClips: VisualClip[]
  selectedId: string | null
  stageSize: { width: number, height: number }
}>()

const emit = defineEmits<{
  select: [id: string | null]
  updateVideo: [id: string, updates: Partial<VideoTrackClip>]
  updateSubtitle: [id: string, updates: Partial<SubtitleTrackClip>]
}>()

const stageRef = ref<any>(null)
const transformerRef = ref<any>(null)
const textEditorRef = ref<HTMLTextAreaElement | null>(null)
const editingTextId = ref<string | null>(null)
const editingTextWidth = ref<number>(200)

// 图片缓存：存储已加载的图片对象
const imageCache = ref<Map<string, HTMLImageElement>>(new Map())

// 判断是否是视频/图片素材
function isVideoClip(clip: VisualClip): clip is VideoTrackClip {
  return clip.Type === "Video" || clip.Type === "Image"
}

// 判断是否是字幕素材
function isSubtitleClip(clip: VisualClip): clip is SubtitleTrackClip {
  return clip.Type === "Text"
}

// 加载图片（显示用）
function loadImage(url: string): HTMLImageElement | undefined {
  if (imageCache.value.has(url)) {
    return imageCache.value.get(url)
  }

  const img = new Image()
  img.crossOrigin = "anonymous"

  img.onload = () => {
    imageCache.value.set(url, img)
    // 图片加载完成后，强制触发更新
    nextTick(() => {
      if (stageRef.value) {
        stageRef.value.getNode().batchDraw()
      }
    })
  }

  img.onerror = (e) => {
    console.error("图片加载失败:", url, e)
  }

  img.src = url

  return undefined
}

// 用 CORS 模式加载图片（导出用）
function loadImageWithCORS(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      resolve(img)
    }

    img.onerror = (_e) => {
      console.error("CORS 模式加载图片失败:", url)
      reject(new Error(`CORS 模式加载图片失败: ${url}`))
    }

    img.src = url
  })
}

// 判断图片是否跨域
function isCrossOrigin(url: string): boolean {
  try {
    const imageUrl = new URL(url, window.location.href)
    return imageUrl.origin !== window.location.origin
  } catch {
    return false
  }
}

// 获取图片元素的 config
function getImageConfig(clip: VideoTrackClip) {
  const img = loadImage(clip.MediaURL || "")
  return {
    id: clip.Id,
    name: clip.Id,
    x: clip.X ?? 0,
    y: clip.Y ?? 0,
    width: clip.Width,
    height: clip.Height,
    rotation: 0,
    opacity: clip.Opacity ?? 1,
    draggable: true,
    image: img
  }
}

// 文字容器两侧 padding
const TEXT_PADDING = 40

// 测量文字渲染宽度
const _measureCanvas = document.createElement("canvas")
function measureTextWidth(clip: SubtitleTrackClip): number {
  const ctx = _measureCanvas.getContext("2d")!
  const italic = clip.FontFace?.Italic ? "italic" : "normal"
  const bold = clip.FontFace?.Bold ? "bold" : "normal"
  ctx.font = `${italic} ${bold} ${clip.FontSize ?? 24}px ${clip.Font || "Arial"}`
  return ctx.measureText(clip.Content).width
}

// 计算文字容器宽度（文字宽 + padding）
function getTextContainerWidth(clip: SubtitleTrackClip): number {
  return measureTextWidth(clip) + TEXT_PADDING
}

// clip.X 的默认值（未设置时的对齐默认位置）
function getDefaultX(alignment: string): number {
  switch (alignment) {
    case "Left": return 0
    case "Right": return props.stageSize.width
    default: return props.stageSize.width / 2 // Center
  }
}

// 根据对齐方式和容器宽度，从 clipX 算出容器左边缘 x
function clipXToContainerX(clipX: number, alignment: string, width: number): number {
  switch (alignment) {
    case "Left": return clipX
    case "Right": return clipX - width
    default: return clipX - width / 2 // Center
  }
}

// 从容器左边缘 x 反算 clipX（锚点位置）
function containerXToClipX(containerX: number, alignment: string, width: number): number {
  switch (alignment) {
    case "Left": return containerX
    case "Right": return containerX + width
    default: return containerX + width / 2 // Center
  }
}

// 获取文本元素的 config
function getTextConfig(clip: SubtitleTrackClip) {
  const alignment = clip.Alignment || "Center"
  const clipX = clip.X ?? getDefaultX(alignment)
  const width = getTextContainerWidth(clip)
  const containerX = clipXToContainerX(clipX, alignment, width)

  return {
    id: clip.Id,
    name: clip.Id,
    x: containerX,
    y: clip.Y ?? 0,
    width,
    align: alignment.toLowerCase(),
    text: clip.Content,
    fontSize: clip.FontSize ?? 24,
    fontFamily: clip.Font || "Arial",
    fill: clip.FontColor ?? "#1f2937",
    wrap: "none",
    fontStyle: `${clip.FontFace?.Italic ? "italic" : "normal"} ${clip.FontFace?.Bold ? "bold" : "normal"}`,
    textDecoration: clip.FontFace?.Underline ? "underline" : "none",
    rotation: clip.Angle ?? 0,
    opacity: clip.FontColorOpacity ?? 1,
    draggable: true,
    visible: editingTextId.value !== clip.Id
  }
}

// 监听选中状态变化，更新 Transformer
watch(() => props.selectedId, () => {
  nextTick(() => {
    updateTransformer()
  })
})

// 监听素材数量变化
watch(() => props.visualClips.length, () => {
  nextTick(() => {
    updateTransformer()
  })
})

// 更新 Transformer
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

  if (!selectedId) {
    transformerNode.nodes([])
    return
  }

  const selectedNode = stage.findOne(`#${selectedId}`)

  if (selectedNode) {
    transformerNode.nodes([selectedNode])
  } else {
    transformerNode.nodes([])
  }
}

// 处理舞台点击
function handleStageMouseDown(e: any) {
  // 如果正在编辑文本，先保存（canvas mousedown 会阻止 textarea blur 触发）
  if (editingTextId.value) {
    finishTextEdit()
    return
  }

  if (e.target === e.target.getStage()) {
    emit("select", null)
    return
  }

  const clickedOnTransformer = e.target.getParent().className === "Transformer"
  if (clickedOnTransformer) {
    return
  }

  const id = e.target.id()
  if (id) {
    emit("select", id)
  } else {
    emit("select", null)
  }
}

// 处理拖拽结束
function handleDragEnd(clip: VisualClip, e: any) {
  if (isVideoClip(clip)) {
    emit("updateVideo", clip.Id!, {
      X: e.target.x(),
      Y: e.target.y()
    })
  } else if (isSubtitleClip(clip)) {
    const sub = clip as SubtitleTrackClip
    const alignment = sub.Alignment || "Center"
    const width = e.target.width()
    const clipX = containerXToClipX(e.target.x(), alignment, width)
    emit("updateSubtitle", clip.Id!, {
      X: clipX,
      Y: e.target.y()
    })
  }
}

// 处理变换结束（缩放、旋转）
function handleTransformEnd(clip: VisualClip, e: any) {
  const node = e.target
  const scaleX = node.scaleX()
  const scaleY = node.scaleY()

  if (isSubtitleClip(clip)) {
    // 对于文本，拖角改字号（取 scaleX/scaleY 较大值，保持等比）
    const scale = Math.max(scaleX, scaleY)
    const alignment = (clip as SubtitleTrackClip).Alignment || "Center"
    const width = node.width()
    const clipX = containerXToClipX(node.x(), alignment, width)
    const updates: Partial<SubtitleTrackClip> = {
      X: clipX,
      Y: node.y(),
      Angle: node.rotation(),
      FontSize: Math.round(Math.max(12, (clip.FontSize || 24) * scale))
    }
    node.scaleX(1)
    node.scaleY(1)
    emit("updateSubtitle", clip.Id!, updates)
  } else if (isVideoClip(clip)) {
    // 对于图片/视频，更新尺寸
    const updates: Partial<VideoTrackClip> = {
      X: node.x(),
      Y: node.y(),
      Width: (clip.Width || 100) * scaleX,
      Height: (clip.Height || 100) * scaleY
    }
    node.scaleX(1)
    node.scaleY(1)
    emit("updateVideo", clip.Id!, updates)
  }
}

// 处理文本双击编辑
function handleTextDblClick(clip: SubtitleTrackClip, e: any) {
  const textNode = e.target

  // 隐藏 transformer
  const transformerNode = transformerRef.value?.getNode()
  if (transformerNode) {
    transformerNode.nodes([])
  }

  editingTextId.value = clip.Id!
  editingTextWidth.value = Math.max(100, textNode.width())
  textNode.hide()

  nextTick(() => {
    textEditorRef.value?.focus()
    textEditorRef.value?.select()
  })
}

// 完成文本编辑
function finishTextEdit() {
  if (!editingTextId.value) return

  const clip = props.visualClips.find(c => c.Id === editingTextId.value) as SubtitleTrackClip
  if (!clip) return

  const newText = textEditorRef.value?.value || clip.Content
  emit("updateSubtitle", editingTextId.value, { Content: newText })

  editingTextId.value = null

  nextTick(() => {
    updateTransformer()
  })
}

// 获取正在编辑的文本素材
const editingTextClip = computed(() => {
  if (!editingTextId.value) return null
  return props.visualClips.find(c => c.Id === editingTextId.value) as SubtitleTrackClip | null
})

// 导出舞台为图片
async function exportToDataURL(): Promise<string | null> {
  if (!stageRef.value) return null

  try {
    // 收集所有跨域图片 URL
    const crossOriginImageUrls = new Set<string>()
    props.visualClips.forEach((clip) => {
      if (isVideoClip(clip) && clip.MediaURL && isCrossOrigin(clip.MediaURL)) {
        crossOriginImageUrls.add(clip.MediaURL)
      }
    })

    // 如果没有跨域图片，直接导出
    if (crossOriginImageUrls.size === 0) {
      const stage = stageRef.value.getNode()
      return stage.toDataURL({ pixelRatio: 2 })
    }

    // 用 CORS 模式重新加载所有跨域图片
    const corsImageMap = new Map<string, HTMLImageElement>()

    try {
      await Promise.all(
        Array.from(crossOriginImageUrls).map(async (url) => {
          const img = await loadImageWithCORS(url)
          corsImageMap.set(url, img)
        })
      )
    } catch (corsError) {
      console.error("缩略图导出失败:", corsError)
      return null
    }

    // 创建临时 Stage 用于导出
    const Konva = (await import("konva")).default
    const tempStage = new Konva.Stage({
      container: document.createElement("div"),
      width: props.stageSize.width,
      height: props.stageSize.height
    })

    const tempLayer = new Konva.Layer()
    tempStage.add(tempLayer)

    // 添加白色背景
    const background = new Konva.Rect({
      x: 0,
      y: 0,
      width: props.stageSize.width,
      height: props.stageSize.height,
      fill: "white"
    })
    tempLayer.add(background)

    // 重新绘制所有元素
    props.visualClips.forEach((clip) => {
      if (isSubtitleClip(clip)) {
        const alignment = clip.Alignment || "Center"
        const clipX = clip.X ?? getDefaultX(alignment)
        const width = getTextContainerWidth(clip)
        const containerX = clipXToContainerX(clipX, alignment, width)
        const text = new Konva.Text({
          x: containerX,
          y: clip.Y ?? 0,
          width,
          align: alignment.toLowerCase(),
          text: clip.Content,
          fontSize: clip.FontSize ?? 24,
          fontFamily: clip.Font || "Arial",
          fill: clip.FontColor ?? "#1f2937",
          rotation: clip.Angle ?? 0,
          opacity: clip.FontColorOpacity ?? 1
        })
        tempLayer.add(text)
      } else if (isVideoClip(clip) && clip.MediaURL) {
        const img = corsImageMap.get(clip.MediaURL) || imageCache.value.get(clip.MediaURL)
        if (img) {
          const image = new Konva.Image({
            x: clip.X ?? 0,
            y: clip.Y ?? 0,
            image: img,
            width: clip.Width,
            height: clip.Height,
            opacity: clip.Opacity ?? 1
          })
          tempLayer.add(image)
        }
      }
    })

    const dataURL = tempStage.toDataURL({ pixelRatio: 2 })
    tempStage.destroy()

    return dataURL
  } catch (error) {
    console.error("导出缩略图失败:", error)
    return null
  }
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

        <!-- 渲染所有可视素材 -->
        <template v-for="clip in visualClips" :key="`clip-${clip.Id}`">
          <!-- 字幕（文本） -->
          <v-text
            v-if="isSubtitleClip(clip)"
            :key="`text-${clip.Id}-${clip.Font}`"
            :config="getTextConfig(clip)"
            @dragend="handleDragEnd(clip, $event)"
            @transformend="handleTransformEnd(clip, $event)"
            @dblclick="handleTextDblClick(clip, $event)"
          />

          <!-- 图片/视频 -->
          <v-image
            v-else-if="isVideoClip(clip)"
            :config="getImageConfig(clip)"
            @dragend="handleDragEnd(clip, $event)"
            @transformend="handleTransformEnd(clip, $event)"
          />
        </template>

        <!-- Transformer -->
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
      v-if="editingTextClip"
      ref="textEditorRef"
      :value="editingTextClip.Content"
      :style="({
        position: 'absolute',
        left: `${clipXToContainerX(editingTextClip.X ?? getDefaultX(editingTextClip.Alignment || 'Center'), editingTextClip.Alignment || 'Center', getTextContainerWidth(editingTextClip))}px`,
        top: `${editingTextClip.Y ?? 0}px`,
        width: `${getTextContainerWidth(editingTextClip)}px`,
        fontSize: `${editingTextClip.FontSize ?? 24}px`,
        fontFamily: editingTextClip.Font || 'Arial',
        color: editingTextClip.FontColor ?? '#000',
        textAlign: editingTextClip.Alignment?.toLowerCase() || 'center',
        padding: '0',
        margin: '0',
        border: '1px solid #1890ff',
        outline: 'none',
        background: 'rgba(255, 255, 255, 0.9)',
        resize: 'none',
        overflow: 'hidden',
        lineHeight: '1.2',
      } as CSSProperties)"
      @blur="finishTextEdit"
      @keydown.enter.exact="finishTextEdit"
      @keydown.esc="finishTextEdit"
    />
  </div>
</template>

<style scoped lang="scss">
.canvas-editor-konva {
  width: 360px;
  height: 640px;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  background: #ffffff;
  overflow: hidden;
}
</style>
