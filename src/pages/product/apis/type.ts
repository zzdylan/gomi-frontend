export interface ProductInfo {
  id: string
  name: string
  code: string
  description: string
  sort: number
  status: number // 0=停用 1=启用
  created_at?: string
  updated_at?: string
}

/** 创建产品请求数据 */
export interface CreateProductRequestData {
  name: string
  code: string
  description?: string
  sort?: number
  status: number
}

/** 更新产品请求数据 */
export interface UpdateProductRequestData {
  name?: string
  code?: string
  description?: string
  sort?: number
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

/** 产品列表响应数据 */
export type GetProductListResponseData = ApiResponseData<{
  items: ProductInfo[]
  pager: PagingInfo
}>

/** 产品详情响应数据 */
export type GetProductDetailResponseData = ApiResponseData<ProductInfo>

/** 所有启用产品响应数据 */
export type GetAllProductsResponseData = ApiResponseData<{
  items: ProductInfo[]
}>

/** 创建产品响应数据 */
export type CreateProductResponseData = ApiResponseData<ProductInfo>

/** 更新产品响应数据 */
export type UpdateProductResponseData = ApiResponseData<null>

/** 删除产品响应数据 */
export type DeleteProductResponseData = ApiResponseData<null>

/** 批量删除产品请求数据 */
export interface BatchDeleteProductRequestData {
  ids: string[]
}

/** 批量删除产品响应数据 */
export type BatchDeleteProductResponseData = ApiResponseData<{
  deleted_count: number
}>
