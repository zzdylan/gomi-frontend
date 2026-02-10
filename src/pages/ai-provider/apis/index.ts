import type * as AiProvider from "./type"
import { request } from "@/http/axios"

/** 获取AI厂商列表 */
export function getAiProviderListApi(params?: {
  page?: number
  per_page?: number
  status?: number
  name?: string
}) {
  return request<AiProvider.GetAiProviderListResponseData>({
    url: "ai-providers",
    method: "get",
    params
  })
}

/** 获取所有AI厂商 */
export function getAllAiProvidersApi() {
  return request<AiProvider.GetAllAiProvidersResponseData>({
    url: "ai-providers/all",
    method: "get"
  })
}

/** 获取AI厂商详情 */
export function getAiProviderDetailApi(id: string) {
  return request<AiProvider.GetAiProviderDetailResponseData>({
    url: `ai-providers/${id}`,
    method: "get"
  })
}

/** 创建AI厂商 */
export function createAiProviderApi(data: AiProvider.CreateAiProviderRequestData) {
  return request<AiProvider.CreateAiProviderResponseData>({
    url: "ai-providers",
    method: "post",
    data
  })
}

/** 更新AI厂商 */
export function updateAiProviderApi(id: string, data: AiProvider.UpdateAiProviderRequestData) {
  return request<AiProvider.UpdateAiProviderResponseData>({
    url: `ai-providers/${id}`,
    method: "put",
    data
  })
}

/** 删除AI厂商 */
export function deleteAiProviderApi(id: string) {
  return request<AiProvider.DeleteAiProviderResponseData>({
    url: `ai-providers/${id}`,
    method: "delete"
  })
}
