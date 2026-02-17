<script setup lang="ts">
import type { BackgroundSettings } from "../apis/type"

const model = defineModel<BackgroundSettings>({ required: true })

const musicsInput = ref("")

watch(() => model.value.musics, (val) => {
  musicsInput.value = val?.join("\n") ?? ""
}, { immediate: true })

function handleMusicsBlur() {
  model.value.musics = musicsInput.value
    .split("\n")
    .map(s => s.trim())
    .filter(Boolean)
}
</script>

<template>
  <div class="background-settings-form">
    <el-form label-position="top" size="small">
      <el-form-item label="背景音乐 URL（每行一个，随机选择）">
        <el-input
          v-model="musicsInput"
          type="textarea"
          :rows="3"
          placeholder="粘贴背景音乐URL，每行一个"
          @blur="handleMusicsBlur"
        />
      </el-form-item>

      <el-form-item label="背景音乐音量">
        <el-slider
          v-model="model.music_volume"
          :min="0"
          :max="1"
          :step="0.05"
          show-input
          :show-input-controls="false"
          input-size="small"
        />
      </el-form-item>

      <el-form-item label="高斯模糊背景">
        <el-switch v-model="model.enable_blur" active-text="启用" />
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped lang="scss">
.background-settings-form {
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
