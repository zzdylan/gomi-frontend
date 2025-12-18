import type { Ref } from "vue"
import { Canvas, Circle, FabricImage, Rect, Textbox } from "fabric"
import { markRaw, onMounted, onUnmounted, ref } from "vue"

export interface FabricElement {
  id: string
  type: "rect" | "circle" | "text" | "image"
  name: string
}

export function useFabric(canvasEl: Ref<HTMLCanvasElement | undefined>) {
  // 重要：不使用 ref 包裹 canvas，避免 Vue 响应式系统干扰 Fabric.js
  let canvas: Canvas | undefined
  const activeObject = ref<any>(null)
  const elements = ref<FabricElement[]>([])

  // 初始化画布 - 手机端尺寸 (375x667 iPhone SE)
  const initCanvas = () => {
    if (!canvasEl.value) return

    // 使用 markRaw 防止 Vue 将 Canvas 实例转换为响应式对象
    canvas = markRaw(new Canvas(canvasEl.value, {
      width: 375,
      height: 667,
      backgroundColor: "#ffffff"
    }))

    // 监听对象选中事件
    canvas.on("selection:created", (e) => {
      activeObject.value = markRaw(e.selected?.[0])
    })

    canvas.on("selection:updated", (e) => {
      activeObject.value = markRaw(e.selected?.[0])
    })

    canvas.on("selection:cleared", () => {
      activeObject.value = null
    })

    // 监听对象添加事件
    canvas.on("object:added", updateElements)
    canvas.on("object:removed", updateElements)
  }

  // 更新图层列表
  const updateElements = () => {
    if (!canvas) return
    const objects = canvas.getObjects()
    elements.value = objects.map((obj, index) => ({
      id: obj.get("id") || `element-${index}`,
      type: obj.type as any,
      name: obj.get("name") || `${obj.type}-${index}`
    }))
  }

  // 添加矩形
  const addRect = () => {
    if (!canvas) return

    const rect = new Rect({
      left: 100,
      top: 100,
      width: 100,
      height: 100,
      fill: "#3b82f6",
      stroke: "#1e40af",
      strokeWidth: 2
    })

    const id = `rect-${Date.now()}`
    rect.set("id", id)
    rect.set("name", "矩形")

    canvas.add(rect)
    canvas.setActiveObject(rect)
    canvas.renderAll()
  }

  // 添加圆形
  const addCircle = () => {
    if (!canvas) return

    const circle = new Circle({
      left: 200,
      top: 200,
      radius: 50,
      fill: "#10b981",
      stroke: "#059669",
      strokeWidth: 2
    })

    const id = `circle-${Date.now()}`
    circle.set("id", id)
    circle.set("name", "圆形")

    canvas.add(circle)
    canvas.setActiveObject(circle)
    canvas.renderAll()
  }

  // 添加文本
  const addText = (text: string = "双击编辑文本") => {
    if (!canvas) return

    const textbox = new Textbox(text, {
      left: 150,
      top: 150,
      width: 200,
      fontSize: 24,
      fill: "#1f2937",
      fontFamily: "Arial"
    })

    const id = `text-${Date.now()}`
    textbox.set("id", id)
    textbox.set("name", "文本")

    canvas.add(textbox)
    canvas.setActiveObject(textbox)
    canvas.renderAll()
  }

  // 添加图片
  const addImage = (url: string) => {
    if (!canvas) return

    FabricImage.fromURL(url).then((img) => {
      if (!canvas) return

      img.scale(0.5)
      img.set({
        left: 100,
        top: 100
      })

      const id = `image-${Date.now()}`
      img.set("id", id)
      img.set("name", "图片")

      canvas.add(img)
      canvas.setActiveObject(img)
      canvas.renderAll()
    })
  }

  // 删除选中对象
  const deleteSelected = () => {
    if (!canvas || !activeObject.value) return

    const objToRemove = activeObject.value
    console.log("Deleting object:", objToRemove)

    // 先取消选中
    canvas.discardActiveObject()

    // 删除对象
    const removed = canvas.remove(objToRemove)
    console.log("Remove result:", removed, "Objects after remove:", canvas.getObjects().length)

    // 清空引用
    activeObject.value = null

    // 重新渲染
    canvas.renderAll()

    // 手动触发更新
    canvas.requestRenderAll()
  }

  // 选中指定图层
  const selectElement = (id: string) => {
    if (!canvas) return

    const obj = canvas.getObjects().find(o => o.get("id") === id)
    if (obj) {
      canvas.setActiveObject(obj)
      canvas.renderAll()
    }
  }

  // 删除指定图层
  const deleteElement = (id: string) => {
    if (!canvas) return

    const obj = canvas.getObjects().find(o => o.get("id") === id)
    if (obj) {
      canvas.remove(obj)
      canvas.renderAll()
    }
  }

  // 上移图层
  const moveLayerUp = (id: string) => {
    if (!canvas) return

    const objects = canvas.getObjects()
    const index = objects.findIndex(o => o.get("id") === id)
    if (index > -1 && index < objects.length - 1) {
      const obj = objects[index]
      canvas.remove(obj)
      canvas.insertAt(index + 1, obj)
      canvas.renderAll()
      updateElements()
    }
  }

  // 下移图层
  const moveLayerDown = (id: string) => {
    if (!canvas) return

    const objects = canvas.getObjects()
    const index = objects.findIndex(o => o.get("id") === id)
    if (index > 0) {
      const obj = objects[index]
      canvas.remove(obj)
      canvas.insertAt(index - 1, obj)
      canvas.renderAll()
      updateElements()
    }
  }

  // 重新排序图层
  const reorderLayers = (newElements: FabricElement[]) => {
    if (!canvas) return

    const objects = canvas.getObjects()
    const orderedObjects = newElements.map((element) => {
      return objects.find(obj => obj.get("id") === element.id)
    }).filter(Boolean)

    // 清空画布并按新顺序添加对象
    canvas.remove(...objects)
    orderedObjects.forEach((obj) => {
      if (obj && canvas) canvas.add(obj)
    })

    canvas.renderAll()
    updateElements()
  }

  // 清空画布
  const clearCanvas = () => {
    if (!canvas) return
    canvas.clear()
    canvas.backgroundColor = "#ffffff"
    canvas.renderAll()
  }

  // 导出为 JSON
  const exportJSON = () => {
    if (!canvas) return null
    return canvas.toJSON()
  }

  // 导出为图片
  const exportImage = () => {
    if (!canvas) return null
    return canvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 1
    })
  }

  // 从 JSON 加载
  const loadFromJSON = (json: any) => {
    if (!canvas) return

    canvas.loadFromJSON(json, () => {
      canvas?.renderAll()
      updateElements()
    })
  }

  onMounted(() => {
    initCanvas()
  })

  onUnmounted(() => {
    canvas?.dispose()
  })

  return {
    canvas,
    activeObject,
    elements,
    addRect,
    addCircle,
    addText,
    addImage,
    deleteSelected,
    selectElement,
    deleteElement,
    moveLayerUp,
    moveLayerDown,
    reorderLayers,
    clearCanvas,
    exportJSON,
    exportImage,
    loadFromJSON
  }
}
