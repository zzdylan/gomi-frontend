import type * as Composition from "./type"
import { request } from "@/http/axios"

// ==================== 作品集文件夹 API ====================

/** 获取文件夹列表 */
export function getCompositionFolderListApi(params?: {
  parent_id?: number
}) {
  return request<Composition.GetCompositionFolderListResponseData>({
    url: "composition-folders",
    method: "get",
    params
  })
}

/** 创建文件夹 */
export function createCompositionFolderApi(data: Composition.CreateCompositionFolderRequestData) {
  return request<Composition.CreateCompositionFolderResponseData>({
    url: "composition-folders",
    method: "post",
    data
  })
}

/** 更新文件夹 */
export function updateCompositionFolderApi(id: number | string, data: Composition.UpdateCompositionFolderRequestData) {
  return request<Composition.UpdateCompositionFolderResponseData>({
    url: `composition-folders/${id}`,
    method: "put",
    data
  })
}

/** 删除文件夹 */
export function deleteCompositionFolderApi(id: number | string) {
  return request<Composition.DeleteCompositionFolderResponseData>({
    url: `composition-folders/${id}`,
    method: "delete"
  })
}

/** 批量删除文件夹 */
export function batchDeleteCompositionFolderApi(data: Composition.BatchDeleteCompositionFolderRequestData) {
  return request<Composition.BatchDeleteCompositionFolderResponseData>({
    url: "composition-folders/batch-delete",
    method: "post",
    data
  })
}

// ==================== 作品集 API ====================

/** 获取作品列表 */
export function getCompositionListApi(params?: {
  folder_id?: number
  type?: Composition.CompositionType
  source_type?: Composition.CompositionSourceType
  name?: string
  page?: number
  per_page?: number
}) {
  return request<Composition.GetCompositionListResponseData>({
    url: "compositions",
    method: "get",
    params
  })
}

/** 获取作品详情 */
export function getCompositionApi(id: number | string) {
  return request<ApiResponseData<Composition.CompositionItem>>({
    url: `compositions/${id}`,
    method: "get"
  })
}

/** 删除作品 */
export function deleteCompositionApi(id: number | string) {
  return request<Composition.DeleteCompositionResponseData>({
    url: `compositions/${id}`,
    method: "delete"
  })
}

/** 批量删除作品 */
export function batchDeleteCompositionApi(data: Composition.BatchDeleteCompositionRequestData) {
  return request<Composition.BatchDeleteCompositionResponseData>({
    url: "compositions/batch-delete",
    method: "post",
    data
  })
}

/** 移动作品 */
export function moveCompositionApi(data: Composition.MoveCompositionRequestData) {
  return request<Composition.MoveCompositionResponseData>({
    url: "compositions/move",
    method: "post",
    data
  })
}
