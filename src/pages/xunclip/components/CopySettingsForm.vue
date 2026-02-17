<script setup lang="ts">
import type { CopySettings } from "../apis/type"
import type { CopyLibraryItem } from "@/pages/copy-library/apis/type"
import { getCopyLibraryListApi } from "@/pages/copy-library/apis"

const model = defineModel<CopySettings>({ required: true })

const copyLibraries = ref<CopyLibraryItem[]>([])
const loading = ref(false)

async function loadCopyLibraries() {
  loading.value = true
  try {
    const { data } = await getCopyLibraryListApi({ per_page: 100 })
    copyLibraries.value = data.items
  } catch {
    console.error("加载文案库失败")
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCopyLibraries()
})
</script>

<template>
  <div class="copy-settings-form">
    <el-form label-position="top" size="small">
      <el-form-item label="文案库">
        <el-select
          v-model="model.copy_id"
          placeholder="选择文案库"
          clearable
          filterable
          :loading="loading"
          style="width: 100%"
        >
          <el-option
            v-for="lib in copyLibraries"
            :key="lib.id"
            :label="lib.name"
            :value="lib.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="字幕">
        <el-switch v-model="model.show_subtitle" active-text="显示字幕" />
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped lang="scss">
.copy-settings-form {
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
