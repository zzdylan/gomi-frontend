// ============ 服务配置模型 ============

export interface ServiceConfig {
  id: number
  tenant_id: number
  type: string
  driver: string
  config: string
  remark: string
  created_at: string
  updated_at: string
}

// ============ Storage 配置 JSON 结构 ============

/** 本地存储配置 */
export interface LocalConfigJSON {
  root: string // 存储根目录
  url: string // 访问URL前缀
}

/** MinIO配置 */
export interface MinioConfigJSON {
  access_key: string // 访问密钥
  secret_key: string // 密钥
  region: string // 区域
  bucket: string // 存储桶
  url: string // 访问URL
  endpoint: string // 端点
  ssl: boolean // 是否使用SSL
}

/** 阿里云OSS配置 */
export interface AliyunOssConfigJSON {
  access_key_id: string // AccessKey ID
  access_key_secret: string // AccessKey Secret
  bucket: string // 存储桶
  url: string // 访问URL
  endpoint: string // 端点
}

// ============ ICE 配置 JSON 结构 ============

/** 阿里云ICE配置 */
export interface AliyunIceConfigJSON {
  access_key_id: string // AccessKey ID
  access_key_secret: string // AccessKey Secret
  endpoint: string // 端点 (如 ice.cn-shanghai.aliyuncs.com)
  callback_url: string // 回调地址
  callback_secret: string // 回调签名密钥
}

// ============ TTS 配置 JSON 结构 ============

/** 火山引擎TTS配置 */
export interface VolcengineTtsConfigJSON {
  app_id: string // 应用ID
  token: string // Access Token
  cluster: string // 集群 (如 volcano_tts)
}

/** 微软TTS配置 */
export interface MicrosoftTtsConfigJSON {
  region: string // 区域 (如 eastasia)
  api_key: string // API密钥
}

// ============ 驱动配置联合类型 ============

export type StorageConfigJSON
  = | LocalConfigJSON
    | MinioConfigJSON
    | AliyunOssConfigJSON
export type IceConfigJSON = AliyunIceConfigJSON
export type TtsConfigJSON = VolcengineTtsConfigJSON | MicrosoftTtsConfigJSON

// ============ API 请求响应类型 ============

export interface GetServiceConfigResponseData {
  code: number
  message: string
  data: {
    config: ServiceConfig | null
  }
}

export interface SaveServiceConfigRequestData {
  driver: string
  config: string
  remark?: string
}

export interface SaveServiceConfigResponseData {
  code: number
  message: string
  data: {
    config: ServiceConfig
  }
}
