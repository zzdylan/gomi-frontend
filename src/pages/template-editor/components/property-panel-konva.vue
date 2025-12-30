<script setup lang="ts">
import type { KonvaElement } from "@@/composables/useKonva"

const props = defineProps<{
  element: KonvaElement | null
}>()

const emit = defineEmits<{
  update: [updates: Partial<KonvaElement>]
}>()

// 直接更新属性，因为是响应式的
function updateProp<K extends keyof KonvaElement>(key: K, value: KonvaElement[K]) {
  emit("update", { [key]: value })
}

function handleRotationChange(value: number | number[]) {
  const angle = Array.isArray(value) ? value[0] : value
  updateProp("rotation", angle)
}

function handleOpacityChange(value: number | number[]) {
  const opacity = Array.isArray(value) ? value[0] : value
  updateProp("opacity", opacity / 100)
}

// 更新文字特效
function updateTextEffect(type: "shadow" | "gradient", key: string, value: any) {
  if (!props.element) return

  const currentEffect = props.element.textEffect || {}
  const currentTypeEffect = currentEffect[type] || {}

  emit("update", {
    textEffect: {
      ...currentEffect,
      [type]: {
        ...currentTypeEffect,
        [key]: value
      }
    }
  })
}

// 更新动画设置
function updateAnimation(key: "in" | "out" | "inDuration" | "outDuration", value: any) {
  if (!props.element) return

  const currentAnimation = props.element.animation || {
    in: "fade",
    out: "fade",
    inDuration: 0.5,
    outDuration: 0.5
  }

  emit("update", {
    animation: {
      ...currentAnimation,
      [key]: value
    }
  })
}

// 更新时间轴设置
function updateTimeline(key: "startTime" | "duration", value: number) {
  if (!props.element) return

  const currentTimeline = props.element.timeline || {
    startTime: 0,
    duration: 3,
    endTime: 3
  }

  const newTimeline = {
    ...currentTimeline,
    [key]: value
  }

  // 自动计算 endTime
  newTimeline.endTime = newTimeline.startTime + newTimeline.duration

  emit("update", {
    timeline: newTimeline
  })
}
</script>

<template>
  <div class="property-panel-konva">
    <div class="panel-header">
      <span class="panel-title">属性设置</span>
    </div>

    <div v-if="!element" class="empty-state">
      <el-empty description="请选择一个元素" :image-size="80" />
    </div>

    <div v-else class="property-content">
      <!-- 基础属性 -->
      <div class="property-section">
        <div class="section-title">
          基础属性
        </div>

        <el-form label-width="60px" size="small">
          <el-form-item label="X 坐标">
            <el-input-number
              :model-value="element.x"
              :step="1"
              size="small"
              @update:model-value="updateProp('x', $event!)"
            />
          </el-form-item>

          <el-form-item label="Y 坐标">
            <el-input-number
              :model-value="element.y"
              :step="1"
              size="small"
              @update:model-value="updateProp('y', $event!)"
            />
          </el-form-item>

          <el-form-item v-if="element.type === 'text'" label="宽度">
            <el-input-number
              :model-value="element.width"
              :step="1"
              :min="20"
              size="small"
              @update:model-value="updateProp('width', $event!)"
            />
          </el-form-item>

          <el-form-item label="旋转">
            <el-slider
              :model-value="element.rotation || 0"
              :min="0"
              :max="360"
              @update:model-value="handleRotationChange"
            />
          </el-form-item>

          <el-form-item label="透明度">
            <el-slider
              :model-value="(element.opacity || 1) * 100"
              :min="0"
              :max="100"
              @update:model-value="handleOpacityChange"
            />
          </el-form-item>
        </el-form>
      </div>

      <!-- 文本属性 -->
      <div v-if="element.type === 'text'" class="property-section">
        <div class="section-title">
          文本属性
        </div>

        <el-form label-width="60px" size="small">
          <el-form-item label="文本">
            <el-input
              :model-value="element.text"
              type="textarea"
              :rows="3"
              @update:model-value="updateProp('text', $event)"
            />
          </el-form-item>

          <el-form-item label="字号">
            <el-input-number
              :model-value="element.fontSize"
              :step="1"
              :min="12"
              :max="100"
              size="small"
              @update:model-value="updateProp('fontSize', $event!)"
            />
          </el-form-item>

          <el-form-item label="颜色">
            <el-color-picker
              :model-value="element.fill"
              @update:model-value="updateProp('fill', $event!)"
            />
          </el-form-item>

          <el-form-item label="粗细">
            <el-select
              :model-value="element.fontWeight || 'normal'"
              @update:model-value="updateProp('fontWeight', $event)"
            >
              <el-option label="正常" value="normal" />
              <el-option label="粗体" value="bold" />
            </el-select>
          </el-form-item>

          <el-form-item label="对齐">
            <el-radio-group
              :model-value="element.textAlign || 'left'"
              size="small"
              @update:model-value="updateProp('textAlign', $event as string)"
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
              :model-value="element.fontFamily || 'Arial'"
              @update:model-value="updateProp('fontFamily', $event)"
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

          <el-form-item label="描边颜色">
            <el-color-picker
              :model-value="element.stroke || '#000000'"
              @update:model-value="updateProp('stroke', $event!)"
            />
          </el-form-item>

          <el-form-item label="描边宽度">
            <el-input-number
              :model-value="element.strokeWidth || 0"
              :step="1"
              :min="0"
              :max="20"
              size="small"
              @update:model-value="updateProp('strokeWidth', $event!)"
            />
          </el-form-item>
        </el-form>
      </div>

      <!-- 文字特效（仅文本） -->
      <div v-if="element.type === 'text'" class="property-section">
        <div class="section-title">
          文字特效
        </div>

        <el-form label-width="80px" size="small">
          <!-- 阴影效果 -->
          <el-form-item label="阴影">
            <el-switch
              :model-value="element.textEffect?.shadow?.enabled || false"
              @update:model-value="updateTextEffect('shadow', 'enabled', $event)"
            />
          </el-form-item>

          <template v-if="element.textEffect?.shadow?.enabled">
            <el-form-item label="阴影颜色">
              <el-color-picker
                :model-value="element.textEffect?.shadow?.color || '#000000'"
                @update:model-value="updateTextEffect('shadow', 'color', $event!)"
              />
            </el-form-item>

            <el-form-item label="模糊">
              <el-slider
                :model-value="element.textEffect?.shadow?.blur || 0"
                :min="0"
                :max="20"
                @update:model-value="updateTextEffect('shadow', 'blur', $event)"
              />
            </el-form-item>

            <el-form-item label="X偏移">
              <el-slider
                :model-value="element.textEffect?.shadow?.offsetX || 0"
                :min="-20"
                :max="20"
                @update:model-value="updateTextEffect('shadow', 'offsetX', $event)"
              />
            </el-form-item>

            <el-form-item label="Y偏移">
              <el-slider
                :model-value="element.textEffect?.shadow?.offsetY || 0"
                :min="-20"
                :max="20"
                @update:model-value="updateTextEffect('shadow', 'offsetY', $event)"
              />
            </el-form-item>
          </template>
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
              :model-value="element.animation?.in || 'fade'"
              @update:model-value="updateAnimation('in', $event)"
            >
              <el-option label="无" value="none" />
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
              :model-value="element.animation?.inDuration || 0.5"
              :step="0.1"
              :min="0"
              :max="5"
              :precision="1"
              @update:model-value="updateAnimation('inDuration', $event!)"
            />
            <span style="margin-left: 8px">秒</span>
          </el-form-item>

          <el-form-item label="出场动画">
            <el-select
              :model-value="element.animation?.out || 'fade'"
              @update:model-value="updateAnimation('out', $event)"
            >
              <el-option label="无" value="none" />
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
              :model-value="element.animation?.outDuration || 0.5"
              :step="0.1"
              :min="0"
              :max="5"
              :precision="1"
              @update:model-value="updateAnimation('outDuration', $event!)"
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
              :model-value="element.timeline?.startTime || 0"
              :step="0.1"
              :min="0"
              :precision="1"
              @update:model-value="updateTimeline('startTime', $event!)"
            />
            <span style="margin-left: 8px">秒</span>
          </el-form-item>

          <el-form-item label="持续时间">
            <el-input-number
              :model-value="element.timeline?.duration || 3"
              :step="0.1"
              :min="0.1"
              :precision="1"
              @update:model-value="updateTimeline('duration', $event!)"
            />
            <span style="margin-left: 8px">秒</span>
          </el-form-item>

          <el-form-item label="出场时间">
            <el-input-number
              :model-value="(element.timeline?.startTime || 0) + (element.timeline?.duration || 3)"
              disabled
              :precision="1"
            />
            <span style="margin-left: 8px">秒</span>
          </el-form-item>
        </el-form>
      </div>
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
