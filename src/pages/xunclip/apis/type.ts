/** 场景类型 */
export const SceneType = {
  Opening: 1,
  Main: 2,
  Ending: 3
} as const
export type SceneTypeValue = (typeof SceneType)[keyof typeof SceneType]

/** 场景类型标签 */
export const SceneTypeLabel: Record<SceneTypeValue, string> = {
  [SceneType.Opening]: "片头",
  [SceneType.Main]: "正片",
  [SceneType.Ending]: "片尾"
}

/** 时长模式 */
export type DurationMode = "follow_material" | "follow_audio" | "custom"

/** 画面比例 */
export type AspectRatio = "16:9" | "9:16" | "1:1"

/** 素材类型（前端展示用，不提交到后端） */
export type MaterialMediaType = "image" | "video"

/** 素材信息 */
export interface MaterialInfo {
  id: number
  /** 临时访问URL（不持久化，加载时实时获取） */
  url?: string
  /** 封面URL（不持久化，加载时实时获取） */
  cover_url?: string
  duration: number
  width: number
  height: number
  /** 前端展示用，区分图片/视频缩略图渲染方式 */
  media_type?: MaterialMediaType
}

/** 配音设置 */
export interface VoiceSettings {
  speakers: string[]
  speed_ratio: number
  volume_ratio: number
  pitch_ratio: number
}

/** 文案设置 */
export interface CopySettings {
  copy_id: number | undefined
  show_subtitle: boolean
}

/** 背景设置 */
export interface BackgroundSettings {
  musics: string[]
  music_volume: number
  enable_blur: boolean
}

/** 全局设置 */
export interface GlobalSettings {
  mode: DurationMode
  allow_repeat: boolean
  template_ids: number[]
  copy: CopySettings
  voice: VoiceSettings
  background: BackgroundSettings
}

/** 局部设置（配音/模板/背景音乐始终使用全局设置） */
export interface LocalSettings {
  mode: DurationMode
  copy_id: number | undefined
  duration: number
}

/** 场景配置 */
export interface SceneConfig {
  type: SceneTypeValue
  materials: MaterialInfo[]
  local_settings: LocalSettings | null
}

/** 工程配置 */
export interface Config {
  scenes: SceneConfig[]
  settings: GlobalSettings
  global: boolean
}

/** 讯剪工程数据项 */
export interface XunProjectItem {
  id: number
  user_id: number
  title: string
  content: string
  aspect: AspectRatio
  created_at: string
  updated_at: string
}

/** 保存讯剪工程请求 */
export interface SaveXunProjectRequestData {
  title: string
  content: string
  aspect: AspectRatio
}

/** 创建讯剪任务请求 */
export interface CreateXunTaskRequestData {
  project_id: number
  result_limit: number
}

/** 创建工程响应 */
export type CreateXunProjectResponseData = ApiResponseData<XunProjectItem>

/** 更新工程响应 */
export type UpdateXunProjectResponseData = ApiResponseData<XunProjectItem>

/** 工程详情响应 */
export type GetXunProjectDetailResponseData = ApiResponseData<XunProjectItem>

/** 分页信息 */
export interface PagingInfo {
  current_page: number
  per_page: number
  total_page: number
  total_count: number
  next_page_url: string
  prev_page_url: string
}

/** 工程列表响应 */
export type GetXunProjectListResponseData = ApiResponseData<{
  items: XunProjectItem[]
  paging: PagingInfo
}>

/** 删除工程响应 */
export type DeleteXunProjectResponseData = ApiResponseData<null>

/** 批量删除请求 */
export interface BatchDeleteXunProjectRequestData {
  ids: number[]
}

/** 批量删除响应 */
export type BatchDeleteXunProjectResponseData = ApiResponseData<{
  deleted_count: number
}>

/** 创建任务响应 */
export type CreateXunTaskResponseData = ApiResponseData<{
  task_id: number
  result_limit: number
}>
