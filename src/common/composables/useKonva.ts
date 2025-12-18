import { ref } from "vue"

export interface KonvaElement {
  id: string
  type: "rect" | "circle" | "text" | "image"
  name: string
  x: number
  y: number
  rotation: number
  opacity: number
  // 矩形/圆形属性
  width?: number
  height?: number
  radius?: number
  fill?: string
  stroke?: string
  strokeWidth?: number
  // 文本属性
  text?: string
  fontSize?: number
  fontWeight?: string
  textAlign?: string
  // 图片属性
  imageUrl?: string
  scaleX?: number
  scaleY?: number
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

  // 添加矩形
  const addRect = () => {
    const id = `rect-${Date.now()}`
    elements.value.push({
      id,
      type: "rect",
      name: "矩形",
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      rotation: 0,
      opacity: 1,
      fill: "#3b82f6",
      stroke: "#1e40af",
      strokeWidth: 2
    })
    selectedId.value = id
  }

  // 添加圆形
  const addCircle = () => {
    const id = `circle-${Date.now()}`
    elements.value.push({
      id,
      type: "circle",
      name: "圆形",
      x: 200,
      y: 200,
      radius: 50,
      rotation: 0,
      opacity: 1,
      fill: "#10b981",
      stroke: "#059669",
      strokeWidth: 2
    })
    selectedId.value = id
  }

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
      fontWeight: "normal",
      textAlign: "left"
    })
    selectedId.value = id
  }

  // 添加图片
  const addImage = (url: string) => {
    const id = `image-${Date.now()}`
    const img = new Image()
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
        scaleY: 0.5
      })
      selectedId.value = id
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
    addRect,
    addCircle,
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
