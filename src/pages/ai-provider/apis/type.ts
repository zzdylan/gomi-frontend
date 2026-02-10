/** AI厂商信息 */
export interface AiProviderInfo {
  id: number
  tenant_id: number
  provider: string
  name: string
  host: string
  api_key: string
  status: number
  remark: string
  created_at: string
  updated_at: string
}

/** 分页信息 */
export interface PagingInfo {
  current_page: number
  per_page: number
  total_page: number
  total_count: number
  next_page_url: string
  prev_page_url: string
}

/** 获取厂商列表响应 */
export type GetAiProviderListResponseData = ApiResponseData<{
  items: AiProviderInfo[]
  pager: PagingInfo
}>

/** 获取所有厂商响应 */
export type GetAllAiProvidersResponseData = ApiResponseData<{
  items: AiProviderInfo[]
}>

/** 获取厂商详情响应 */
export type GetAiProviderDetailResponseData = ApiResponseData<AiProviderInfo>

/** 创建厂商请求 */
export interface CreateAiProviderRequestData {
  provider: string
  name: string
  host: string
  api_key: string
  status?: number
  remark?: string
}

/** 创建厂商响应 */
export type CreateAiProviderResponseData = ApiResponseData<AiProviderInfo>

/** 更新厂商请求 */
export interface UpdateAiProviderRequestData {
  provider?: string
  name?: string
  host?: string
  api_key?: string
  status?: number
  remark?: string
}

/** 更新厂商响应 */
export type UpdateAiProviderResponseData = ApiResponseData<null>

/** 删除厂商响应 */
export type DeleteAiProviderResponseData = ApiResponseData<null>
