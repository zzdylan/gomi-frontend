/** 作品类型 */
export type CompositionType = "video" | "image_text"

/** 来源类型 */
export type CompositionSourceType = "xunclip" | "imagetext"

/** 作品集文件夹数据项 */
export interface CompositionFolderItem {
  id: number
  user_id: number
  parent_id: number
  name: string
  created_at: string
  updated_at: string
}

/** 作品数据项 */
export interface CompositionItem {
  id: number
  user_id: number
  folder_id: number
  name: string
  type: CompositionType

  // 视频文件
  video_path: string
  video_media_id?: string
  video_url: string
  cover_url: string

  // 视频属性
  duration: number
  width: number
  height: number
  file_size: number
  bitrate: number
  fps?: string

  // 图文属性
  title?: string
  content?: string
  images?: string

  // 来源追溯
  source_type: CompositionSourceType
  source_id: number
  word_id: number
  word_text?: string

  created_at: string
  updated_at: string
}

/** 创建文件夹请求数据 */
export interface CreateCompositionFolderRequestData {
  name: string
  parent_id: number
}

/** 更新文件夹请求数据 */
export interface UpdateCompositionFolderRequestData {
  name: string
  parent_id?: number
}

/** 批量删除文件夹请求数据 */
export interface BatchDeleteCompositionFolderRequestData {
  ids: number[]
}

/** 批量删除作品请求数据 */
export interface BatchDeleteCompositionRequestData {
  ids: number[]
}

/** 移动作品请求数据 */
export interface MoveCompositionRequestData {
  ids: number[]
  folder_id: number
}

/** 文件夹列表响应数据 */
export type GetCompositionFolderListResponseData = ApiResponseData<{
  folders: CompositionFolderItem[]
}>

/** 创建文件夹响应数据 */
export type CreateCompositionFolderResponseData = ApiResponseData<CompositionFolderItem>

/** 更新文件夹响应数据 */
export type UpdateCompositionFolderResponseData = ApiResponseData<CompositionFolderItem>

/** 删除文件夹响应数据 */
export type DeleteCompositionFolderResponseData = ApiResponseData<null>

/** 批量删除文件夹响应数据 */
export type BatchDeleteCompositionFolderResponseData = ApiResponseData<{
  deleted_count: number
}>

/** 作品列表响应数据 */
export type GetCompositionListResponseData = ApiResponseData<{
  compositions: CompositionItem[]
  paging: {
    current_page: number
    per_page: number
    total_count: number
    total_page: number
    next_page_url: string
    prev_page_url: string
  }
}>

/** 删除作品响应数据 */
export type DeleteCompositionResponseData = ApiResponseData<null>

/** 批量删除作品响应数据 */
export type BatchDeleteCompositionResponseData = ApiResponseData<{
  deleted_count: number
}>

/** 移动作品响应数据 */
export type MoveCompositionResponseData = ApiResponseData<{
  moved_count: number
}>
