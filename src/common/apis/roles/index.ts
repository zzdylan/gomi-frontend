import type * as Roles from "./type"
import { request } from "@/http/axios"

/** 获取角色列表 */
export function getRoleListApi(params?: {
  page?: number
  per_page?: number
  name?: string
  slug?: string
  status?: number
}) {
  return request<Roles.GetRoleListResponseData>({
    url: "roles",
    method: "get",
    params
  })
}

/** 获取角色详情 */
export function getRoleDetailApi(id: string) {
  return request<Roles.GetRoleDetailResponseData>({
    url: `roles/${id}`,
    method: "get"
  })
}

/** 创建角色 */
export function createRoleApi(data: Roles.CreateRoleRequestData) {
  return request<Roles.CreateRoleResponseData>({
    url: "roles",
    method: "post",
    data
  })
}

/** 更新角色 */
export function updateRoleApi(id: string, data: Roles.UpdateRoleRequestData) {
  return request<Roles.UpdateRoleResponseData>({
    url: `roles/${id}`,
    method: "put",
    data
  })
}

/** 删除角色 */
export function deleteRoleApi(id: string) {
  return request<Roles.DeleteRoleResponseData>({
    url: `roles/${id}`,
    method: "delete"
  })
}

/** 批量删除角色 */
export function batchDeleteRoleApi(data: Roles.BatchDeleteRoleRequestData) {
  return request<Roles.BatchDeleteRoleResponseData>({
    url: "roles/batch-delete",
    method: "post",
    data
  })
}
