/** Demo 数据项 */
export interface DemoItem {
  /** ID */
  id: number
  /** 名称 */
  name: string
  /** 用户ID */
  user_id: number
  /** 创建时间 */
  created_at: string
  /** 更新时间 */
  updated_at: string
}

/** 创建 Demo 请求数据 */
export interface CreateDemoRequestData {
  /** 名称 */
  name: string
}

/** 更新 Demo 请求数据 */
export interface UpdateDemoRequestData {
  /** 名称 */
  name: string
}

/** 分页信息 */
export interface PagingInfo {
  /** 当前页 */
  current_page: number
  /** 每页条数 */
  per_page: number
  /** 总页数 */
  total_page: number
  /** 总条数 */
  total_count: number
  /** 下一页链接 */
  next_page_url: string
  /** 上一页链接 */
  prev_page_url: string
}

/** Demo 列表响应数据 */
export type GetDemoListResponseData = ApiResponseData<{
  items: DemoItem[]
  pager: PagingInfo
}>

/** Demo 详情响应数据 */
export type GetDemoDetailResponseData = ApiResponseData<DemoItem>

/** 创建 Demo 响应数据 */
export type CreateDemoResponseData = ApiResponseData<DemoItem>

/** 更新 Demo 响应数据 */
export type UpdateDemoResponseData = ApiResponseData<DemoItem>

/** 删除 Demo 响应数据 */
export type DeleteDemoResponseData = ApiResponseData<null>

/** 批量删除 Demo 请求数据 */
export interface BatchDeleteDemoRequestData {
  /** ID列表 */
  ids: number[]
}

/** 批量删除 Demo 响应数据 */
export type BatchDeleteDemoResponseData = ApiResponseData<null>
