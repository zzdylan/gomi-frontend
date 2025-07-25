import type * as Demo from "./type"
import { request } from "@/http/axios"

/** 获取 Demo 列表 */
export function getDemoListApi(params?: {
  page?: number
  per_page?: number
  sort?: string
  order?: string
}) {
  return request<Demo.GetDemoListResponseData>({
    url: "demos",
    method: "get",
    params
  })
}

/** 获取 Demo 详情 */
export function getDemoDetailApi(id: number | string) {
  return request<Demo.GetDemoDetailResponseData>({
    url: `demos/${id}`,
    method: "get"
  })
}

/** 创建 Demo */
export function createDemoApi(data: Demo.CreateDemoRequestData) {
  return request<Demo.CreateDemoResponseData>({
    url: "demos",
    method: "post",
    data
  })
}

/** 更新 Demo */
export function updateDemoApi(id: number | string, data: Demo.UpdateDemoRequestData) {
  return request<Demo.UpdateDemoResponseData>({
    url: `demos/${id}`,
    method: "put",
    data
  })
}

/** 删除 Demo */
export function deleteDemoApi(id: number | string) {
  return request<Demo.DeleteDemoResponseData>({
    url: `demos/${id}`,
    method: "delete"
  })
}