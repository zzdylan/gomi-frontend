export interface UserInfo {
  id: string
  username: string
  name?: string
  email?: string
  phone?: string
  avatar?: string
  roles?: string[]
  created_at?: string
  updated_at?: string
}

/** 创建用户请求数据 */
export interface CreateUserRequestData {
  username: string
  name?: string
  email?: string
  phone?: string
  password: string
  roles?: string[]
}

/** 更新用户请求数据 */
export interface UpdateUserRequestData {
  username?: string
  name?: string
  email?: string
  phone?: string
  password?: string
  roles?: string[]
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

/** 用户列表响应数据 */
export type GetUserListResponseData = ApiResponseData<{
  items: UserInfo[]
  pager: PagingInfo
}>

/** 用户详情响应数据 */
export type GetUserDetailResponseData = ApiResponseData<UserInfo>

/** 创建用户响应数据 */
export type CreateUserResponseData = ApiResponseData<null>

/** 更新用户响应数据 */
export type UpdateUserResponseData = ApiResponseData<null>

/** 删除用户响应数据 */
export type DeleteUserResponseData = ApiResponseData<null>

export type CurrentUserResponseData = ApiResponseData<UserInfo>
