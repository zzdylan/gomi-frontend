import type * as XunClip from "./type"
import { request } from "@/http/axios"

/** 获取讯剪工程详情 */
export function getXunProjectDetailApi(id: number | string) {
  return request<XunClip.GetXunProjectDetailResponseData>({
    url: `xun-projects/${id}`,
    method: "get"
  })
}

/** 创建讯剪工程 */
export function createXunProjectApi(data: XunClip.SaveXunProjectRequestData) {
  return request<XunClip.CreateXunProjectResponseData>({
    url: "xun-projects",
    method: "post",
    data
  })
}

/** 更新讯剪工程 */
export function updateXunProjectApi(id: number | string, data: XunClip.SaveXunProjectRequestData) {
  return request<XunClip.UpdateXunProjectResponseData>({
    url: `xun-projects/${id}`,
    method: "put",
    data
  })
}

/** 获取讯剪工程列表 */
export function getXunProjectListApi(params?: {
  page?: number
  per_page?: number
}) {
  return request<XunClip.GetXunProjectListResponseData>({
    url: "xun-projects",
    method: "get",
    params
  })
}

/** 删除讯剪工程 */
export function deleteXunProjectApi(id: number | string) {
  return request<XunClip.DeleteXunProjectResponseData>({
    url: `xun-projects/${id}`,
    method: "delete"
  })
}

/** 批量删除讯剪工程 */
export function batchDeleteXunProjectApi(data: XunClip.BatchDeleteXunProjectRequestData) {
  return request<XunClip.BatchDeleteXunProjectResponseData>({
    url: "xun-projects/batch-delete",
    method: "post",
    data
  })
}

/** 创建讯剪任务 */
export function createXunTaskApi(data: XunClip.CreateXunTaskRequestData) {
  return request<XunClip.CreateXunTaskResponseData>({
    url: "xun-tasks",
    method: "post",
    data
  })
}
