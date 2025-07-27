import type * as Users from "./type"
import { request } from "@/http/axios"

/** 获取当前登录用户详情 */
export function getCurrentUserApi() {
  return request<Users.CurrentUserResponseData>({
    url: "users/me",
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
