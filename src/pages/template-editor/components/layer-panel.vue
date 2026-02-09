<script setup lang="ts">
import type { SubtitleTrackClip, VideoTrackClip } from "@/types/timeline"
import { Delete, EditPen, Picture, Rank, VideoCamera } from "@element-plus/icons-vue"
import { VueDraggable } from "vue-draggable-plus"

const props = defineProps<{
  videoClips: VideoTrackClip[]
  subtitleClips: SubtitleTrackClip[]
  activeClipId?: string | null
}>()

const emit = defineEmits<{
  selectClip: [id: string]
  deleteClip: [id: string]
  reorderVideoClips: [clips: VideoTrackClip[]]
  reorderSubtitleClips: [clips: SubtitleTrackClip[]]
}>()

// 本地状态，用于拖拽排序
const localVideoClips = ref<VideoTrackClip[]>([])
const localSubtitleClips = ref<SubtitleTrackClip[]>([])

// 同步外部数据
watch(
  () => props.videoClips,
  (newClips) => {
    localVideoClips.value = [...newClips]
  },
  { immediate: true }
)

watch(
  () => props.subtitleClips,
  (newClips) => {
    localSubtitleClips.value = [...newClips]
  },
  { immediate: true }
)

function isActive(id: string | undefined) {
  return id === (props.activeClipId || "")
}

function handleVideoDragEnd() {
  emit("reorderVideoClips", localVideoClips.value)
}

function handleSubtitleDragEnd() {
  emit("reorderSubtitleClips", localSubtitleClips.value)
}

// 获取视频/图片素材显示名称
function getVideoClipDisplayName(clip: VideoTrackClip) {
  if (clip.Type === "Image") {
    const fileName = clip.MediaURL.split("/").pop() || "图片"
    return fileName.length > 20 ? `${fileName.substring(0, 20)}...` : fileName
  }
  const fileName = clip.MediaURL.split("/").pop() || "视频"
  return fileName.length > 20 ? `${fileName.substring(0, 20)}...` : fileName
}

// 获取字幕素材显示名称
function getSubtitleClipDisplayName(clip: SubtitleTrackClip) {
  const text = clip.Content || "文本"
  return text.length > 15 ? `${text.substring(0, 15)}...` : text
}

// 计算总素材数量
const totalCount = computed(() => {
  return props.videoClips.length + props.subtitleClips.length
})
</script>

<template>
  <div class="layer-panel">
    <div class="panel-header">
      <span class="panel-title">图层列表</span>
      <el-tag size="small">
        {{ totalCount }}
      </el-tag>
    </div>

    <div class="layer-list">
      <el-empty v-if="totalCount === 0" description="暂无图层" :image-size="100" />

      <template v-else>
        <!-- 视频/图片轨道 -->
        <div v-if="localVideoClips.length > 0" class="track-section">
          <div class="track-header">
            <el-icon><Picture /></el-icon>
            <span>图片/视频轨</span>
            <el-tag size="small" type="info">
              {{ localVideoClips.length }}
            </el-tag>
          </div>

          <VueDraggable
            v-model="localVideoClips"
            :animation="150"
            handle=".drag-handle"
            @end="handleVideoDragEnd"
          >
            <div
              v-for="clip in localVideoClips"
              :key="clip.Id"
              class="layer-item"
              :class="{ active: isActive(clip.Id) }"
              @click="$emit('selectClip', clip.Id!)"
            >
              <div class="layer-info">
                <el-icon class="layer-icon drag-handle">
                  <Rank />
                </el-icon>
                <el-icon class="layer-icon">
                  <VideoCamera v-if="clip.Type === 'Video'" />
                  <Picture v-else />
                </el-icon>
                <span class="layer-name">{{ getVideoClipDisplayName(clip) }}</span>
              </div>

              <div class="layer-actions">
                <el-button
                  type="danger"
                  size="small"
                  text
                  @click.stop="$emit('deleteClip', clip.Id!)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </VueDraggable>
        </div>

        <!-- 字幕轨道 -->
        <div v-if="localSubtitleClips.length > 0" class="track-section">
          <div class="track-header">
            <el-icon><EditPen /></el-icon>
            <span>字幕轨</span>
            <el-tag size="small" type="info">
              {{ localSubtitleClips.length }}
            </el-tag>
          </div>

          <VueDraggable
            v-model="localSubtitleClips"
            :animation="150"
            handle=".drag-handle"
            @end="handleSubtitleDragEnd"
          >
            <div
              v-for="clip in localSubtitleClips"
              :key="clip.Id"
              class="layer-item"
              :class="{ active: isActive(clip.Id) }"
              @click="$emit('selectClip', clip.Id!)"
            >
              <div class="layer-info">
                <el-icon class="layer-icon drag-handle">
                  <Rank />
                </el-icon>
                <el-icon class="layer-icon">
                  <EditPen />
                </el-icon>
                <span class="layer-name">{{ getSubtitleClipDisplayName(clip) }}</span>
              </div>

              <div class="layer-actions">
                <el-button
                  type="danger"
                  size="small"
                  text
                  @click.stop="$emit('deleteClip', clip.Id!)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </VueDraggable>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.layer-panel {
  width: 100%;
  height: 100%;
  background: white;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.layer-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.track-section {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}

.track-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #606266;

  .el-icon {
    font-size: 14px;
  }

  .el-tag {
    margin-left: auto;
  }
}

.layer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
  margin-left: 8px;
  border: 1px solid transparent;

  &:hover {
    background: #f5f5f5;
  }

  &.active {
    background: #e6f4ff;
    border-color: #1890ff;
  }
}

.layer-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.layer-icon {
  font-size: 14px;
  color: #666;
  flex-shrink: 0;

  &.drag-handle {
    cursor: move;
    color: #999;

    &:hover {
      color: #333;
    }
  }
}

.layer-name {
  font-size: 13px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.layer-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
</style>
