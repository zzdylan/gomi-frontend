/** 文案库配置 */
export interface CopyLibraryConfig {
  /** 地区列表 */
  areas?: string[]
  /** 关键词列表 */
  keywords?: string[]
  /** 后缀列表 */
  suffixes?: string[]
  /** 变量1 */
  variable1?: string[]
  /** 变量2 */
  variable2?: string[]
  /** 变量3 */
  variable3?: string[]
  /** 是否显示在作品名称 */
  showInWorkName?: boolean
}

/** 文案库数据项 */
export interface CopyLibraryItem {
  /** ID */
  id: number
  /** 用户ID */
  user_id: number
  /** 文案库名称 */
  name: string
  /** 类型：1=组合文案 2=智能文案 3=爆款解说 */
  type: number
  /** 配置内容JSON */
  content: string
  /** 状态：0=未开始 1=生成中 2=已完成 3=失败 */
  status: number
  /** 是否爆款：0=否 1=是 */
  is_hot: number
  /** 失败原因 */
  msg?: string
  /** 创建时间 */
  created_at: string
  /** 更新时间 */
  updated_at: string
}

/** 批量创建文案请求数据 */
export interface BatchCreateCopyLibraryRequestData {
  /** 文案库ID（更新模式时传入） */
  id?: number
  /** 文案库名称 */
  name: string
  /** 配置信息 */
  config: CopyLibraryConfig
  /** 标题列表 */
  titles: string[]
  /** 描述列表 */
  descriptions?: string[]
  /** 话题列表 */
  topics?: string[]
  /** 话题标签数量 */
  topic_tag_count?: number
}

/** 分页信息 */
export interface PagingInfo {
  /** 当前页 */
  current_page: number
  /** 每页条数 */
  per_page: number
  /** 总页数 */
  total_page: number
  /** 总条数 */
  total_count: number
  /** 下一页链接 */
  next_page_url: string
  /** 上一页链接 */
  prev_page_url: string
}

/** 文案库列表响应数据 */
export type GetCopyLibraryListResponseData = ApiResponseData<{
  items: CopyLibraryItem[]
  pager: PagingInfo
}>

/** 文案库详情响应数据 */
export type GetCopyLibraryDetailResponseData = ApiResponseData<CopyLibraryItem>

/** 批量创建文案响应数据 */
export type BatchCreateCopyLibraryResponseData = ApiResponseData<{
  library: CopyLibraryItem
  words_count: number
  message: string
}>

/** 删除文案库响应数据 */
export type DeleteCopyLibraryResponseData = ApiResponseData<null>

/** 批量删除文案库请求数据 */
export interface BatchDeleteCopyLibraryRequestData {
  /** ID列表 */
  ids: number[]
}

/** 批量删除文案库响应数据 */
export type BatchDeleteCopyLibraryResponseData = ApiResponseData<{
  deleted_count: number
}>

/** 文案词条数据项 */
export interface CopyWordItem {
  /** ID */
  id: number
  /** 用户ID */
  user_id: number
  /** 文案库ID */
  copy_id: number
  /** 长尾词 */
  long_tail_word: string
  /** 主关键词 */
  keyword: string
  /** 结构 */
  structure: string
  /** 地区 */
  area: string
  /** 标题 */
  title: string
  /** 话题（JSON字符串） */
  topics: string
  /** 文案描述 */
  text: string
  /** 敏感词 */
  sensitive: string
  /** 是否使用 */
  use_text: number
  /** 状态 */
  status: number
  /** 创建时间 */
  created_at: string
  /** 更新时间 */
  updated_at: string
}

/** 文案词条列表响应数据 */
export type GetCopyWordListResponseData = ApiResponseData<{
  items: CopyWordItem[]
  pager: PagingInfo
}>

/** 智能文案生成请求数据 */
export interface GenerateSmartCopyLibraryRequestData {
  /** 文案库ID（更新模式时传入） */
  id?: number
  /** 文案库名称 */
  name: string
  /** 配置信息（智能文案） */
  config: {
    areas?: string[]
    prefixes?: string[]
    keywords: string[]
    suffixes?: string[]
    max_limit?: number
    desc_word_count?: string
  }
}

/** 智能文案生成响应数据 */
export type GenerateSmartCopyLibraryResponseData = ApiResponseData<{
  library: CopyLibraryItem
  message: string
}>

/** 批量删除文案词条请求数据 */
export interface BatchDeleteCopyWordRequestData {
  /** ID列表 */
  ids: number[]
}

/** 批量删除文案词条响应数据 */
export type BatchDeleteCopyWordResponseData = ApiResponseData<{
  deleted_count: number
}>

/** 批量审核文案词条请求数据 */
export interface BatchApproveCopyWordRequestData {
  /** ID列表 */
  ids: number[]
}

/** 批量审核文案词条响应数据 */
export type BatchApproveCopyWordResponseData = ApiResponseData<{
  approved_count: number
}>
