/** 权限结构 */
export interface Permission {
  /** 资源路径 */
  resource: string
  /** HTTP方法 */
  action: string
}

/** 角色信息 */
export interface RoleInfo {
  id: string
  name: string
  slug: string
  description?: string
  permissions?: Permission[]
  created_at?: string
  updated_at?: string
}

/** 创建角色请求数据 */
export interface CreateRoleRequestData {
  name: string
  slug: string
  description?: string
  permissions?: Permission[]
}

/** 更新角色请求数据 */
export interface UpdateRoleRequestData {
  name?: string
  slug?: string
  description?: string
  permissions?: Permission[]
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

/** 角色列表响应数据 */
export type GetRoleListResponseData = ApiResponseData<{
  items: RoleInfo[]
  pager: PagingInfo
}>

/** 角色详情响应数据 */
export type GetRoleDetailResponseData = ApiResponseData<RoleInfo>

/** 创建角色响应数据 */
export type CreateRoleResponseData = ApiResponseData<RoleInfo>

/** 更新角色响应数据 */
export type UpdateRoleResponseData = ApiResponseData<RoleInfo>

/** 删除角色响应数据 */
export type DeleteRoleResponseData = ApiResponseData<null>

/** 批量删除角色请求数据 */
export interface BatchDeleteRoleRequestData {
  /** ID列表 */
  ids: string[]
}

/** 批量删除角色响应数据 */
export type BatchDeleteRoleResponseData = ApiResponseData<{
  deleted_count: number
}>
