<script setup lang="ts">
import type { MaterialInfo } from "../apis/type"
import { Delete, Plus } from "@element-plus/icons-vue"

interface Props {
  materials: MaterialInfo[]
}

defineProps<Props>()

const emit = defineEmits<{
  addMaterial: []
  removeMaterial: [index: number]
}>()

function formatDuration(ms: number): string {
  if (!ms) return ""
  const seconds = Math.floor(ms / 1000)
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}
</script>

<template>
  <div class="material-grid">
    <div
      v-for="(material, index) in materials"
      :key="`${material.id}-${index}`"
      class="material-item"
    >
      <div class="thumbnail">
        <img :src="material.media_type === 'video' ? material.cover_url : material.url" alt="" crossorigin="anonymous">
        <!-- 视频标识 -->
        <div v-if="material.media_type === 'video'" class="video-badge">
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <div v-if="material.duration" class="duration-badge">
          {{ formatDuration(material.duration) }}
        </div>
        <div class="remove-overlay" @click.stop="emit('removeMaterial', index)">
          <el-icon><Delete /></el-icon>
        </div>
      </div>
      <div class="material-meta">
        <span class="dimensions">{{ material.width }}x{{ material.height }}</span>
      </div>
    </div>

    <div class="add-material" @click="emit('addMaterial')">
      <el-icon :size="24">
        <Plus />
      </el-icon>
      <span>添加素材</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.material-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;

  .material-item {
    border: 1px solid #ebeef5;
    border-radius: 6px;
    overflow: hidden;
    background: #fff;

    .thumbnail {
      width: 100%;
      height: 80px;
      position: relative;
      background: #000;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .video-badge {
        position: absolute;
        bottom: 4px;
        left: 4px;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.55);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        padding-left: 1px;
        pointer-events: none;
      }

      .duration-badge {
        position: absolute;
        bottom: 4px;
        right: 4px;
        background: rgba(0, 0, 0, 0.7);
        color: #fff;
        font-size: 11px;
        padding: 1px 5px;
        border-radius: 3px;
        pointer-events: none;
      }

      .remove-overlay {
        position: absolute;
        top: 4px;
        right: 4px;
        width: 22px;
        height: 22px;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.2s;
        font-size: 12px;
        z-index: 1;
      }
    }

    &:hover .remove-overlay {
      opacity: 1;
    }

    .material-meta {
      padding: 4px 6px;
      text-align: center;

      .dimensions {
        font-size: 11px;
        color: #909399;
      }
    }
  }

  .add-material {
    border: 2px dashed #dcdfe6;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100px;
    cursor: pointer;
    color: #909399;
    gap: 4px;
    transition: all 0.2s;

    span {
      font-size: 12px;
    }

    &:hover {
      border-color: #409eff;
      color: #409eff;
    }
  }
}
</style>
