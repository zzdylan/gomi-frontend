import type * as Material from "./type"
import { request } from "@/http/axios"

// ==================== 直传凭证 API ====================

/** 直传凭证响应 - V4 签名版本 */
export interface UploadCredential {
  host: string // OSS 上传地址
  dir: string // 上传目录
  expire_at: number // 过期时间戳
  policy: string // 策略（Base64）
  signature: string // 签名
  x_oss_signature_version: string // 签名版本: OSS4-HMAC-SHA256
  x_oss_credential: string // 凭证
  x_oss_date: string // 日期
  callback: string // 回调配置（Base64）
}

/** 获取直传凭证 */
export function getUploadCredentialApi(params: {
  directory?: string
  folder_id?: number
}) {
  return request<ApiResponseData<UploadCredential>>({
    url: "upload/credential",
    method: "get",
    params
  })
}

// ==================== 素材文件夹 API ====================

/** 获取文件夹列表 */
export function getMaterialFolderListApi(params?: {
  parent_id?: number
}) {
  return request<Material.GetMaterialFolderListResponseData>({
    url: "material-folders",
    method: "get",
    params
  })
}

/** 创建文件夹 */
export function createMaterialFolderApi(data: Material.CreateMaterialFolderRequestData) {
  return request<Material.CreateMaterialFolderResponseData>({
    url: "material-folders",
    method: "post",
    data
  })
}

/** 更新文件夹 */
export function updateMaterialFolderApi(id: number | string, data: Material.UpdateMaterialFolderRequestData) {
  return request<Material.UpdateMaterialFolderResponseData>({
    url: `material-folders/${id}`,
    method: "put",
    data
  })
}

/** 删除文件夹 */
export function deleteMaterialFolderApi(id: number | string) {
  return request<Material.DeleteMaterialFolderResponseData>({
    url: `material-folders/${id}`,
    method: "delete"
  })
}

/** 批量删除文件夹 */
export function batchDeleteMaterialFolderApi(data: Material.BatchDeleteMaterialFolderRequestData) {
  return request<Material.BatchDeleteMaterialFolderResponseData>({
    url: "material-folders/batch-delete",
    method: "post",
    data
  })
}

// ==================== 素材 API ====================

/** 获取素材列表 */
export function getMaterialListApi(params?: {
  folder_id?: number
  type?: Material.MaterialType
  page?: number
  per_page?: number
}) {
  return request<Material.GetMaterialListResponseData>({
    url: "materials",
    method: "get",
    params
  })
}

/** 上传单个素材 */
export function uploadMaterialApi(data: FormData, onUploadProgress?: (progressEvent: any) => void) {
  return request<Material.UploadMaterialResponseData>({
    url: "materials/upload",
    method: "post",
    data,
    headers: {
      "Content-Type": "multipart/form-data"
    },
    timeout: 300000, // 5分钟超时，适配大文件上传
    onUploadProgress
  })
}

/** 批量上传素材 */
export function batchUploadMaterialApi(data: FormData, onUploadProgress?: (progressEvent: any) => void) {
  return request<Material.BatchUploadMaterialResponseData>({
    url: "materials/multi-upload",
    method: "post",
    data,
    headers: {
      "Content-Type": "multipart/form-data"
    },
    timeout: 600000, // 10分钟超时，批量上传需要更长时间
    onUploadProgress
  })
}

/** 删除素材 */
export function deleteMaterialApi(id: number | string) {
  return request<Material.DeleteMaterialResponseData>({
    url: `materials/${id}`,
    method: "delete"
  })
}

/** 批量删除素材 */
export function batchDeleteMaterialApi(data: Material.BatchDeleteMaterialRequestData) {
  return request<Material.BatchDeleteMaterialResponseData>({
    url: "materials/batch-delete",
    method: "post",
    data
  })
}

/** 移动素材 */
export function moveMaterialApi(data: Material.MoveMaterialRequestData) {
  return request<Material.MoveMaterialResponseData>({
    url: "materials/move",
    method: "post",
    data
  })
}
