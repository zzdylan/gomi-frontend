<script setup lang="ts">
import type { FabricElement } from "@@/composables/useFabric"
import { Delete, EditPen, Grid, Picture, Rank, Sunny } from "@element-plus/icons-vue"
import { VueDraggable } from "vue-draggable-plus"

const props = defineProps<{
  elements: FabricElement[]
  activeObjectId?: string
}>()

const emit = defineEmits<{
  selectElement: [id: string]
  deleteElement: [id: string]
  reorderLayers: [elements: FabricElement[]]
}>()

const localElements = ref<FabricElement[]>([])

watch(
  () => props.elements,
  (newElements) => {
    localElements.value = [...newElements]
  },
  { immediate: true }
)

function isActive(id: string) {
  return id === (props.activeObjectId || "")
}

function handleDragEnd() {
  emit("reorderLayers", localElements.value)
}
</script>

<template>
  <div class="layer-panel">
    <div class="panel-header">
      <span class="panel-title">图层列表</span>
      <el-tag size="small">
        {{ elements.length }}
      </el-tag>
    </div>

    <div class="layer-list">
      <VueDraggable
        v-model="localElements"
        :animation="150"
        handle=".drag-handle"
        @end="handleDragEnd"
      >
        <div
          v-for="element in localElements"
          :key="element.id"
          class="layer-item"
          :class="{ active: isActive(element.id) }"
          @click="$emit('selectElement', element.id)"
        >
          <div class="layer-info">
            <el-icon class="layer-icon drag-handle">
              <Rank />
            </el-icon>
            <el-icon class="layer-icon">
              <Grid v-if="element.type === 'rect'" />
              <Sunny v-else-if="element.type === 'circle'" />
              <EditPen v-else-if="element.type === 'text'" />
              <Picture v-else-if="element.type === 'image'" />
            </el-icon>
            <span class="layer-name">{{ element.name }}</span>
          </div>

          <div class="layer-actions">
            <el-button
              type="danger"
              size="small"
              text
              @click.stop="$emit('deleteElement', element.id)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </VueDraggable>

      <el-empty v-if="elements.length === 0" description="暂无图层" :image-size="100" />
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

.layer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 4px;

  &:hover {
    background: #f5f5f5;
  }

  &.active {
    background: #e6f4ff;
    border: 1px solid #1890ff;
  }
}

.layer-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.layer-icon {
  font-size: 16px;
  color: #666;

  &.drag-handle {
    cursor: move;
    color: #999;

    &:hover {
      color: #333;
    }
  }
}

.layer-name {
  font-size: 14px;
  color: #333;
}

.layer-actions {
  display: flex;
  gap: 4px;
}
</style>
