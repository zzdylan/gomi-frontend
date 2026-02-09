<script setup lang="ts">
import type { AnyClip, SubtitleTrackClip, VideoTrackClip } from "@/types/timeline"

const props = defineProps<{
  clip: AnyClip | null
  clipType: "video" | "image" | "text" | "audio" | null
}>()

const emit = defineEmits<{
  updateVideo: [updates: Partial<VideoTrackClip>]
  updateSubtitle: [updates: Partial<SubtitleTrackClip>]
}>()

// 判断是否是视频/图片素材
const isVideoClip = computed(() => {
  return props.clipType === "video" || props.clipType === "image"
})

// 判断是否是字幕素材
const isSubtitleClip = computed(() => {
  return props.clipType === "text"
})

// 获取视频/图片素材
const videoClip = computed(() => {
  if (!isVideoClip.value || !props.clip) return null
  return props.clip as VideoTrackClip
})

// 获取字幕素材
const subtitleClip = computed(() => {
  if (!isSubtitleClip.value || !props.clip) return null
  return props.clip as SubtitleTrackClip
})

// 更新视频/图片属性
function updateVideoProp<K extends keyof VideoTrackClip>(key: K, value: VideoTrackClip[K]) {
  emit("updateVideo", { [key]: value })
}

// 更新字幕属性
function updateSubtitleProp<K extends keyof SubtitleTrackClip>(key: K, value: SubtitleTrackClip[K]) {
  emit("updateSubtitle", { [key]: value })
}

// 处理透明度变化（视频/图片）
function handleVideoOpacityChange(value: number | number[]) {
  const opacity = Array.isArray(value) ? value[0] : value
  updateVideoProp("Opacity", opacity / 100)
}

// 处理透明度变化（字幕）
function handleSubtitleOpacityChange(value: number | number[]) {
  const opacity = Array.isArray(value) ? value[0] : value
  updateSubtitleProp("FontColorOpacity", opacity / 100)
}

// 处理旋转变化（字幕）
function handleAngleChange(value: number | number[]) {
  const angle = Array.isArray(value) ? value[0] : value
  updateSubtitleProp("Angle", angle)
}

// 更新字体样式
function updateFontFace(key: "Bold" | "Italic" | "Underline", value: boolean) {
  if (!subtitleClip.value) return

  const currentFontFace = subtitleClip.value.FontFace || {
    Bold: false,
    Italic: false,
    Underline: false
  }

  emit("updateSubtitle", {
    FontFace: {
      ...currentFontFace,
      [key]: value
    }
  })
}

// 更新时间轴设置
function updateTimeline(key: "TimelineIn" | "TimelineOut", value: number) {
  if (isVideoClip.value) {
    updateVideoProp(key, value)
  } else if (isSubtitleClip.value) {
    updateSubtitleProp(key, value)
  }
}

// 更新动画设置（字幕）
function updateMotion(key: "AaiMotionInEffect" | "AaiMotionIn" | "AaiMotionOutEffect" | "AaiMotionOut", value: any) {
  updateSubtitleProp(key, value)
}

// 计算持续时长
const duration = computed(() => {
  if (!props.clip) return 0
  const clip = props.clip as any
  const timelineIn = clip.TimelineIn ?? 0
  const timelineOut = clip.TimelineOut ?? 3
  return timelineOut - timelineIn
})
</script>

<template>
  <div class="property-panel-konva">
    <div class="panel-header">
      <span class="panel-title">属性设置</span>
    </div>

    <div v-if="!clip" class="empty-state">
      <el-empty description="请选择一个元素" :image-size="80" />
    </div>

    <div v-else class="property-content">
      <!-- 视频/图片属性 -->
      <template v-if="isVideoClip && videoClip">
        <div class="property-section">
          <div class="section-title">
            基础属性
          </div>

          <el-form label-width="60px" size="small">
            <el-form-item label="X 坐标">
              <el-input-number
                :model-value="videoClip.X ?? 0"
                :step="1"
                size="small"
                @update:model-value="updateVideoProp('X', $event!)"
              />
            </el-form-item>

            <el-form-item label="Y 坐标">
              <el-input-number
                :model-value="videoClip.Y ?? 0"
                :step="1"
                size="small"
                @update:model-value="updateVideoProp('Y', $event!)"
              />
            </el-form-item>

            <el-form-item label="宽度">
              <el-input-number
                :model-value="videoClip.Width"
                :step="1"
                :min="1"
                size="small"
                @update:model-value="updateVideoProp('Width', $event!)"
              />
            </el-form-item>

            <el-form-item label="高度">
              <el-input-number
                :model-value="videoClip.Height"
                :step="1"
                :min="1"
                size="small"
                @update:model-value="updateVideoProp('Height', $event!)"
              />
            </el-form-item>

            <el-form-item label="透明度">
              <el-slider
                :model-value="(videoClip.Opacity ?? 1) * 100"
                :min="0"
                :max="100"
                @update:model-value="handleVideoOpacityChange"
              />
            </el-form-item>
          </el-form>
        </div>

        <!-- 时间轴设置 -->
        <div class="property-section">
          <div class="section-title">
            时间轴设置
          </div>

          <el-form label-width="80px" size="small">
            <el-form-item label="入场时间">
              <el-input-number
                :model-value="videoClip.TimelineIn ?? 0"
                :step="0.1"
                :min="0"
                :precision="1"
                @update:model-value="updateTimeline('TimelineIn', $event!)"
              />
              <span style="margin-left: 8px">秒</span>
            </el-form-item>

            <el-form-item label="出场时间">
              <el-input-number
                :model-value="videoClip.TimelineOut ?? 3"
                :step="0.1"
                :min="0.1"
                :precision="1"
                @update:model-value="updateTimeline('TimelineOut', $event!)"
              />
              <span style="margin-left: 8px">秒</span>
            </el-form-item>

            <el-form-item label="持续时长">
              <el-input-number
                :model-value="duration"
                disabled
                :precision="1"
              />
              <span style="margin-left: 8px">秒</span>
            </el-form-item>
          </el-form>
        </div>
      </template>

      <!-- 字幕属性 -->
      <template v-if="isSubtitleClip && subtitleClip">
        <div class="property-section">
          <div class="section-title">
            基础属性
          </div>

          <el-form label-width="60px" size="small">
            <el-form-item label="X 坐标">
              <el-input-number
                :model-value="subtitleClip.X ?? 0"
                :step="1"
                size="small"
                @update:model-value="updateSubtitleProp('X', $event!)"
              />
            </el-form-item>

            <el-form-item label="Y 坐标">
              <el-input-number
                :model-value="subtitleClip.Y ?? 0"
                :step="1"
                size="small"
                @update:model-value="updateSubtitleProp('Y', $event!)"
              />
            </el-form-item>

            <el-form-item label="旋转">
              <el-slider
                :model-value="subtitleClip.Angle ?? 0"
                :min="0"
                :max="360"
                @update:model-value="handleAngleChange"
              />
            </el-form-item>

            <el-form-item label="透明度">
              <el-slider
                :model-value="(subtitleClip.FontColorOpacity ?? 1) * 100"
                :min="0"
                :max="100"
                @update:model-value="handleSubtitleOpacityChange"
              />
            </el-form-item>
          </el-form>
        </div>

        <!-- 文本属性 -->
        <div class="property-section">
          <div class="section-title">
            文本属性
          </div>

          <el-form label-width="60px" size="small">
            <el-form-item label="文本">
              <el-input
                :model-value="subtitleClip.Content"
                type="textarea"
                :rows="3"
                @update:model-value="updateSubtitleProp('Content', $event)"
              />
            </el-form-item>

            <el-form-item label="字号">
              <el-input-number
                :model-value="subtitleClip.FontSize ?? 24"
                :step="1"
                :min="12"
                :max="100"
                size="small"
                @update:model-value="updateSubtitleProp('FontSize', $event!)"
              />
            </el-form-item>

            <el-form-item label="颜色">
              <el-color-picker
                :model-value="subtitleClip.FontColor ?? '#1f2937'"
                @update:model-value="updateSubtitleProp('FontColor', $event!)"
              />
            </el-form-item>

            <el-form-item label="样式">
              <el-checkbox
                :model-value="subtitleClip.FontFace?.Bold ?? false"
                @update:model-value="updateFontFace('Bold', $event as boolean)"
              >
                <b>加粗</b>
              </el-checkbox>
              <el-checkbox
                :model-value="subtitleClip.FontFace?.Italic ?? false"
                @update:model-value="updateFontFace('Italic', $event as boolean)"
              >
                <i>斜体</i>
              </el-checkbox>
              <el-checkbox
                :model-value="subtitleClip.FontFace?.Underline ?? false"
                @update:model-value="updateFontFace('Underline', $event as boolean)"
              >
                <u>下划线</u>
              </el-checkbox>
            </el-form-item>

            <el-form-item label="对齐">
              <el-radio-group
                :model-value="subtitleClip.Alignment ?? 'left'"
                size="small"
                @update:model-value="updateSubtitleProp('Alignment', $event as string)"
              >
                <el-radio-button value="left">
                  左
                </el-radio-button>
                <el-radio-button value="center">
                  中
                </el-radio-button>
                <el-radio-button value="right">
                  右
                </el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="字体">
              <el-select
                :model-value="subtitleClip.Font || 'Arial'"
                @update:model-value="updateSubtitleProp('Font', $event)"
              >
                <el-option label="Arial" value="Arial" />
                <el-option label="微软雅黑" value="Microsoft YaHei, sans-serif" />
                <el-option label="苹方" value="PingFang SC, sans-serif" />
                <el-option label="宋体" value="SimSun, serif" />
                <el-option label="黑体" value="SimHei, sans-serif" />
                <el-option label="楷体" value="KaiTi, serif" />
                <el-option label="系统默认" value="system-ui, sans-serif" />
                <el-option label="Times New Roman" value="Times New Roman, serif" />
                <el-option label="Courier New" value="Courier New, monospace" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>

        <!-- 动画设置 -->
        <div class="property-section">
          <div class="section-title">
            动画设置
          </div>

          <el-form label-width="80px" size="small">
            <el-form-item label="入场动画">
              <el-select
                :model-value="subtitleClip.AaiMotionInEffect || ''"
                @update:model-value="updateMotion('AaiMotionInEffect', $event)"
              >
                <el-option label="无" value="" />
                <el-option label="淡入" value="fade" />
                <el-option label="从左滑入" value="slide-left" />
                <el-option label="从右滑入" value="slide-right" />
                <el-option label="从上滑入" value="slide-up" />
                <el-option label="从下滑入" value="slide-down" />
                <el-option label="缩放" value="zoom" />
                <el-option label="弹跳" value="bounce" />
              </el-select>
            </el-form-item>

            <el-form-item label="入场时长">
              <el-input-number
                :model-value="subtitleClip.AaiMotionIn ?? 0.5"
                :step="0.1"
                :min="0"
                :max="5"
                :precision="1"
                @update:model-value="updateMotion('AaiMotionIn', $event!)"
              />
              <span style="margin-left: 8px">秒</span>
            </el-form-item>

            <el-form-item label="出场动画">
              <el-select
                :model-value="subtitleClip.AaiMotionOutEffect || ''"
                @update:model-value="updateMotion('AaiMotionOutEffect', $event)"
              >
                <el-option label="无" value="" />
                <el-option label="淡出" value="fade" />
                <el-option label="向左滑出" value="slide-left" />
                <el-option label="向右滑出" value="slide-right" />
                <el-option label="向上滑出" value="slide-up" />
                <el-option label="向下滑出" value="slide-down" />
                <el-option label="缩放" value="zoom" />
                <el-option label="弹跳" value="bounce" />
              </el-select>
            </el-form-item>

            <el-form-item label="出场时长">
              <el-input-number
                :model-value="subtitleClip.AaiMotionOut ?? 0.5"
                :step="0.1"
                :min="0"
                :max="5"
                :precision="1"
                @update:model-value="updateMotion('AaiMotionOut', $event!)"
              />
              <span style="margin-left: 8px">秒</span>
            </el-form-item>
          </el-form>
        </div>

        <!-- 时间轴设置 -->
        <div class="property-section">
          <div class="section-title">
            时间轴设置
          </div>

          <el-form label-width="80px" size="small">
            <el-form-item label="入场时间">
              <el-input-number
                :model-value="subtitleClip.TimelineIn ?? 0"
                :step="0.1"
                :min="0"
                :precision="1"
                @update:model-value="updateTimeline('TimelineIn', $event!)"
              />
              <span style="margin-left: 8px">秒</span>
            </el-form-item>

            <el-form-item label="出场时间">
              <el-input-number
                :model-value="subtitleClip.TimelineOut ?? 3"
                :step="0.1"
                :min="0.1"
                :precision="1"
                @update:model-value="updateTimeline('TimelineOut', $event!)"
              />
              <span style="margin-left: 8px">秒</span>
            </el-form-item>

            <el-form-item label="持续时长">
              <el-input-number
                :model-value="duration"
                disabled
                :precision="1"
              />
              <span style="margin-left: 8px">秒</span>
            </el-form-item>
          </el-form>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.property-panel-konva {
  width: 100%;
  height: 100%;
  background: white;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  background: #fafafa;
  min-height: 40px;
  display: flex;
  align-items: center;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.property-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.property-section {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #666;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.el-form-item {
  margin-bottom: 16px;
}

.el-input-number {
  width: 100%;
}
</style>
