import type * as AiSceneConfig from "./type"
import { request } from "@/http/axios"

/** 获取AI场景配置列表 */
export function getAiSceneConfigListApi(params?: {
  page?: number
  per_page?: number
  status?: number
  scene?: string
}) {
  return request<AiSceneConfig.GetAiSceneConfigListResponseData>({
    url: "ai-scene-configs",
    method: "get",
    params
  })
}

/** 获取所有AI场景配置 */
export function getAllAiSceneConfigsApi() {
  return request<AiSceneConfig.GetAllAiSceneConfigsResponseData>({
    url: "ai-scene-configs/all",
    method: "get"
  })
}

/** 获取AI场景配置详情 */
export function getAiSceneConfigDetailApi(id: string) {
  return request<AiSceneConfig.GetAiSceneConfigDetailResponseData>({
    url: `ai-scene-configs/${id}`,
    method: "get"
  })
}

/** 创建AI场景配置 */
export function createAiSceneConfigApi(data: AiSceneConfig.CreateAiSceneConfigRequestData) {
  return request<AiSceneConfig.CreateAiSceneConfigResponseData>({
    url: "ai-scene-configs",
    method: "post",
    data
  })
}

/** 更新AI场景配置 */
export function updateAiSceneConfigApi(id: string, data: AiSceneConfig.UpdateAiSceneConfigRequestData) {
  return request<AiSceneConfig.UpdateAiSceneConfigResponseData>({
    url: `ai-scene-configs/${id}`,
    method: "put",
    data
  })
}

/** 删除AI场景配置 */
export function deleteAiSceneConfigApi(id: string) {
  return request<AiSceneConfig.DeleteAiSceneConfigResponseData>({
    url: `ai-scene-configs/${id}`,
    method: "delete"
  })
}
