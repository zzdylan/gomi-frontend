import type * as CopyLibrary from "./type"
import { request } from "@/http/axios"

/** 获取文案库列表 */
export function getCopyLibraryListApi(params?: {
  page?: number
  per_page?: number
}) {
  return request<CopyLibrary.GetCopyLibraryListResponseData>({
    url: "copy-libraries",
    method: "get",
    params
  })
}

/** 获取文案库详情 */
export function getCopyLibraryDetailApi(id: number | string) {
  return request<CopyLibrary.GetCopyLibraryDetailResponseData>({
    url: `copy-libraries/${id}`,
    method: "get"
  })
}

/** 批量创建文案 */
export function batchCreateCopyLibraryApi(data: CopyLibrary.BatchCreateCopyLibraryRequestData) {
  return request<CopyLibrary.BatchCreateCopyLibraryResponseData>({
    url: "copy-libraries/batch-create",
    method: "post",
    data
  })
}

/** 删除文案库 */
export function deleteCopyLibraryApi(id: number | string) {
  return request<CopyLibrary.DeleteCopyLibraryResponseData>({
    url: `copy-libraries/${id}`,
    method: "delete"
  })
}

/** 批量删除文案库 */
export function batchDeleteCopyLibraryApi(data: CopyLibrary.BatchDeleteCopyLibraryRequestData) {
  return request<CopyLibrary.BatchDeleteCopyLibraryResponseData>({
    url: "copy-libraries/batch-delete",
    method: "post",
    data
  })
}

/** 获取文案词条列表 */
export function getCopyWordListApi(params?: {
  page?: number
  per_page?: number
  copy_id?: number | string
}) {
  return request<CopyLibrary.GetCopyWordListResponseData>({
    url: "copy-words",
    method: "get",
    params
  })
}

/** 智能文案生成 */
export function generateSmartCopyLibraryApi(data: CopyLibrary.GenerateSmartCopyLibraryRequestData) {
  return request<CopyLibrary.GenerateSmartCopyLibraryResponseData>({
    url: "copy-libraries/generate-smart",
    method: "post",
    data
  })
}

/** 批量删除文案词条 */
export function batchDeleteCopyWordApi(data: CopyLibrary.BatchDeleteCopyWordRequestData) {
  return request<CopyLibrary.BatchDeleteCopyWordResponseData>({
    url: "copy-words/batch-delete",
    method: "post",
    data
  })
}

/** 批量审核文案词条 */
export function batchApproveCopyWordApi(data: CopyLibrary.BatchApproveCopyWordRequestData) {
  return request<CopyLibrary.BatchApproveCopyWordResponseData>({
    url: "copy-words/batch-approve",
    method: "post",
    data
  })
}
