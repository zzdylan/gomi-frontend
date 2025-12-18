<template>
  <div class="element-toolbar">
    <div class="toolbar-title">添加元素</div>

    <div class="toolbar-buttons">
      <el-button type="primary" @click="$emit('addRect')">
        <el-icon><Grid /></el-icon>
        矩形
      </el-button>

      <el-button type="success" @click="$emit('addCircle')">
        <el-icon><Sunny /></el-icon>
        圆形
      </el-button>

      <el-button type="info" @click="$emit('addText')">
        <el-icon><EditPen /></el-icon>
        文本
      </el-button>

      <el-upload
        :show-file-list="false"
        :before-upload="handleImageUpload"
        accept="image/*"
      >
        <el-button type="warning">
          <el-icon><Picture /></el-icon>
          图片
        </el-button>
      </el-upload>
    </div>

    <el-divider />

    <div class="toolbar-title">操作</div>
    <div class="toolbar-buttons">
      <el-button @click="$emit('deleteSelected')" :disabled="!hasSelection">
        <el-icon><Delete /></el-icon>
        删除
      </el-button>

      <el-popconfirm
        title="确定要清空画布吗?"
        confirm-button-text="确定"
        cancel-button-text="取消"
        @confirm="$emit('clearCanvas')"
      >
        <template #reference>
          <el-button>
            <el-icon><RefreshLeft /></el-icon>
            清空
          </el-button>
        </template>
      </el-popconfirm>
    </div>

    <el-divider />

    <div class="toolbar-title">导出</div>
    <div class="toolbar-buttons">
      <el-button @click="$emit('exportJSON')">
        <el-icon><Document /></el-icon>
        JSON
      </el-button>

      <el-button @click="$emit('exportImage')">
        <el-icon><Download /></el-icon>
        图片
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Delete, Document, Download, EditPen, Grid, Picture, RefreshLeft, Sunny } from "@element-plus/icons-vue"
import type { UploadRawFile } from "element-plus"

defineProps<{
  hasSelection: boolean
}>()

const emit = defineEmits<{
  addRect: []
  addCircle: []
  addText: []
  addImage: [url: string]
  deleteSelected: []
  clearCanvas: []
  exportJSON: []
  exportImage: []
}>()

const handleImageUpload = (file: UploadRawFile) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const url = e.target?.result as string
    emit("addImage", url)
  }
  reader.readAsDataURL(file)
  return false // 阻止自动上传
}
</script>

<style scoped lang="scss">
.element-toolbar {
  width: 100%;
  height: 100%;
  padding: 16px;
  overflow-y: auto;
}

.toolbar-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.toolbar-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .el-button {
    width: 100%;
    justify-content: flex-start;
  }

  :deep(.el-upload) {
    width: 100%;
    display: block;

    .el-button {
      width: 100%;
      justify-content: flex-start;
    }
  }
}

:deep(.el-divider) {
  margin: 16px 0;
}
</style>
