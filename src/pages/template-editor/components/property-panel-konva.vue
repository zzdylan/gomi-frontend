<script setup lang="ts">
import type { KonvaElement } from "@@/composables/useKonva"

defineProps<{
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

          <el-form-item v-if="element.type === 'rect'" label="宽度">
            <el-input-number
              :model-value="element.width"
              :step="1"
              :min="1"
              size="small"
              @update:model-value="updateProp('width', $event!)"
            />
          </el-form-item>

          <el-form-item v-if="element.type === 'rect'" label="高度">
            <el-input-number
              :model-value="element.height"
              :step="1"
              :min="1"
              size="small"
              @update:model-value="updateProp('height', $event!)"
            />
          </el-form-item>

          <el-form-item v-if="element.type === 'circle'" label="直径">
            <el-input-number
              :model-value="(element.radius || 0) * 2"
              :step="1"
              :min="1"
              size="small"
              @update:model-value="updateProp('radius', $event! / 2)"
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
        </el-form>
      </div>

      <!-- 填充颜色（矩形、圆形） -->
      <div v-if="element.type === 'rect' || element.type === 'circle'" class="property-section">
        <div class="section-title">
          样式属性
        </div>

        <el-form label-width="60px" size="small">
          <el-form-item label="填充">
            <el-color-picker
              :model-value="element.fill"
              @update:model-value="updateProp('fill', $event!)"
            />
          </el-form-item>

          <el-form-item label="边框">
            <el-color-picker
              :model-value="element.stroke"
              @update:model-value="updateProp('stroke', $event!)"
            />
          </el-form-item>

          <el-form-item label="边框宽">
            <el-input-number
              :model-value="element.strokeWidth"
              :step="1"
              :min="0"
              :max="20"
              size="small"
              @update:model-value="updateProp('strokeWidth', $event!)"
            />
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
