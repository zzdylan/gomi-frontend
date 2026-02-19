// ========================================
// 模板内容结构定义（阿里云 Timeline 精简版）
// 字段命名与阿里云保持一致，便于直接提交
// ========================================

// FECanvas 前端画布尺寸
export interface FECanvas {
  Width: number // 画布宽度
  Height: number // 画布高度
}

// TemplateContent 模板内容（对应阿里云 Timeline）
export interface TemplateContent {
  // 画布设置
  FECanvas?: FECanvas // 前端画布尺寸
  AspectRatio?: string // 宽高比，如 "9:16"

  // 轨道
  VideoTracks?: VideoTrack[]
  SubtitleTracks?: SubtitleTrack[]
  AudioTracks?: AudioTrack[]
}

// ========================================
// 视频轨（图片 + 视频）
// ========================================

export interface VideoTrack {
  VideoTrackClips: VideoTrackClip[]
}

export interface VideoTrackClip {
  // 前端内部ID（用于Konva渲染识别，不提交给阿里云）
  Id?: string

  // 素材类型与来源
  Type: "Video" | "Image"
  MediaId?: string // 阿里云媒资 ID（用于保存，阿里云 OSS 时使用）
  MediaURL: string // 媒资访问 URL（用于显示）

  // 素材裁剪（视频用）
  In?: number // 素材裁剪开始时间（秒），0=从头开始
  Out?: number // 素材裁剪结束时间（秒）

  // 时间线位置
  TimelineIn?: number // 时间线入点（秒），0=从头开始
  TimelineOut?: number // 时间线出点（秒）
  Duration?: number // 持续时长（图片用）

  // 位置与尺寸
  X?: number // X坐标，0=左边缘
  Y?: number // Y坐标，0=上边缘
  Width?: number // 宽度
  Height?: number // 高度
  Opacity?: number // 不透明度，0=全透明，1=不透明

  // 特效
  Effects?: Effect[]
}

// ========================================
// 字幕轨（文字）
// ========================================

export interface SubtitleTrack {
  SubtitleTrackClips: SubtitleTrackClip[]
}

export interface SubtitleTrackClip {
  // 前端内部ID（用于Konva渲染识别，不提交给阿里云）
  Id?: string

  // 类型与内容
  Type: "Text"
  Content: string

  // 时间线位置
  TimelineIn?: number // 时间线入点（秒），0=从头开始
  TimelineOut?: number // 时间线出点（秒）

  // 位置
  X?: number // X坐标，0=左边缘
  Y?: number // Y坐标，0=上边缘
  Angle?: number // 旋转角度，0=不旋转

  // 字体样式
  Font?: string // 字体
  FontSize?: number // 字号
  FontColor?: string // 字体颜色
  FontColorOpacity?: number // 字体透明度，0=全透明
  FontFace?: FontFace // 字体样式（粗体/斜体/下划线）

  // 对齐
  Alignment?: string // ICE 定位锚点（TopLeft/Center/Right 等），前端固定为 TopLeft

  // 字幕特效（描边、阴影、背景框统一在这里设置）
  SubtitleEffects?: SubtitleEffect[]

  // 入场出场动画
  AaiMotionInEffect?: string // 入场动画类型
  AaiMotionIn?: number // 入场动画时长，0=无动画
  AaiMotionOutEffect?: string // 出场动画类型
  AaiMotionOut?: number // 出场动画时长，0=无动画
}

// FontFace 字体样式
export interface FontFace {
  Bold?: boolean // 加粗
  Italic?: boolean // 斜体
  Underline?: boolean // 下划线
}

// SubtitleEffect 字幕特效（描边/阴影/背景框）
export interface SubtitleEffect {
  Type: "Outline" | "Shadow" | "Box"
  Bord?: number // 描边/阴影宽度，>1为像素，0-1为相对文字大小
  XShift?: number // 左右偏移量（阴影用）
  YShift?: number // 上下偏移量（阴影用）
  Color?: string // 颜色，如 #ffffff
  Opacity?: string // 不透明度，0=全透明，1=不透明
  Blur?: number // 高斯模糊（阴影用，可实现外发光）
  Radius?: number // 圆角半径（背景框用）
}

// ========================================
// 音频轨
// ========================================

export interface AudioTrack {
  AudioTrackClips: AudioTrackClip[]
}

export interface AudioTrackClip {
  // 前端内部ID（用于Konva渲染识别，不提交给阿里云）
  Id?: string

  // 素材来源
  MediaURL: string

  // 素材裁剪
  In?: number // 素材裁剪开始时间（秒），0=从头开始
  Out?: number // 素材裁剪结束时间（秒）

  // 时间线位置
  TimelineIn?: number // 时间线入点（秒），0=从头开始
  TimelineOut?: number // 时间线出点（秒）

  // 音频控制
  LoopMode?: boolean // 是否循环
  Effects?: Effect[] // 效果列表（含音量控制）
}

// ========================================
// 特效
// ========================================

// Effect 素材效果
export interface Effect {
  Type: "Volume" | string
  Gain?: number // 音量增益 (Type=Volume 时用)，0=静音，1=原始，0-10
}

// ========================================
// 模板自定义数据（动态元素配置）
// ========================================

// 动态文字类型
export const DynamicTextType = {
  SUBTITLE: "subtitle", // 字幕，内容来自 TTS 返回的字幕
  TITLE: "title", // 标题，内容来自文案库的 title 字段
  TOPIC: "topic", // 话题，内容来自文案库的 topic 字段
  CUSTOM: "custom" // 自定义，内容来自 CustomText 字段
} as const

export type DynamicTextTypeValue = (typeof DynamicTextType)[keyof typeof DynamicTextType]

// 动态文字配置
export interface DynamicText {
  clip_id: string // 对应的 clip ID
  type: DynamicTextTypeValue // 类型: subtitle/title/topic/custom
  custom_texts?: string[] // 自定义文字列表（type=custom 时使用，随机选择）
}

// 模板自定义数据
export interface TemplateCustomData {
  dynamic_texts?: DynamicText[] // 动态文字列表
}

// ========================================
// 工具类型
// ========================================

// 所有可视元素的联合类型（用于画布渲染）
export type VisualClip = VideoTrackClip | SubtitleTrackClip

// 所有素材的联合类型
export type AnyClip = VideoTrackClip | SubtitleTrackClip | AudioTrackClip

// ========================================
// 工具函数
// ========================================

// 生成唯一ID
export function generateClipId(type: "video" | "image" | "text" | "audio"): string {
  return `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// 计算模板总时长
export function getTotalDuration(content: TemplateContent): number {
  let maxEndTime = 0

  content.VideoTracks?.forEach((track) => {
    track.VideoTrackClips.forEach((clip) => {
      if (clip.TimelineOut !== undefined && clip.TimelineOut > maxEndTime) {
        maxEndTime = clip.TimelineOut
      }
    })
  })

  content.SubtitleTracks?.forEach((track) => {
    track.SubtitleTrackClips.forEach((clip) => {
      if (clip.TimelineOut !== undefined && clip.TimelineOut > maxEndTime) {
        maxEndTime = clip.TimelineOut
      }
    })
  })

  content.AudioTracks?.forEach((track) => {
    track.AudioTrackClips.forEach((clip) => {
      if (clip.TimelineOut !== undefined && clip.TimelineOut > maxEndTime) {
        maxEndTime = clip.TimelineOut
      }
    })
  })

  return maxEndTime
}

// 移除内部ID，准备提交给阿里云
export function removeInternalIds(content: TemplateContent): TemplateContent {
  const cleanContent: TemplateContent = {}

  // 保留画布设置
  if (content.FECanvas) {
    cleanContent.FECanvas = content.FECanvas
  }
  if (content.AspectRatio) {
    cleanContent.AspectRatio = content.AspectRatio
  }

  // 清理轨道中的内部ID
  if (content.VideoTracks) {
    cleanContent.VideoTracks = content.VideoTracks.map(track => ({
      VideoTrackClips: track.VideoTrackClips.map(({ Id, ...clip }) => clip)
    }))
  }

  if (content.SubtitleTracks) {
    cleanContent.SubtitleTracks = content.SubtitleTracks.map(track => ({
      SubtitleTrackClips: track.SubtitleTrackClips.map(({ Id, ...clip }) => clip)
    }))
  }

  if (content.AudioTracks) {
    cleanContent.AudioTracks = content.AudioTracks.map(track => ({
      AudioTrackClips: track.AudioTrackClips.map(({ Id, ...clip }) => clip)
    }))
  }

  return cleanContent
}

// 创建默认的视频/图片素材（不设置 TimelineIn/TimelineOut，默认一直显示）
export function createVideoClip(type: "Video" | "Image", mediaURL: string, mediaId?: string): VideoTrackClip {
  const clip: VideoTrackClip = {
    Id: generateClipId(type === "Video" ? "video" : "image"),
    Type: type,
    MediaURL: mediaURL,
    X: 0,
    Y: 0,
    Opacity: 1
  }
  // 如果有 mediaId，添加到 clip 中（阿里云 OSS 时用于保存）
  if (mediaId) {
    clip.MediaId = mediaId
  }
  return clip
}

// 创建默认的字幕素材（不设置 TimelineIn/TimelineOut，默认一直显示）
export function createSubtitleClip(content: string = "双击编辑文本"): SubtitleTrackClip {
  return {
    Id: generateClipId("text"),
    Type: "Text",
    Content: content,
    X: 180,
    Y: 150,
    Font: "Arial",
    FontSize: 24,
    FontColor: "#1f2937",
    FontColorOpacity: 1,
    Alignment: "Center"
  }
}

// 创建默认的音频素材
export function createAudioClip(mediaURL: string): AudioTrackClip {
  return {
    Id: generateClipId("audio"),
    MediaURL: mediaURL,
    TimelineIn: 0,
    Effects: [{ Type: "Volume", Gain: 1 }]
  }
}
