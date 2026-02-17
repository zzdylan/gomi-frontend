<script setup lang="ts">
import type { AspectRatio, SceneConfig, SceneTypeValue } from "../apis/type"
import { Plus } from "@element-plus/icons-vue"
import { SceneType, SceneTypeLabel } from "../apis/type"
import SceneCard from "./SceneCard.vue"

interface Props {
  scenes: SceneConfig[]
  selectedIndex: number
  title: string
  aspect: AspectRatio
  isGlobalMode: boolean
  hasOpening: boolean
  hasEnding: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  "update:title": [value: string]
  "update:aspect": [value: AspectRatio]
  "selectScene": [index: number]
  "deleteScene": [index: number]
  "addScene": [type: SceneTypeValue]
  "toggleMode": []
}>()

const addSceneType = ref<SceneTypeValue>(SceneType.Main)

// 场景类型选项（已有片头/片尾时禁用对应选项）
const sceneTypeOptions = computed(() => [
  { label: SceneTypeLabel[SceneType.Opening], value: SceneType.Opening, disabled: props.hasOpening },
  { label: SceneTypeLabel[SceneType.Main], value: SceneType.Main, disabled: false },
  { label: SceneTypeLabel[SceneType.Ending], value: SceneType.Ending, disabled: props.hasEnding }
])

function handleAdd() {
  emit("addScene", addSceneType.value)
}
</script>

<template>
  <div class="scene-list">
    <div class="list-header">
      <el-form label-position="top" size="small">
        <el-form-item label="工程标题">
          <el-input
            :model-value="title"
            placeholder="请输入工程标题"
            @update:model-value="emit('update:title', $event)"
          />
        </el-form-item>

        <el-form-item label="画面比例">
          <el-radio-group
            :model-value="aspect"
            @update:model-value="emit('update:aspect', $event as AspectRatio)"
          >
            <el-radio-button value="9:16">
              9:16
            </el-radio-button>
            <el-radio-button value="16:9">
              16:9
            </el-radio-button>
            <el-radio-button value="1:1">
              1:1
            </el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="配置模式">
          <el-switch
            :model-value="isGlobalMode"
            active-text="全局"
            inactive-text="局部"
            @change="emit('toggleMode')"
          />
        </el-form-item>
      </el-form>
    </div>

    <el-divider />

    <div class="scene-cards">
      <SceneCard
        v-for="(scene, index) in scenes"
        :key="index"
        :scene="scene"
        :index="index"
        :active="index === selectedIndex"
        @select="emit('selectScene', $event)"
        @delete="emit('deleteScene', $event)"
      />
    </div>

    <div class="add-scene">
      <el-select v-model="addSceneType" size="small" style="width: 80px">
        <el-option
          v-for="opt in sceneTypeOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
          :disabled="opt.disabled"
        />
      </el-select>
      <el-button type="primary" size="small" :icon="Plus" @click="handleAdd">
        添加场景
      </el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.scene-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  overflow-y: auto;

  .list-header {
    :deep(.el-form-item) {
      margin-bottom: 12px;
    }

    :deep(.el-form-item__label) {
      font-size: 12px;
      color: #606266;
      padding-bottom: 4px;
    }
  }

  .scene-cards {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 0;
    overflow-y: auto;
    padding: 2px;
  }

  .add-scene {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #ebeef5;
  }
}
</style>
