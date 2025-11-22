export interface AgentInfo {
  id: string
  type: number // 1=总代理 2=普通代理 3=下级代理
  parent_id: string
  company_name: string
  contact_name: string
  contact_phone: string
  contact_email?: string
  address?: string
  balance: number // 余额(分)
  status: number // 0=待审核 1=已通过 2=已拒绝 3=已封禁
  remark?: string
  created_at?: string
  updated_at?: string
}

export interface AgentBalanceLog {
  id: string
  agent_id: string
  type: number // 1=平台充值 2=平台扣款 3=代理充值 4=代理扣款 5=开通套餐 6=退款
  amount: number
  before_balance: number
  after_balance: number
  relation_type: string
  relation_id: string
  order_no?: string
  remark?: string
  created_at?: string
}

/** 创建代理商请求数据 */
export interface CreateAgentRequestData {
  type: number
  parent_id?: string
  company_name: string
  contact_name: string
  contact_phone: string
  contact_email?: string
  address?: string
  balance?: number
  status?: number
  remark?: string
}

/** 更新代理商请求数据 */
export interface UpdateAgentRequestData {
  type?: number
  parent_id?: string
  company_name?: string
  contact_name?: string
  contact_phone?: string
  contact_email?: string
  address?: string
  status?: number
  remark?: string
}

/** 充值/扣款请求数据 */
export interface RechargeRequestData {
  agent_id: string
  amount: number
  remark?: string
}

/** 更新状态请求数据 */
export interface UpdateStatusRequestData {
  status: number
}

/** 分页信息 */
export interface PagingInfo {
  current_page: number
  per_page: number
  total_page: number
  total_count: number
  next_page_url: string
  prev_page_url: string
}

/** 代理商列表响应数据 */
export type GetAgentListResponseData = ApiResponseData<{
  items: AgentInfo[]
  pager: PagingInfo
}>

/** 代理商详情响应数据 */
export type GetAgentDetailResponseData = ApiResponseData<{
  agent: AgentInfo
  parent_agent?: AgentInfo
}>

/** 下级代理列表响应数据 */
export type GetSubAgentsResponseData = ApiResponseData<{
  items: AgentInfo[]
  total: number
}>

/** 余额日志列表响应数据 */
export type GetBalanceLogsResponseData = ApiResponseData<{
  items: AgentBalanceLog[]
  pager: PagingInfo
}>

/** 统计信息响应数据 */
export type GetStatisticsResponseData = ApiResponseData<{
  status_count: Record<number, number>
  type_count: Record<number, number>
  total_balance: number
  today_count: number
}>

/** 创建代理商响应数据 */
export type CreateAgentResponseData = ApiResponseData<AgentInfo>

/** 更新代理商响应数据 */
export type UpdateAgentResponseData = ApiResponseData<null>

/** 删除代理商响应数据 */
export type DeleteAgentResponseData = ApiResponseData<null>

/** 批量删除代理商请求数据 */
export interface BatchDeleteAgentRequestData {
  ids: string[]
}

/** 批量删除代理商响应数据 */
export type BatchDeleteAgentResponseData = ApiResponseData<{
  deleted_count: number
}>

/** 充值响应数据 */
export type RechargeResponseData = ApiResponseData<null>

/** 扣款响应数据 */
export type DeductResponseData = ApiResponseData<null>

/** 更新状态响应数据 */
export type UpdateStatusResponseData = ApiResponseData<null>
