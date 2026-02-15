<script setup lang="ts">
import type { UploadFile, UploadFiles, UploadInstance } from "element-plus"
import type { UploadCredential } from "@/pages/material/apis"
import { Check, Close, Loading, Picture, UploadFilled } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { uploadToOSS } from "@/common/utils/ossUpload"
import { getUploadCredentialApi } from "@/pages/material/apis"

const props = defineProps<{
  folderId: number
}>()

const emit = defineEmits<{
  success: []
}>()

const uploadRef = useTemplateRef<UploadInstance>("uploadRef")
const visible = defineModel<boolean>("visible", { required: true })
const uploadFileList = ref<UploadFiles>([])
const isUploading = ref(false)
const deletedUids = ref<Set<number | string>>(new Set())

// 文件上传状态
interface FileUploadStatus {
  uid: number | string
  status: "pending" | "uploading" | "success" | "failed"
  progress: number
  message?: string
}

const fileStatusMap = ref<Map<number | string, FileUploadStatus>>(new Map())

function handleUploadChange(file: UploadFile, files: UploadFiles) {
  uploadFileList.value = files
    .filter(f => !deletedUids.value.has(f.uid))
    .map((f) => {
      if (!f.url && f.raw) {
        f.url = URL.createObjectURL(f.raw)
      }
      if (!fileStatusMap.value.has(f.uid)) {
        fileStatusMap.value.set(f.uid, {
          uid: f.uid,
          status: "pending",
          progress: 0
        })
      }
      return f
    })
}

function handleUploadRemove(file: UploadFile) {
  if (file.url && file.url.startsWith("blob:")) {
    URL.revokeObjectURL(file.url)
  }
  deletedUids.value.add(file.uid)
  uploadFileList.value = uploadFileList.value.filter(f => f.uid !== file.uid)
  fileStatusMap.value.delete(file.uid)
}

function getFileStatus(uid: number | string) {
  return fileStatusMap.value.get(uid)
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`
}

function isVideo(file: UploadFile): boolean {
  return file.raw?.type.startsWith("video/") || false
}

// 并发控制：限制同时上传的文件数
const MAX_CONCURRENT = 3

async function handleUploadSubmit() {
  if (uploadFileList.value.length === 0) {
    ElMessage.warning("请选择要上传的文件")
    return
  }

  isUploading.value = true

  let successCount = 0
  let failedCount = 0

  // 获取直传凭证
  let credential: UploadCredential
  try {
    const { data } = await getUploadCredentialApi({
      directory: "materials",
      folder_id: props.folderId
    })
    credential = data
  } catch (error: any) {
    ElMessage.error(`获取上传凭证失败: ${error.message || "未知错误"}`)
    isUploading.value = false
    return
  }

  // 单个文件上传任务
  const uploadTask = async (file: UploadFile) => {
    const status = fileStatusMap.value.get(file.uid)
    if (!status) return

    status.status = "uploading"
    status.progress = 0

    try {
      await uploadToOSS(file.raw as File, credential, (percent) => {
        status.progress = percent
      })
      status.status = "success"
      status.progress = 100
      successCount++
    } catch (error: any) {
      status.status = "failed"
      status.message = error.message || "上传失败"
      failedCount++
      console.error(`文件 ${file.name} 上传失败:`, error)
    }
  }

  // 并发上传（限制最大并发数）
  const files = [...uploadFileList.value]
  const executing: Promise<void>[] = []

  for (const file of files) {
    const promise = uploadTask(file).then(() => {
      executing.splice(executing.indexOf(promise), 1)
    })
    executing.push(promise)

    if (executing.length >= MAX_CONCURRENT) {
      await Promise.race(executing)
    }
  }
  await Promise.all(executing)

  isUploading.value = false

  if (failedCount === 0) {
    ElMessage.success(`全部上传成功！共 ${successCount} 个文件`)
    setTimeout(() => {
      visible.value = false
      cleanupUpload()
      emit("success")
    }, 1000)
  } else {
    ElMessage.warning(`上传完成：成功 ${successCount} 个，失败 ${failedCount} 个`)
  }
}

function cleanupUpload() {
  uploadFileList.value.forEach((f) => {
    if (f.url && f.url.startsWith("blob:")) {
      URL.revokeObjectURL(f.url)
    }
  })
  uploadFileList.value = []
  fileStatusMap.value.clear()
  deletedUids.value.clear()
  uploadRef.value?.clearFiles()
}

function handleClose() {
  visible.value = false
  cleanupUpload()
}
</script>

<template>
  <el-dialog v-model="visible" title="上传素材" width="700px" :close-on-click-modal="!isUploading" @close="cleanupUpload">
    <el-upload
      ref="uploadRef"
      :auto-upload="false"
      :show-file-list="false"
      :disabled="isUploading"
      accept="image/*,video/*"
      multiple
      drag
      @change="handleUploadChange"
    >
      <el-icon class="el-icon--upload">
        <UploadFilled />
      </el-icon>
      <div class="el-upload__text">
        将文件拖到此处，或<em>点击上传</em>
      </div>
      <template #tip>
        <div class="el-upload__tip">
          支持图片和视频文件，可多选
        </div>
      </template>
    </el-upload>

    <div v-if="uploadFileList.length > 0" class="upload-file-list">
      <div class="list-header">
        待上传文件 ({{ uploadFileList.length }})
      </div>
      <div class="file-grid">
        <div
          v-for="file in uploadFileList"
          :key="file.uid"
          class="file-card"
          :class="{
            'is-uploading': getFileStatus(file.uid)?.status === 'uploading',
            'is-success': getFileStatus(file.uid)?.status === 'success',
            'is-failed': getFileStatus(file.uid)?.status === 'failed',
          }"
        >
          <div class="file-preview">
            <video v-if="file.url && isVideo(file)" :src="file.url" preload="metadata" />
            <img v-else-if="file.url" :src="file.url" :alt="file.name">
            <div v-else class="file-icon">
              <el-icon><Picture /></el-icon>
            </div>

            <div v-if="getFileStatus(file.uid)?.status !== 'pending'" class="upload-mask">
              <el-icon v-if="getFileStatus(file.uid)?.status === 'success'" class="status-icon success">
                <Check />
              </el-icon>
              <el-icon v-else-if="getFileStatus(file.uid)?.status === 'failed'" class="status-icon failed">
                <Close />
              </el-icon>
              <el-icon v-else class="status-icon uploading">
                <Loading />
              </el-icon>
            </div>
          </div>

          <div class="file-info">
            <div class="file-name" :title="file.name">
              {{ file.name }}
            </div>
            <div class="file-size">
              {{ formatFileSize(file.size || 0) }}
            </div>
          </div>

          <div v-if="getFileStatus(file.uid)?.status === 'uploading'" class="file-progress">
            <el-progress
              :percentage="getFileStatus(file.uid)?.progress || 0"
              :show-text="false"
              :stroke-width="3"
            />
          </div>

          <el-button
            v-if="!isUploading && getFileStatus(file.uid)?.status !== 'success'"
            class="delete-btn"
            link
            type="danger"
            @click="handleUploadRemove(file)"
          >
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="footer-content">
        <div v-if="isUploading" class="upload-status">
          上传中，请稍候...
        </div>
        <div class="footer-buttons">
          <el-button @click="handleClose" :disabled="isUploading">
            {{ isUploading ? '上传中' : '取消' }}
          </el-button>
          <el-button type="primary" @click="handleUploadSubmit" :loading="isUploading" :disabled="uploadFileList.length === 0">
            {{ isUploading ? '上传中...' : `开始上传 (${uploadFileList.length})` }}
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.upload-file-list {
  margin-top: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;

  .list-header {
    padding: 10px 16px;
    background: #f5f7fa;
    font-size: 14px;
    font-weight: 500;
    color: #303133;
    border-bottom: 1px solid #e4e7ed;
  }

  .file-grid {
    max-height: 300px;
    overflow-y: auto;
    padding: 12px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }

  .file-card {
    position: relative;
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    overflow: hidden;
    transition: all 0.2s;

    &:hover {
      border-color: #409eff;
      box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
    }

    &.is-success {
      border-color: #67c23a;
    }

    &.is-failed {
      border-color: #f56c6c;
    }

    .file-preview {
      width: 100%;
      height: 100px;
      background: #f5f7fa;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;

      img,
      video {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .file-icon {
        font-size: 40px;
        color: #909399;
      }

      .upload-mask {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;

        .status-icon {
          font-size: 32px;
          color: #fff;

          &.uploading {
            animation: rotating 1s linear infinite;
          }

          &.success {
            color: #67c23a;
          }

          &.failed {
            color: #f56c6c;
          }
        }
      }
    }

    .file-info {
      padding: 8px;

      .file-name {
        font-size: 12px;
        color: #303133;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 4px;
      }

      .file-size {
        font-size: 11px;
        color: #909399;
      }
    }

    .file-progress {
      padding: 0 8px 8px;
    }

    .delete-btn {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 20px;
      height: 20px;
      padding: 0;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;

      .el-icon {
        font-size: 14px;
      }
    }
  }
}

.footer-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .upload-status {
    color: #606266;
    font-size: 14px;
  }

  .footer-buttons {
    display: flex;
    gap: 8px;
  }
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
