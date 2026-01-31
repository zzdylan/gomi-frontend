export interface BenefitInfo {
  id: string
  product_id: number
  name: string
  code: string
  unit_name: string
  status: number // 0=停用 1=启用
  created_at?: string
  updated_at?: string
}

/** 创建权益请求数据 */
export interface CreateBenefitRequestData {
  product_id: number
  name: string
  code: string
  unit_name: string
  status: number
}

/** 更新权益请求数据 */
export interface UpdateBenefitRequestData {
  name?: string
  code?: string
  unit_name?: string
  status?: number
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

/** 权益列表响应数据 */
export type GetBenefitListResponseData = ApiResponseData<{
  items: BenefitInfo[]
  pager: PagingInfo
}>

/** 权益详情响应数据 */
export type GetBenefitDetailResponseData = ApiResponseData<BenefitInfo>

/** 所有启用权益响应数据 */
export type GetAllBenefitsResponseData = ApiResponseData<{
  items: BenefitInfo[]
}>

/** 创建权益响应数据 */
export type CreateBenefitResponseData = ApiResponseData<BenefitInfo>

/** 更新权益响应数据 */
export type UpdateBenefitResponseData = ApiResponseData<null>

/** 删除权益响应数据 */
export type DeleteBenefitResponseData = ApiResponseData<null>

/** 批量删除权益请求数据 */
export interface BatchDeleteBenefitRequestData {
  ids: string[]
}

/** 批量删除权益响应数据 */
export type BatchDeleteBenefitResponseData = ApiResponseData<{
  deleted_count: number
}>
