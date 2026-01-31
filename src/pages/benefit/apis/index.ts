import type * as Benefit from "./type"
import { request } from "@/http/axios"

/** 获取权益列表 */
export function getBenefitListApi(params?: {
  page?: number
  per_page?: number
  product_id?: number
  status?: number
  name?: string
}) {
  return request<Benefit.GetBenefitListResponseData>({
    url: "benefits",
    method: "get",
    params
  })
}

/** 获取权益详情 */
export function getBenefitDetailApi(id: string) {
  return request<Benefit.GetBenefitDetailResponseData>({
    url: `benefits/${id}`,
    method: "get"
  })
}

/** 获取所有启用的权益 */
export function getAllBenefitsApi() {
  return request<Benefit.GetAllBenefitsResponseData>({
    url: "benefits/all",
    method: "get"
  })
}

/** 创建权益 */
export function createBenefitApi(data: Benefit.CreateBenefitRequestData) {
  return request<Benefit.CreateBenefitResponseData>({
    url: "benefits",
    method: "post",
    data
  })
}

/** 更新权益 */
export function updateBenefitApi(id: string, data: Benefit.UpdateBenefitRequestData) {
  return request<Benefit.UpdateBenefitResponseData>({
    url: `benefits/${id}`,
    method: "put",
    data
  })
}

/** 删除权益 */
export function deleteBenefitApi(id: string) {
  return request<Benefit.DeleteBenefitResponseData>({
    url: `benefits/${id}`,
    method: "delete"
  })
}

/** 批量删除权益 */
export function batchDeleteBenefitApi(data: Benefit.BatchDeleteBenefitRequestData) {
  return request<Benefit.BatchDeleteBenefitResponseData>({
    url: "benefits/batch-delete",
    method: "post",
    data
  })
}
