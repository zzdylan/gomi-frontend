import { request } from "@/http/axios"

export interface UploadData {
  url: string
  path: string
  mime_type?: string
  extension?: string
  size: number
  media_id?: string // 阿里云 OSS 时返回
}

export interface UploadResponseData {
  code: number
  data: UploadData
  message?: string
}

/**
 * 通用文件上传
 * @param file 文件对象
 * @param directory 存储目录，默认为 "uploads"
 */
export function uploadFileApi(file: File, directory = "uploads") {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("directory", directory)

  return request<UploadResponseData>({
    url: "upload",
    method: "post",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data"
    },
    timeout: 300000 // 5分钟超时
  })
}

/**
 * 上传 Blob 数据
 * @param blob Blob 对象
 * @param filename 文件名
 * @param directory 存储目录
 */
export function uploadBlobApi(blob: Blob, filename: string, directory = "uploads") {
  const file = new File([blob], filename, { type: blob.type })
  return uploadFileApi(file, directory)
}
