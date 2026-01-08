import { ref } from "vue"

// 出入场动画类型
export type AnimationType = "none" | "fade" | "slide-left" | "slide-right" | "slide-up" | "slide-down" | "zoom" | "bounce"

// 文字特效类型
export interface TextEffect {
  shadow?: {
    enabled: boolean
    color: string
    blur: number
    offsetX: number
    offsetY: number
  }
  gradient?: {
    enabled: boolean
    colors: string[]
    angle: number
  }
}

export interface KonvaElement {
  id: string
  type: "text" | "image"
  name: string
  x: number
  y: number
  rotation: number
  opacity: number
  // 尺寸属性
  width?: number
  height?: number
  // 文本属性
  text?: string
  fontSize?: number
  fontWeight?: string
  fontStyle?: string // 字体样式：normal | italic
  textDecoration?: string // 文本装饰：none | underline
  fontFamily?: string // 新增：字体家族
  textAlign?: string
  textEffect?: TextEffect // 新增：文字特效
  fill?: string
  stroke?: string
  strokeWidth?: number
  // 图片属性
  imageUrl?: string
  scaleX?: number
  scaleY?: number
  // 视频时间轴属性
  timeline?: {
    startTime: number // 入场时间（秒）
    duration: number // 持续时间（秒）
    endTime: number // 出场时间（秒），计算属性：startTime + duration
  }
  // 出入场动画
  animation?: {
    in: AnimationType // 入场动画
    out: AnimationType // 出场动画
    inDuration: number // 入场动画时长（秒）
    outDuration: number // 出场动画时长（秒）
  }
}

export function useKonva() {
  const elements = ref<KonvaElement[]>([])
  const selectedId = ref<string | null>(null)
  const stageSize = { width: 375, height: 667 }

  // 获取当前选中的元素
  const activeElement = computed(() => {
    if (!selectedId.value) return null
    return elements.value.find(el => el.id === selectedId.value) || null
  })

  // 添加文本
  const addText = (text: string = "双击编辑文本") => {
    const id = `text-${Date.now()}`
    elements.value.push({
      id,
      type: "text",
      name: "文本",
      x: 150,
      y: 150,
      width: 200,
      rotation: 0,
      opacity: 1,
      text,
      fontSize: 24,
      fill: "#1f2937",
      stroke: "#000000",
      strokeWidth: 0,
      fontWeight: "normal",
      fontStyle: "normal",
      textDecoration: "none",
      fontFamily: "Arial",
      textAlign: "left",
      // 默认时间轴配置
      timeline: {
        startTime: 0,
        duration: 3,
        endTime: 3
      },
      // 默认动画配置
      animation: {
        in: "fade",
        out: "fade",
        inDuration: 0.5,
        outDuration: 0.5
      }
    })
    selectedId.value = id
  }

  // 添加图片
  const addImage = (url: string) => {
    const id = `image-${Date.now()}`
    const img = new Image()
    // img.crossOrigin = "anonymous" // 注释掉，避免阿里云 OSS CORS 问题
    img.onload = () => {
      elements.value.push({
        id,
        type: "image",
        name: "图片",
        x: 100,
        y: 100,
        width: img.width,
        height: img.height,
        rotation: 0,
        opacity: 1,
        imageUrl: url,
        scaleX: 0.5,
        scaleY: 0.5,
        // 默认时间轴配置
        timeline: {
          startTime: 0,
          duration: 3,
          endTime: 3
        },
        // 默认动画配置
        animation: {
          in: "fade",
          out: "fade",
          inDuration: 0.5,
          outDuration: 0.5
        }
      })
      selectedId.value = id
    }
    img.onerror = (e) => {
      console.error("图片加载失败:", url, e)
    }
    img.src = url
  }

  // 删除选中元素
  const deleteSelected = () => {
    if (!selectedId.value) return
    const index = elements.value.findIndex(el => el.id === selectedId.value)
    if (index > -1) {
      elements.value.splice(index, 1)
      selectedId.value = null
    }
  }

  // 选中元素
  const selectElement = (id: string) => {
    selectedId.value = id
  }

  // 删除指定元素
  const deleteElement = (id: string) => {
    const index = elements.value.findIndex(el => el.id === id)
    if (index > -1) {
      elements.value.splice(index, 1)
      if (selectedId.value === id) {
        selectedId.value = null
      }
    }
  }

  // 重新排序图层
  const reorderLayers = (newElements: KonvaElement[]) => {
    elements.value = [...newElements]
  }

  // 清空画布
  const clearCanvas = () => {
    elements.value = []
    selectedId.value = null
  }

  // 导出为 JSON
  const exportJSON = () => {
    return {
      version: "1.0",
      elements: elements.value
    }
  }

  // 导出为图片 (需要在组件中调用 stage.toDataURL())
  const exportImage = () => {
    return null // 将在组件中实现
  }

  // 从 JSON 加载
  const loadFromJSON = (json: any) => {
    if (json && json.elements) {
      elements.value = json.elements
      selectedId.value = null
    }
  }

  // 更新元素属性
  const updateElement = (id: string, updates: Partial<KonvaElement>) => {
    const element = elements.value.find(el => el.id === id)
    if (element) {
      Object.assign(element, updates)
    }
  }

  return {
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
    exportImage,
    loadFromJSON,
    updateElement
  }
}
