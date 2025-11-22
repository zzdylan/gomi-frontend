import type * as Package from "./type"
import { request } from "@/http/axios"

/** 获取套餐列表 */
export function getPackageListApi(params?: {
  page?: number
  per_page?: number
  status?: number
  is_main?: boolean
  name?: string
}) {
  return request<Package.GetPackageListResponseData>({
    url: "packages",
    method: "get",
    params
  })
}

/** 获取套餐详情 */
export function getPackageDetailApi(id: string) {
  return request<Package.GetPackageDetailResponseData>({
    url: `packages/${id}`,
    method: "get"
  })
}

/** 获取所有启用的套餐 */
export function getAllPackagesApi() {
  return request<Package.GetAllPackagesResponseData>({
    url: "packages/all",
    method: "get"
  })
}

/** 创建套餐 */
export function createPackageApi(data: Package.CreatePackageRequestData) {
  return request<Package.CreatePackageResponseData>({
    url: "packages",
    method: "post",
    data
  })
}

/** 更新套餐 */
export function updatePackageApi(id: string, data: Package.UpdatePackageRequestData) {
  return request<Package.UpdatePackageResponseData>({
    url: `packages/${id}`,
    method: "put",
    data
  })
}

/** 删除套餐 */
export function deletePackageApi(id: string) {
  return request<Package.DeletePackageResponseData>({
    url: `packages/${id}`,
    method: "delete"
  })
}

/** 批量删除套餐 */
export function batchDeletePackageApi(data: Package.BatchDeletePackageRequestData) {
  return request<Package.BatchDeletePackageResponseData>({
    url: "packages/batch-delete",
    method: "post",
    data
  })
}
