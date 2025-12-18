<script setup lang="ts">
const props = defineProps<{
  activeObject: any
}>()

const emit = defineEmits<{
  update: []
}>()

function getWidth() {
  if (!props.activeObject) return 0
  if (props.activeObject.type === "circle") {
    return (props.activeObject.radius || 0) * 2
  }
  return props.activeObject.width * (props.activeObject.scaleX || 1)
}

function getHeight() {
  if (!props.activeObject) return 0
  if (props.activeObject.type === "circle") {
    return (props.activeObject.radius || 0) * 2
  }
  return props.activeObject.height * (props.activeObject.scaleY || 1)
}

function handlePositionChange(prop: string, value: number | undefined) {
  if (!props.activeObject || value === undefined) return
  props.activeObject.set(prop, value)
  emit("update")
}

function handleSizeChange(prop: string, value: number | undefined) {
  if (!props.activeObject || value === undefined) return

  if (props.activeObject.type === "circle") {
    props.activeObject.set("radius", value / 2)
  } else {
    if (prop === "width") {
      props.activeObject.set("scaleX", value / props.activeObject.width)
    } else {
      props.activeObject.set("scaleY", value / props.activeObject.height)
    }
  }

  emit("update")
}

function handleRotationChange(value: number | number[]) {
  if (!props.activeObject) return
  const angle = Array.isArray(value) ? value[0] : value
  props.activeObject.set("angle", angle)
  emit("update")
}

function handleOpacityChange(value: number | number[]) {
  if (!props.activeObject) return
  const opacity = Array.isArray(value) ? value[0] : value
  props.activeObject.set("opacity", opacity / 100)
  emit("update")
}

function handleFontSizeChange(value: number | undefined) {
  if (!props.activeObject || value === undefined) return
  props.activeObject.set("fontSize", value)
  emit("update")
}

function handleColorChange(value: string | null) {
  if (!props.activeObject || !value) return
  props.activeObject.set("fill", value)
  emit("update")
}

function handleFontWeightChange(value: string) {
  if (!props.activeObject) return
  props.activeObject.set("fontWeight", value)
  emit("update")
}

function handleTextAlignChange(value: string | number | boolean | undefined) {
  if (!props.activeObject || typeof value !== "string") return
  props.activeObject.set("textAlign", value)
  emit("update")
}

function handleFillChange(value: string | null) {
  if (!props.activeObject || !value) return
  props.activeObject.set("fill", value)
  emit("update")
}

function handleStrokeChange(value: string | null) {
  if (!props.activeObject || !value) return
  props.activeObject.set("stroke", value)
  emit("update")
}

function handleStrokeWidthChange(value: number | undefined) {
  if (!props.activeObject || value === undefined) return
  props.activeObject.set("strokeWidth", value)
  emit("update")
}
</script>

<template>
  <div class="property-panel">
    <div class="panel-header">
      <span class="panel-title">属性设置</span>
    </div>

    <div v-if="!activeObject" class="empty-state">
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
              :model-value="activeObject.left"
              :step="1"
              size="small"
              @change="handlePositionChange('left', $event)"
            />
          </el-form-item>

          <el-form-item label="Y 坐标">
            <el-input-number
              :model-value="activeObject.top"
              :step="1"
              size="small"
              @change="handlePositionChange('top', $event)"
            />
          </el-form-item>

          <el-form-item label="宽度">
            <el-input-number
              :model-value="getWidth()"
              :step="1"
              :min="1"
              size="small"
              @change="handleSizeChange('width', $event)"
            />
          </el-form-item>

          <el-form-item label="高度">
            <el-input-number
              :model-value="getHeight()"
              :step="1"
              :min="1"
              size="small"
              @change="handleSizeChange('height', $event)"
            />
          </el-form-item>

          <el-form-item label="旋转">
            <el-slider
              :model-value="activeObject.angle || 0"
              :min="0"
              :max="360"
              @change="handleRotationChange"
            />
          </el-form-item>

          <el-form-item label="透明度">
            <el-slider
              :model-value="(activeObject.opacity || 1) * 100"
              :min="0"
              :max="100"
              @change="handleOpacityChange"
            />
          </el-form-item>
        </el-form>
      </div>

      <!-- 文本属性 -->
      <div v-if="activeObject.type === 'textbox'" class="property-section">
        <div class="section-title">
          文本属性
        </div>

        <el-form label-width="60px" size="small">
          <el-form-item label="字号">
            <el-input-number
              :model-value="activeObject.fontSize"
              :step="1"
              :min="12"
              :max="100"
              size="small"
              @change="handleFontSizeChange"
            />
          </el-form-item>

          <el-form-item label="颜色">
            <el-color-picker
              :model-value="activeObject.fill"
              @change="handleColorChange"
            />
          </el-form-item>

          <el-form-item label="粗细">
            <el-select
              :model-value="activeObject.fontWeight || 'normal'"
              @change="handleFontWeightChange"
            >
              <el-option label="正常" value="normal" />
              <el-option label="粗体" value="bold" />
            </el-select>
          </el-form-item>

          <el-form-item label="对齐">
            <el-radio-group
              :model-value="activeObject.textAlign || 'left'"
              size="small"
              @change="handleTextAlignChange"
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
      <div v-if="activeObject.type === 'rect' || activeObject.type === 'circle'" class="property-section">
        <div class="section-title">
          样式属性
        </div>

        <el-form label-width="60px" size="small">
          <el-form-item label="填充">
            <el-color-picker
              :model-value="activeObject.fill"
              @change="handleFillChange"
            />
          </el-form-item>

          <el-form-item label="边框">
            <el-color-picker
              :model-value="activeObject.stroke"
              @change="handleStrokeChange"
            />
          </el-form-item>

          <el-form-item label="边框宽">
            <el-input-number
              :model-value="activeObject.strokeWidth"
              :step="1"
              :min="0"
              :max="20"
              size="small"
              @change="handleStrokeWidthChange"
            />
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.property-panel {
  width: 100%;
  height: 100%;
  background: white;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #eee;
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
