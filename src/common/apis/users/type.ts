export interface UserInfo {
  id: string
  username: string
  name?: string
  email?: string
  phone?: string
  avatar?: string
  roles?: string[]
  last_login?: number
  last_login_ip?: string
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

/** 批量删除用户请求数据 */
export interface BatchDeleteUserRequestData {
  /** ID列表 */
  ids: string[]
}

/** 批量删除用户响应数据 */
export type BatchDeleteUserResponseData = ApiResponseData<null>

/** 用户套餐信息 */
export interface UserPackageInfo {
  id: number
  aid: number
  user_id: number
  package_id: number
  package_name: string
  order_id: number
  is_main: boolean
  start_at: string
  expire_at: string
  status: number // 1=正常 2=已过期 3=已取消
  created_at: string
  updated_at: string
}

/** 权益类型信息 */
export interface BenefitInfo {
  id: number
  aid: number
  product_id: number
  name: string
  code: string
  unit_name: string
  status: number
}

/** 用户权益信息 */
export interface UserBenefitInfo {
  id: number
  aid: number
  user_id: number
  product_id: number
  order_id: number
  package_id: number
  benefit_id: number
  total_amount: number
  used_amount: number
  expire_at: string
  created_at: string
  updated_at: string
  benefit: BenefitInfo
}

/** 用户权益汇总信息 */
export interface UserBenefitSummary {
  benefit_id: number
  benefit_name: string
  unit_name: string
  total_left: number
}

/** 获取用户套餐列表响应数据 */
export type GetUserPackagesResponseData = ApiResponseData<{
  items: UserPackageInfo[]
}>

/** 获取用户权益列表响应数据 */
export type GetUserBenefitsResponseData = ApiResponseData<{
  items: UserBenefitInfo[]
}>

/** 获取当前用户权益汇总响应数据 */
export type GetMyBenefitsResponseData = ApiResponseData<{
  items: UserBenefitSummary[]
}>

/** 开通套餐请求数据 */
export interface GrantPackageRequestData {
  package_id: number
}

/** 开通套餐响应数据 */
export type GrantPackageResponseData = ApiResponseData<{
  user_package: UserPackageInfo
  user_benefits: UserBenefitInfo[]
}>

/** 一键登录响应数据 */
export type ImpersonateUserResponseData = ApiResponseData<{
  token: string
  user: UserInfo
  username: string
}>

/** 更新个人信息请求数据 */
export interface UpdateProfileRequestData {
  name?: string
  email?: string
  phone?: string
  avatar?: string
}

/** 修改密码请求数据 */
export interface UpdatePasswordRequestData {
  old_password: string
  new_password: string
}
