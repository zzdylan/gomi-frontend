import type {
  AnyClip,
  AudioTrackClip,
  DynamicText,
  DynamicTextTypeValue,
  SubtitleTrackClip,
  TemplateContent,
  TemplateCustomData,
  VideoTrackClip,
  VisualClip
} from "@/types/timeline"
import { computed, ref } from "vue"
import {
  createAudioClip,
  createSubtitleClip,
  createVideoClip,
  generateClipId,
  getTotalDuration,
  removeInternalIds
} from "@/types/timeline"

// 默认画布尺寸
const DEFAULT_CANVAS_WIDTH = 360
const DEFAULT_CANVAS_HEIGHT = 640

export function useTimeline() {
  // ========================================
  // 状态
  // ========================================

  // 创建默认初始内容（含竖屏视频占位）
  function createInitialContent(): TemplateContent {
    return {
      FECanvas: {
        Width: DEFAULT_CANVAS_WIDTH,
        Height: DEFAULT_CANVAS_HEIGHT
      },
      AspectRatio: "9:16",
      VideoTracks: [{ VideoTrackClips: [createPlaceholderClip(DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT, "9:16")] }],
      SubtitleTracks: [{ SubtitleTrackClips: [] }],
      AudioTracks: [{ AudioTrackClips: [] }]
    }
  }

  // 模板内容（阿里云结构）
  const content = ref<TemplateContent>(createInitialContent())

  // 模板自定义数据（动态元素配置）
  const customData = ref<TemplateCustomData>({
    dynamic_texts: []
  })

  // 当前选中的素材ID
  const selectedId = ref<string | null>(null)

  // 画布尺寸（从 content.FECanvas 计算）
  const stageSize = computed(() => ({
    width: content.value.FECanvas?.Width ?? DEFAULT_CANVAS_WIDTH,
    height: content.value.FECanvas?.Height ?? DEFAULT_CANVAS_HEIGHT
  }))

  // ========================================
  // 计算属性
  // ========================================

  // 获取所有视频/图片素材（扁平化，用于画布渲染）
  const videoClips = computed(() => {
    return content.value.VideoTracks?.flatMap(track => track.VideoTrackClips) || []
  })

  // 获取所有字幕素材（扁平化，用于画布渲染）
  const subtitleClips = computed(() => {
    return content.value.SubtitleTracks?.flatMap(track => track.SubtitleTrackClips) || []
  })

  // 获取所有可视素材（用于画布渲染）
  const visualClips = computed<VisualClip[]>(() => {
    return [...videoClips.value, ...subtitleClips.value]
  })

  // 获取所有音频素材
  const audioClips = computed(() => {
    return content.value.AudioTracks?.flatMap(track => track.AudioTrackClips) || []
  })

  // 获取当前选中的素材
  const activeClip = computed<AnyClip | null>(() => {
    if (!selectedId.value) return null

    // 在视频轨中查找
    for (const clip of videoClips.value) {
      if (clip.Id === selectedId.value) return clip
    }

    // 在字幕轨中查找
    for (const clip of subtitleClips.value) {
      if (clip.Id === selectedId.value) return clip
    }

    // 在音频轨中查找
    for (const clip of audioClips.value) {
      if (clip.Id === selectedId.value) return clip
    }

    return null
  })

  // 获取选中素材的类型
  const activeClipType = computed<"video" | "image" | "text" | "audio" | null>(() => {
    const clip = activeClip.value
    if (!clip) return null

    if ("Type" in clip) {
      if (clip.Type === "Video") return "video"
      if (clip.Type === "Image") return "image"
      if (clip.Type === "Text") return "text"
    }

    // 音频素材没有Type字段
    if ("MediaURL" in clip && !("Type" in clip)) return "audio"

    return null
  })

  // 总时长
  const totalDuration = computed(() => getTotalDuration(content.value))

  // ========================================
  // 添加素材
  // ========================================

  // 创建视频占位 clip
  function createPlaceholderClip(canvasWidth: number, canvasHeight: number, aspect: "9:16" | "16:9"): VideoTrackClip {
    const x = 0
    let y = 0
    let w = canvasWidth
    let h = canvasHeight
    if (aspect === "16:9") {
      w = canvasWidth
      h = Math.round(canvasWidth * 9 / 16)
      y = Math.round((canvasHeight - h) / 2)
    }
    return {
      Id: generateClipId("video"),
      Type: "Video",
      MediaURL: "",
      X: x,
      Y: y,
      Width: w,
      Height: h,
      Opacity: 1
    }
  }

  // 当前视频占位的画面比例（根据占位尺寸自动判断）
  const videoPlaceholderAspect = computed<"9:16" | "16:9">(() => {
    const placeholder = videoClips.value.find(c => c.Type === "Video" && !c.MediaURL)
    if (!placeholder || !placeholder.Width || !placeholder.Height) return "9:16"
    return placeholder.Width / placeholder.Height > 1 ? "16:9" : "9:16"
  })

  // 切换视频占位的画面比例（删除旧占位 → 添加新占位）
  const setVideoPlaceholderAspect = (aspect: "9:16" | "16:9") => {
    const canvasWidth = content.value.FECanvas?.Width ?? DEFAULT_CANVAS_WIDTH
    const canvasHeight = content.value.FECanvas?.Height ?? DEFAULT_CANVAS_HEIGHT

    // 删除已有占位
    content.value.VideoTracks?.forEach((track) => {
      const idx = track.VideoTrackClips.findIndex(c => c.Type === "Video" && !c.MediaURL)
      if (idx > -1) track.VideoTrackClips.splice(idx, 1)
    })

    // 添加新占位
    const clip = createPlaceholderClip(canvasWidth, canvasHeight, aspect)
    if (!content.value.VideoTracks || content.value.VideoTracks.length === 0) {
      content.value.VideoTracks = [{ VideoTrackClips: [] }]
    }
    content.value.VideoTracks[0].VideoTrackClips.push(clip)
    selectedId.value = clip.Id!
  }

  // 添加图片
  const addImage = (url: string, mediaId?: string) => {
    const clip = createVideoClip("Image", url, mediaId)

    // 加载图片获取尺寸
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      clip.Width = img.width
      clip.Height = img.height

      // 添加到第一个视频轨
      if (!content.value.VideoTracks || content.value.VideoTracks.length === 0) {
        content.value.VideoTracks = [{ VideoTrackClips: [] }]
      }
      content.value.VideoTracks[0].VideoTrackClips.push(clip)
      selectedId.value = clip.Id!
    }
    img.onerror = (e) => {
      console.error("图片加载失败:", url, e)
    }
    img.src = url
  }

  // 添加视频
  const addVideo = (url: string) => {
    const clip = createVideoClip("Video", url)

    if (!content.value.VideoTracks || content.value.VideoTracks.length === 0) {
      content.value.VideoTracks = [{ VideoTrackClips: [] }]
    }
    content.value.VideoTracks[0].VideoTrackClips.push(clip)
    selectedId.value = clip.Id!
  }

  // 添加文本
  const addText = (text: string = "双击编辑文本") => {
    const clip = createSubtitleClip(text)

    if (!content.value.SubtitleTracks || content.value.SubtitleTracks.length === 0) {
      content.value.SubtitleTracks = [{ SubtitleTrackClips: [] }]
    }
    content.value.SubtitleTracks[0].SubtitleTrackClips.push(clip)
    selectedId.value = clip.Id!
  }

  // 添加音频
  const addAudio = (url: string) => {
    const clip = createAudioClip(url)

    if (!content.value.AudioTracks || content.value.AudioTracks.length === 0) {
      content.value.AudioTracks = [{ AudioTrackClips: [] }]
    }
    content.value.AudioTracks[0].AudioTrackClips.push(clip)
    selectedId.value = clip.Id!
  }

  // ========================================
  // 删除素材
  // ========================================

  // 删除指定素材
  const deleteClip = (id: string) => {
    // 从视频轨中删除
    content.value.VideoTracks?.forEach((track) => {
      const index = track.VideoTrackClips.findIndex(clip => clip.Id === id)
      if (index > -1) {
        track.VideoTrackClips.splice(index, 1)
      }
    })

    // 从字幕轨中删除
    content.value.SubtitleTracks?.forEach((track) => {
      const index = track.SubtitleTrackClips.findIndex(clip => clip.Id === id)
      if (index > -1) {
        track.SubtitleTrackClips.splice(index, 1)
      }
    })

    // 从音频轨中删除
    content.value.AudioTracks?.forEach((track) => {
      const index = track.AudioTrackClips.findIndex(clip => clip.Id === id)
      if (index > -1) {
        track.AudioTrackClips.splice(index, 1)
      }
    })

    // 清除选中状态
    if (selectedId.value === id) {
      selectedId.value = null
    }
  }

  // 删除选中的素材
  const deleteSelected = () => {
    if (selectedId.value) {
      deleteClip(selectedId.value)
    }
  }

  // ========================================
  // 选择素材
  // ========================================

  const selectClip = (id: string | null) => {
    selectedId.value = id
  }

  // ========================================
  // 更新素材
  // ========================================

  // 更新视频/图片素材
  const updateVideoClip = (id: string, updates: Partial<VideoTrackClip>) => {
    content.value.VideoTracks?.forEach((track) => {
      const clip = track.VideoTrackClips.find(c => c.Id === id)
      if (clip) {
        Object.assign(clip, updates)
      }
    })
  }

  // 更新字幕素材
  const updateSubtitleClip = (id: string, updates: Partial<SubtitleTrackClip>) => {
    content.value.SubtitleTracks?.forEach((track) => {
      const clip = track.SubtitleTrackClips.find(c => c.Id === id)
      if (clip) {
        Object.assign(clip, updates)
      }
    })
  }

  // 更新音频素材
  const updateAudioClip = (id: string, updates: Partial<AudioTrackClip>) => {
    content.value.AudioTracks?.forEach((track) => {
      const clip = track.AudioTrackClips.find(c => c.Id === id)
      if (clip) {
        Object.assign(clip, updates)
      }
    })
  }

  // 通用更新方法（根据ID自动判断类型）
  const updateClip = (id: string, updates: Partial<AnyClip>) => {
    // 尝试在视频轨中更新
    for (const track of content.value.VideoTracks || []) {
      const clip = track.VideoTrackClips.find(c => c.Id === id)
      if (clip) {
        Object.assign(clip, updates)
        return
      }
    }

    // 尝试在字幕轨中更新
    for (const track of content.value.SubtitleTracks || []) {
      const clip = track.SubtitleTrackClips.find(c => c.Id === id)
      if (clip) {
        Object.assign(clip, updates)
        return
      }
    }

    // 尝试在音频轨中更新
    for (const track of content.value.AudioTracks || []) {
      const clip = track.AudioTrackClips.find(c => c.Id === id)
      if (clip) {
        Object.assign(clip, updates)
        return
      }
    }
  }

  // ========================================
  // 导入/导出
  // ========================================

  // 导出为阿里云格式（移除内部ID）
  const exportForAliyun = (): TemplateContent => {
    return removeInternalIds(content.value)
  }

  // 导出完整JSON（包含内部ID，用于前端保存）
  // 坐标从像素转为百分比（ICE 规则：0~0.9999 = 百分比，>=2 = 绝对像素）
  const exportJSON = (): TemplateContent => {
    const canvasWidth = content.value.FECanvas?.Width ?? DEFAULT_CANVAS_WIDTH
    const canvasHeight = content.value.FECanvas?.Height ?? DEFAULT_CANVAS_HEIGHT

    const exported = JSON.parse(JSON.stringify(content.value)) as TemplateContent

    // 视频/图片轨：X, Width 除以画布宽；Y, Height 除以画布高
    exported.VideoTracks?.forEach((track) => {
      track.VideoTrackClips.forEach((clip) => {
        if (clip.X !== undefined) clip.X = clip.X / canvasWidth
        if (clip.Y !== undefined) clip.Y = clip.Y / canvasHeight
        if (clip.Width !== undefined) clip.Width = clip.Width / canvasWidth
        if (clip.Height !== undefined) clip.Height = clip.Height / canvasHeight
      })
    })

    // 字幕轨：X 除以画布宽；Y 除以画布高
    exported.SubtitleTracks?.forEach((track) => {
      track.SubtitleTrackClips.forEach((clip) => {
        if (clip.X !== undefined) clip.X = clip.X / canvasWidth
        if (clip.Y !== undefined) clip.Y = clip.Y / canvasHeight
        if (!["Left", "Center", "Right"].includes(clip.Alignment ?? "")) {
          clip.Alignment = "Center"
        }
      })
    })

    return exported
  }

  // 从JSON加载
  // 坐标从百分比转回像素（编辑器使用像素）
  const loadFromJSON = (json: TemplateContent) => {
    if (json) {
      const canvasWidth = json.FECanvas?.Width ?? DEFAULT_CANVAS_WIDTH
      const canvasHeight = json.FECanvas?.Height ?? DEFAULT_CANVAS_HEIGHT

      // 视频/图片轨
      json.VideoTracks?.forEach((track) => {
        track.VideoTrackClips.forEach((clip) => {
          if (clip.X !== undefined) clip.X = Math.round(clip.X * canvasWidth)
          if (clip.Y !== undefined) clip.Y = Math.round(clip.Y * canvasHeight)
          if (clip.Width !== undefined) clip.Width = Math.round(clip.Width * canvasWidth)
          if (clip.Height !== undefined) clip.Height = Math.round(clip.Height * canvasHeight)
        })
      })

      // 字幕轨
      json.SubtitleTracks?.forEach((track) => {
        track.SubtitleTrackClips.forEach((clip) => {
          if (clip.X !== undefined) clip.X = Math.round(clip.X * canvasWidth)
          if (clip.Y !== undefined) clip.Y = Math.round(clip.Y * canvasHeight)
        })
      })

      content.value = json
    }
    selectedId.value = null
  }

  // ========================================
  // 清空画布
  // ========================================

  const clearCanvas = () => {
    content.value = createInitialContent()
    customData.value = { dynamic_texts: [] }
    selectedId.value = null
  }

  // ========================================
  // 动态文案管理
  // ========================================

  // 获取指定 clip 的动态文案配置
  const getDynamicText = (clipId: string): DynamicText | undefined => {
    return customData.value.dynamic_texts?.find(dt => dt.clip_id === clipId)
  }

  // 设置动态文案配置
  const setDynamicText = (clipId: string, type: DynamicTextTypeValue | null, customTexts?: string[]) => {
    if (!customData.value.dynamic_texts) {
      customData.value.dynamic_texts = []
    }

    // 移除现有配置
    const index = customData.value.dynamic_texts.findIndex(dt => dt.clip_id === clipId)
    if (index > -1) {
      customData.value.dynamic_texts.splice(index, 1)
    }

    // 如果 type 不为空，添加新配置
    if (type) {
      const newDynamicText: DynamicText = {
        clip_id: clipId,
        type
      }
      if (type === "custom" && customTexts && customTexts.length > 0) {
        newDynamicText.custom_texts = customTexts
      }
      customData.value.dynamic_texts.push(newDynamicText)
    }
  }

  // 导出 customData JSON
  const exportCustomData = (): TemplateCustomData => {
    return customData.value
  }

  // 加载 customData
  const loadCustomData = (data: TemplateCustomData) => {
    customData.value = data || { dynamic_texts: [] }
  }

  // ========================================
  // 图层排序
  // ========================================

  // 重新排序视频轨素材
  const reorderVideoClips = (newClips: VideoTrackClip[]) => {
    if (content.value.VideoTracks && content.value.VideoTracks.length > 0) {
      content.value.VideoTracks[0].VideoTrackClips = [...newClips]
    }
  }

  // 重新排序字幕轨素材
  const reorderSubtitleClips = (newClips: SubtitleTrackClip[]) => {
    if (content.value.SubtitleTracks && content.value.SubtitleTracks.length > 0) {
      content.value.SubtitleTracks[0].SubtitleTrackClips = [...newClips]
    }
  }

  // ========================================
  // 返回
  // ========================================

  return {
    // 状态
    content,
    customData,
    selectedId,
    stageSize,

    // 计算属性
    videoClips,
    subtitleClips,
    visualClips,
    audioClips,
    activeClip,
    activeClipType,
    totalDuration,

    // 添加素材
    videoPlaceholderAspect,
    setVideoPlaceholderAspect,
    addImage,
    addVideo,
    addText,
    addAudio,

    // 删除素材
    deleteClip,
    deleteSelected,

    // 选择素材
    selectClip,

    // 更新素材
    updateVideoClip,
    updateSubtitleClip,
    updateAudioClip,
    updateClip,

    // 动态文案
    getDynamicText,
    setDynamicText,
    exportCustomData,
    loadCustomData,

    // 导入/导出
    exportForAliyun,
    exportJSON,
    loadFromJSON,

    // 其他
    clearCanvas,
    reorderVideoClips,
    reorderSubtitleClips
  }
}
