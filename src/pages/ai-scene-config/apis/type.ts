import type { AiProviderInfo } from "@/pages/ai-provider/apis/type"

/** AI场景配置信息 */
export interface AiSceneConfigInfo {
  id: number
  tenant_id: number
  scene: string
  scene_name: string
  provider_id: number
  model: string
  params: string
  status: number
  remark: string
  created_at: string
  updated_at: string
  provider: AiProviderInfo
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

/** 获取场景配置列表响应 */
export type GetAiSceneConfigListResponseData = ApiResponseData<{
  items: AiSceneConfigInfo[]
  pager: PagingInfo
}>

/** 获取所有场景配置响应 */
export type GetAllAiSceneConfigsResponseData = ApiResponseData<{
  items: AiSceneConfigInfo[]
}>

/** 获取场景配置详情响应 */
export type GetAiSceneConfigDetailResponseData = ApiResponseData<AiSceneConfigInfo>

/** 创建场景配置请求 */
export interface CreateAiSceneConfigRequestData {
  scene: string
  scene_name: string
  provider_id: number
  model: string
  params?: string
  status?: number
  remark?: string
}

/** 创建场景配置响应 */
export type CreateAiSceneConfigResponseData = ApiResponseData<AiSceneConfigInfo>

/** 更新场景配置请求 */
export interface UpdateAiSceneConfigRequestData {
  scene?: string
  scene_name?: string
  provider_id?: number
  model?: string
  params?: string
  status?: number
  remark?: string
}

/** 更新场景配置响应 */
export type UpdateAiSceneConfigResponseData = ApiResponseData<null>

/** 删除场景配置响应 */
export type DeleteAiSceneConfigResponseData = ApiResponseData<null>
