/** 素材类型 */
export type MaterialType = "image" | "video"

/** 素材状态 */
export type MaterialStatus = 0 | 1 // 0=pending 1=ready

/** 素材文件夹数据项 */
export interface MaterialFolderItem {
  id: number
  user_id: number
  parent_id: number
  name: string
  created_at: string
  updated_at: string
}

/** 素材数据项 */
export interface MaterialItem {
  id: number
  user_id: number
  folder_id: number
  original_name: string
  stored_name: string
  path: string
  url: string
  size: number
  mime_type: string
  extension: string
  type: MaterialType
  status: MaterialStatus
  width?: number
  height?: number
  duration?: number
  bitrate?: string
  media_id?: string // 阿里云 OSS 媒资 ID
  created_at: string
  updated_at: string
}

/** 创建文件夹请求数据 */
export interface CreateMaterialFolderRequestData {
  name: string
  parent_id: number
}

/** 更新文件夹请求数据 */
export interface UpdateMaterialFolderRequestData {
  name: string
  parent_id?: number
}

/** 批量删除文件夹请求数据 */
export interface BatchDeleteMaterialFolderRequestData {
  ids: number[]
}

/** 批量删除素材请求数据 */
export interface BatchDeleteMaterialRequestData {
  ids: number[]
}

/** 移动素材请求数据 */
export interface MoveMaterialRequestData {
  ids: number[]
  folder_id: number
}

/** 文件夹列表响应数据 */
export type GetMaterialFolderListResponseData = ApiResponseData<{
  folders: MaterialFolderItem[]
}>

/** 创建文件夹响应数据 */
export type CreateMaterialFolderResponseData = ApiResponseData<MaterialFolderItem>

/** 更新文件夹响应数据 */
export type UpdateMaterialFolderResponseData = ApiResponseData<MaterialFolderItem>

/** 删除文件夹响应数据 */
export type DeleteMaterialFolderResponseData = ApiResponseData<null>

/** 批量删除文件夹响应数据 */
export type BatchDeleteMaterialFolderResponseData = ApiResponseData<{
  deleted_count: number
}>

/** 素材列表响应数据 */
export type GetMaterialListResponseData = ApiResponseData<{
  materials: MaterialItem[]
  paging: {
    current_page: number
    per_page: number
    total_count: number
    total_page: number
    next_page_url: string
    prev_page_url: string
  }
}>

/** 上传素材响应数据 */
export type UploadMaterialResponseData = ApiResponseData<MaterialItem>

/** 批量上传素材响应数据 */
export interface BatchUploadResult {
  original_name: string
  status: "success" | "failed"
  error?: string
  material?: MaterialItem
}

export type BatchUploadMaterialResponseData = ApiResponseData<{
  message: string
  total: number
  success_count: number
  failed_count: number
  results: BatchUploadResult[]
}>

/** 删除素材响应数据 */
export type DeleteMaterialResponseData = ApiResponseData<null>

/** 批量删除素材响应数据 */
export type BatchDeleteMaterialResponseData = ApiResponseData<{
  deleted_count: number
}>

/** 移动素材响应数据 */
export type MoveMaterialResponseData = ApiResponseData<{
  moved_count: number
}>
