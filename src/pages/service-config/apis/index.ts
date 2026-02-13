import type * as ServiceConfig from "./type"
import { request } from "@/http/axios"

/** 获取指定类型的服务配置 */
export function getServiceConfigApi(type: string) {
  return request<ServiceConfig.GetServiceConfigResponseData>({
    url: `service-configs/${type}`,
    method: "get"
  })
}

/** 保存指定类型的服务配置 */
export function saveServiceConfigApi(type: string, data: ServiceConfig.SaveServiceConfigRequestData) {
  return request<ServiceConfig.SaveServiceConfigResponseData>({
    url: `service-configs/${type}`,
    method: "put",
    data
  })
}
