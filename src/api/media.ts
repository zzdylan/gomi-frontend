import { request } from "@/http/axios"

/** 批量获取 media_id 对应的 URL */
export function batchMediaURLsApi(mediaIds: string[]) {
  return request<ApiResponseData<{ urls: Record<string, string> }>>({
    url: "media/batch-urls",
    method: "post",
    data: { media_ids: mediaIds }
  })
}

/**
 * 判断是否为 media_id（非 URL 格式）
 * media_id 不以 http 开头，且非空
 */
export function isMediaId(value: string): boolean {
  return !!value && !value.startsWith("http")
}

/**
 * 批量解析 media_id 为 URL
 * 传入 media_id 数组，返回 media_id -> URL 的映射
 * 如果没有需要解析的 media_id，返回空对象
 */
export async function resolveMediaIds(mediaIds: string[]): Promise<Record<string, string>> {
  const uniqueIds = [...new Set(mediaIds.filter(isMediaId))]
  if (uniqueIds.length === 0) return {}

  const { data } = await batchMediaURLsApi(uniqueIds)
  return data.urls
}
