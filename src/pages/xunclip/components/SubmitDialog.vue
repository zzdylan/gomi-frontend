<script setup lang="ts">
const emit = defineEmits<{
  submitted: [resultLimit: number]
}>()

const visible = defineModel<boolean>("visible", { required: true })

const resultLimit = ref(1)

function handleSubmit() {
  if (resultLimit.value < 1 || resultLimit.value > 100) {
    ElMessage.warning("生成数量需在 1-100 之间")
    return
  }
  emit("submitted", resultLimit.value)
  visible.value = false
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="提交讯剪任务"
    width="400px"
    :close-on-click-modal="false"
  >
    <el-form label-position="top">
      <el-form-item label="生成数量">
        <el-input-number
          v-model="resultLimit"
          :min="1"
          :max="100"
          :step="1"
          controls-position="right"
          style="width: 100%"
        />
        <div class="form-tip">
          每个子任务会独立合成一个视频，最多生成 100 个
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">
        取消
      </el-button>
      <el-button type="primary" @click="handleSubmit">
        提交任务
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
