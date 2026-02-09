import type {
  AnyClip,
  AudioTrackClip,
  SubtitleTrackClip,
  TemplateContent,
  VideoTrackClip,
  VisualClip
} from "@/types/timeline"
import { computed, ref } from "vue"
import {
  createAudioClip,
  createSubtitleClip,
  createVideoClip,
  getTotalDuration,
  removeInternalIds
} from "@/types/timeline"

// 默认画布尺寸
const DEFAULT_CANVAS_WIDTH = 375
const DEFAULT_CANVAS_HEIGHT = 667

export function useTimeline() {
  // ========================================
  // 状态
  // ========================================

  // 模板内容（阿里云结构）
  const content = ref<TemplateContent>({
    FECanvas: {
      Width: DEFAULT_CANVAS_WIDTH,
      Height: DEFAULT_CANVAS_HEIGHT
    },
    AspectRatio: "9:16",
    VideoTracks: [{ VideoTrackClips: [] }],
    SubtitleTracks: [{ SubtitleTrackClips: [] }],
    AudioTracks: [{ AudioTrackClips: [] }]
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

  // 添加图片
  const addImage = (url: string) => {
    const clip = createVideoClip("Image", url)

    // 加载图片获取尺寸
    const img = new Image()
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
  const exportJSON = (): TemplateContent => {
    return content.value
  }

  // 从JSON加载
  const loadFromJSON = (json: TemplateContent) => {
    if (json) {
      content.value = json
    }
    selectedId.value = null
  }

  // ========================================
  // 清空画布
  // ========================================

  const clearCanvas = () => {
    content.value = {
      FECanvas: {
        Width: DEFAULT_CANVAS_WIDTH,
        Height: DEFAULT_CANVAS_HEIGHT
      },
      AspectRatio: "9:16",
      VideoTracks: [{ VideoTrackClips: [] }],
      SubtitleTracks: [{ SubtitleTrackClips: [] }],
      AudioTracks: [{ AudioTrackClips: [] }]
    }
    selectedId.value = null
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
