/** 模板文件夹数据项 */
export interface TemplateFolderItem {
  id: number
  user_id: number
  parent_id: number
  name: string
  created_at: string
  updated_at: string
}

/** 模板数据项 */
export interface TemplateItem {
  id: number
  user_id: number
  folder_id: number
  name: string
  thumbnail: string
  content: string // 画布尺寸在 content.FECanvas 中
  created_at: string
  updated_at: string
}

/** 创建文件夹请求数据 */
export interface CreateTemplateFolderRequestData {
  name: string
  parent_id: number
}

/** 更新文件夹请求数据 */
export interface UpdateTemplateFolderRequestData {
  name: string
  parent_id?: number
}

/** 批量删除文件夹请求数据 */
export interface BatchDeleteTemplateFolderRequestData {
  ids: number[]
}

/** 创建模板请求数据 */
export interface CreateTemplateRequestData {
  folder_id: number
  name: string
  thumbnail?: string
  content: string // 画布尺寸在 content.FECanvas 中
}

/** 更新模板请求数据 */
export interface UpdateTemplateRequestData {
  name: string
  thumbnail?: string
  content?: string // 画布尺寸在 content.FECanvas 中
}

/** 批量删除模板请求数据 */
export interface BatchDeleteTemplateRequestData {
  ids: number[]
}

/** 移动模板请求数据 */
export interface MoveTemplateRequestData {
  ids: number[]
  folder_id: number
}

/** 文件夹列表响应数据 */
export type GetTemplateFolderListResponseData = ApiResponseData<{
  folders: TemplateFolderItem[]
}>

/** 创建文件夹响应数据 */
export type CreateTemplateFolderResponseData = ApiResponseData<TemplateFolderItem>

/** 更新文件夹响应数据 */
export type UpdateTemplateFolderResponseData = ApiResponseData<TemplateFolderItem>

/** 删除文件夹响应数据 */
export type DeleteTemplateFolderResponseData = ApiResponseData<null>

/** 批量删除文件夹响应数据 */
export type BatchDeleteTemplateFolderResponseData = ApiResponseData<{
  deleted_count: number
}>

/** 模板列表响应数据 */
export type GetTemplateListResponseData = ApiResponseData<{
  templates: TemplateItem[]
  paging: {
    current_page: number
    per_page: number
    total_count: number
    total_page: number
    next_page_url: string
    prev_page_url: string
  }
}>

/** 创建模板响应数据 */
export type CreateTemplateResponseData = ApiResponseData<TemplateItem>

/** 获取模板详情响应数据 */
export type GetTemplateDetailResponseData = ApiResponseData<TemplateItem>

/** 更新模板响应数据 */
export type UpdateTemplateResponseData = ApiResponseData<TemplateItem>

/** 删除模板响应数据 */
export type DeleteTemplateResponseData = ApiResponseData<null>

/** 批量删除模板响应数据 */
export type BatchDeleteTemplateResponseData = ApiResponseData<{
  deleted_count: number
}>

/** 移动模板响应数据 */
export type MoveTemplateResponseData = ApiResponseData<{
  moved_count: number
}>
