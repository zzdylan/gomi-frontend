import type { UploadCredential } from "@/pages/material/apis"

/**
 * 生成唯一文件名
 */
function generateFileName(file: File): string {
  const ext = file.name.split(".").pop() || ""
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${timestamp}_${random}.${ext}`
}

/**
 * 上传单个文件到 OSS（V4 签名）
 */
export function uploadToOSS(
  file: File,
  credential: UploadCredential,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const formData = new FormData()

    const fileName = generateFileName(file)
    const key = credential.dir + fileName

    // V4 签名字段顺序
    formData.append("key", key)
    formData.append("policy", credential.policy)
    formData.append("x-oss-signature-version", credential.x_oss_signature_version)
    formData.append("x-oss-credential", credential.x_oss_credential)
    formData.append("x-oss-date", credential.x_oss_date)
    formData.append("x-oss-signature", credential.signature)
    formData.append("callback", credential.callback)
    formData.append("file", file)

    const xhr = new XMLHttpRequest()

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve()
      } else {
        reject(new Error(`上传失败: ${xhr.status}`))
      }
    }

    xhr.onerror = () => reject(new Error("网络错误"))

    xhr.open("POST", credential.host, true)
    xhr.send(formData)
  })
}
