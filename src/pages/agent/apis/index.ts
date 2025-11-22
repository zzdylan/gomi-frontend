import type * as Agent from "./type"
import { request } from "@/http/axios"

/** 获取代理商列表 */
export function getAgentListApi(params?: {
  page?: number
  per_page?: number
  type?: number
  status?: number
  parent_id?: string
  company_name?: string
  phone?: string
  contact_name?: string
}) {
  return request<Agent.GetAgentListResponseData>({
    url: "agents",
    method: "get",
    params
  })
}

/** 获取代理商详情 */
export function getAgentDetailApi(id: string) {
  return request<Agent.GetAgentDetailResponseData>({
    url: `agents/${id}`,
    method: "get"
  })
}

/** 创建代理商 */
export function createAgentApi(data: Agent.CreateAgentRequestData) {
  return request<Agent.CreateAgentResponseData>({
    url: "agents",
    method: "post",
    data
  })
}

/** 更新代理商 */
export function updateAgentApi(id: string, data: Agent.UpdateAgentRequestData) {
  return request<Agent.UpdateAgentResponseData>({
    url: `agents/${id}`,
    method: "put",
    data
  })
}

/** 删除代理商 */
export function deleteAgentApi(id: string) {
  return request<Agent.DeleteAgentResponseData>({
    url: `agents/${id}`,
    method: "delete"
  })
}

/** 批量删除代理商 */
export function batchDeleteAgentApi(data: Agent.BatchDeleteAgentRequestData) {
  return request<Agent.BatchDeleteAgentResponseData>({
    url: "agents/batch-delete",
    method: "post",
    data
  })
}

/** 获取下级代理列表 */
export function getSubAgentsApi(id: string) {
  return request<Agent.GetSubAgentsResponseData>({
    url: `agents/${id}/sub-agents`,
    method: "get"
  })
}

/** 代理商充值 */
export function rechargeAgentApi(data: Agent.RechargeRequestData) {
  return request<Agent.RechargeResponseData>({
    url: "agents/recharge",
    method: "post",
    data
  })
}

/** 代理商扣款 */
export function deductAgentApi(data: Agent.RechargeRequestData) {
  return request<Agent.DeductResponseData>({
    url: "agents/deduct",
    method: "post",
    data
  })
}

/** 获取余额日志 */
export function getBalanceLogsApi(id: string, params?: {
  page?: number
  per_page?: number
}) {
  return request<Agent.GetBalanceLogsResponseData>({
    url: `agents/${id}/balance-logs`,
    method: "get",
    params
  })
}

/** 获取统计信息 */
export function getStatisticsApi() {
  return request<Agent.GetStatisticsResponseData>({
    url: "agents/statistics",
    method: "get"
  })
}

/** 更新代理商状态 */
export function updateAgentStatusApi(id: string, data: Agent.UpdateStatusRequestData) {
  return request<Agent.UpdateStatusResponseData>({
    url: `agents/${id}/status`,
    method: "put",
    data
  })
}
