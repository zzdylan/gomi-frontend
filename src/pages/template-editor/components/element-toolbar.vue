<script setup lang="ts">
import type { MaterialItem } from "@/pages/material/apis/type"
import { Delete, Document, Download, EditPen, FolderOpened, RefreshLeft } from "@element-plus/icons-vue"
import MaterialSelector from "@/common/components/MaterialSelector/index.vue"

defineProps<{
  hasSelection: boolean
}>()

const emit = defineEmits<{
  addText: []
  addImage: [url: string, mediaId?: string]
  deleteSelected: []
  clearCanvas: []
  exportJSON: []
  exportImage: []
}>()

const materialSelectorVisible = ref(false)

function showMaterialSelector() {
  materialSelectorVisible.value = true
}

function handleMaterialSelect(material: MaterialItem) {
  // 传递 url（用于显示）和 media_id（用于保存）
  emit("addImage", material.url, material.media_id)
  materialSelectorVisible.value = false
}
</script>

<template>
  <div class="element-toolbar">
    <div class="toolbar-title">
      添加元素
    </div>

    <div class="toolbar-buttons">
      <el-button type="info" @click="$emit('addText')">
        <el-icon><EditPen /></el-icon>
        文本
      </el-button>

      <el-button type="success" @click="showMaterialSelector">
        <el-icon><FolderOpened /></el-icon>
        素材库
      </el-button>
    </div>

    <el-divider />

    <div class="toolbar-title">
      操作
    </div>
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

    <div class="toolbar-title">
      导出
    </div>
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

    <!-- 素材选择器对话框 -->
    <el-dialog
      v-model="materialSelectorVisible"
      title="选择素材"
      width="900px"
      :close-on-click-modal="false"
    >
      <MaterialSelector
        :accept-types="['image']"
        @select="handleMaterialSelect"
        @close="materialSelectorVisible = false"
      />
    </el-dialog>
  </div>
</template>

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

  > * {
    width: 100%;
  }

  .el-button {
    width: 100% !important;
    justify-content: flex-start;
    margin: 0 !important;
    padding-left: 16px;
    padding-right: 16px;
  }

  :deep(.el-upload),
  :deep(.el-popconfirm__reference) {
    width: 100%;
    display: block;
  }

  :deep(.el-button) {
    width: 100% !important;
    margin: 0 !important;
  }
}

:deep(.el-divider) {
  margin: 16px 0;
}
</style>
