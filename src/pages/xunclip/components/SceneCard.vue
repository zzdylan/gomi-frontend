<script setup lang="ts">
import type { SceneConfig, SceneTypeValue } from "../apis/type"
import { Delete } from "@element-plus/icons-vue"
import { SceneTypeLabel } from "../apis/type"

interface Props {
  scene: SceneConfig
  index: number
  active: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  select: [index: number]
  delete: [index: number]
}>()

function getTypeColor(type: SceneTypeValue): string {
  const colors: Record<number, string> = {
    1: "#e6a23c",
    2: "#409eff",
    3: "#67c23a"
  }
  return colors[type] || "#909399"
}
</script>

<template>
  <div
    class="scene-card"
    :class="{ active }"
    @click="emit('select', index)"
  >
    <div class="scene-header">
      <el-tag :color="getTypeColor(scene.type)" size="small" effect="dark" disable-transitions>
        {{ SceneTypeLabel[scene.type] }}
      </el-tag>
      <span class="scene-index">{{ index + 1 }}</span>
      <el-button
        class="delete-btn"
        :icon="Delete"
        size="small"
        text
        type="danger"
        @click.stop="emit('delete', index)"
      />
    </div>
    <div class="scene-meta">
      <span class="material-count">{{ scene.materials.length }} 个素材</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.scene-card {
  padding: 10px 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;

  &:hover {
    border-color: #c6e2ff;
    background: #f0f7ff;
  }

  &.active {
    border-color: #409eff;
    background: #ecf5ff;
  }

  .scene-header {
    display: flex;
    align-items: center;
    gap: 8px;

    .scene-index {
      font-size: 12px;
      color: #909399;
    }

    .delete-btn {
      margin-left: auto;
      opacity: 0;
      transition: opacity 0.2s;
    }
  }

  &:hover .delete-btn {
    opacity: 1;
  }

  .scene-meta {
    margin-top: 6px;

    .material-count {
      font-size: 12px;
      color: #909399;
    }
  }
}
</style>
