export interface PackageBenefitItem {
  benefit_id: string
  benefit_name: string
  benefit_code: string
  unit_name: string
  amount: number
}

export interface PackageInfo {
  id: string
  name: string
  code: string
  description?: string
  price: number // 价格(分)
  is_main: boolean // 是否主套餐
  duration: number // 有效期(天)
  status: number // 0=停用 1=启用
  benefits?: PackageBenefitItem[] // 套餐包含的权益列表
  created_at?: string
  updated_at?: string
}

/** 套餐权益配置项 */
export interface PackageBenefitConfig {
  benefit_id: string
  amount: number
}

/** 创建套餐请求数据 */
export interface CreatePackageRequestData {
  name: string
  code: string
  description?: string
  price: number
  is_main: boolean
  duration: number
  status: number
  benefits?: PackageBenefitConfig[]
}

/** 更新套餐请求数据 */
export interface UpdatePackageRequestData {
  name?: string
  code?: string
  description?: string
  price?: number
  is_main?: boolean
  duration?: number
  status?: number
  benefits?: PackageBenefitConfig[]
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

/** 套餐列表响应数据 */
export type GetPackageListResponseData = ApiResponseData<{
  items: PackageInfo[]
  pager: PagingInfo
}>

/** 套餐详情响应数据 */
export type GetPackageDetailResponseData = ApiResponseData<PackageInfo>

/** 所有启用套餐响应数据 */
export type GetAllPackagesResponseData = ApiResponseData<{
  items: PackageInfo[]
}>

/** 创建套餐响应数据 */
export type CreatePackageResponseData = ApiResponseData<PackageInfo>

/** 更新套餐响应数据 */
export type UpdatePackageResponseData = ApiResponseData<null>

/** 删除套餐响应数据 */
export type DeletePackageResponseData = ApiResponseData<null>

/** 批量删除套餐请求数据 */
export interface BatchDeletePackageRequestData {
  ids: string[]
}

/** 批量删除套餐响应数据 */
export type BatchDeletePackageResponseData = ApiResponseData<{
  deleted_count: number
}>
