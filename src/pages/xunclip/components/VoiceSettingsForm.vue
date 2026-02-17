<script setup lang="ts">
import type { VoiceSettings } from "../apis/type"

const model = defineModel<VoiceSettings>({ required: true })

const speakersInput = ref("")

// 同步 speakers 数组到文本框
watch(() => model.value.speakers, (val) => {
  speakersInput.value = val?.join(", ") ?? ""
}, { immediate: true })

function handleSpeakersBlur() {
  model.value.speakers = speakersInput.value
    .split(/[,，\s]+/)
    .map(s => s.trim())
    .filter(Boolean)
}
</script>

<template>
  <div class="voice-settings-form">
    <el-form label-position="top" size="small">
      <el-form-item label="主播 ID（多个用逗号分隔，随机选择）">
        <el-input
          v-model="speakersInput"
          placeholder="如: zhixiaobai, zhixiaoxia"
          @blur="handleSpeakersBlur"
        />
      </el-form-item>

      <el-form-item label="语速">
        <el-slider
          v-model="model.speed_ratio"
          :min="0.5"
          :max="2.0"
          :step="0.1"
          show-input
          :show-input-controls="false"
          input-size="small"
        />
      </el-form-item>

      <el-form-item label="音量">
        <el-slider
          v-model="model.volume_ratio"
          :min="0"
          :max="2.0"
          :step="0.1"
          show-input
          :show-input-controls="false"
          input-size="small"
        />
      </el-form-item>

      <el-form-item label="音调">
        <el-slider
          v-model="model.pitch_ratio"
          :min="0.5"
          :max="2.0"
          :step="0.1"
          show-input
          :show-input-controls="false"
          input-size="small"
        />
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped lang="scss">
.voice-settings-form {
  :deep(.el-form-item) {
    margin-bottom: 14px;
  }

  :deep(.el-form-item__label) {
    font-size: 12px;
    color: #606266;
    padding-bottom: 4px;
  }
}
</style>
