import type * as Users from "./type"
import { request } from "@/http/axios"

/** 获取当前登录用户详情 */
export function getCurrentUserApi() {
  return request<Users.CurrentUserResponseData>({
    url: "user",
    method: "get"
  })
}

/** 获取当前用户权益汇总 */
export function getMyBenefitsApi() {
  return request<Users.GetMyBenefitsResponseData>({
    url: "user/benefits",
    method: "get"
  })
}

/** 获取用户列表 */
export function getUserListApi(params?: {
  page?: number
  per_page?: number
  username?: string
  name?: string
  email?: string
}) {
  return request<Users.GetUserListResponseData>({
    url: "users",
    method: "get",
    params
  })
}

/** 获取用户详情 */
export function getUserDetailApi(id: string) {
  return request<Users.GetUserDetailResponseData>({
    url: `users/${id}`,
    method: "get"
  })
}

/** 创建用户 */
export function createUserApi(data: Users.CreateUserRequestData) {
  return request<Users.CreateUserResponseData>({
    url: "users",
    method: "post",
    data
  })
}

/** 更新用户 */
export function updateUserApi(id: string, data: Users.UpdateUserRequestData) {
  return request<Users.UpdateUserResponseData>({
    url: `users/${id}`,
    method: "put",
    data
  })
}

/** 删除用户 */
export function deleteUserApi(id: string) {
  return request<Users.DeleteUserResponseData>({
    url: `users/${id}`,
    method: "delete"
  })
}

/** 批量删除用户 */
export function batchDeleteUserApi(data: Users.BatchDeleteUserRequestData) {
  return request<Users.BatchDeleteUserResponseData>({
    url: "users/batch-delete",
    method: "post",
    data
  })
}

/** 获取用户套餐列表 */
export function getUserPackagesApi(userId: string) {
  return request<Users.GetUserPackagesResponseData>({
    url: `users/${userId}/packages`,
    method: "get"
  })
}

/** 获取用户权益列表 */
export function getUserBenefitsApi(userId: string) {
  return request<Users.GetUserBenefitsResponseData>({
    url: `users/${userId}/benefits`,
    method: "get"
  })
}

/** 给用户开通套餐 */
export function grantUserPackageApi(userId: string, data: Users.GrantPackageRequestData) {
  return request<Users.GrantPackageResponseData>({
    url: `users/${userId}/packages`,
    method: "post",
    data
  })
}

/** 删除用户套餐 */
export function deleteUserPackageApi(userId: string, packageId: number) {
  return request<ApiResponseData<null>>({
    url: `users/${userId}/packages/${packageId}`,
    method: "delete"
  })
}

/** 一键登录（以目标用户身份登录） */
export function impersonateUserApi(userId: string) {
  return request<Users.ImpersonateUserResponseData>({
    url: `users/${userId}/impersonate`,
    method: "post"
  })
}

/** 更新个人信息 */
export function updateProfileApi(data: Users.UpdateProfileRequestData) {
  return request<Users.CurrentUserResponseData>({
    url: "user/profile",
    method: "put",
    data
  })
}

/** 修改密码 */
export function updatePasswordApi(data: Users.UpdatePasswordRequestData) {
  return request<ApiResponseData<null>>({
    url: "user/password",
    method: "put",
    data
  })
}
