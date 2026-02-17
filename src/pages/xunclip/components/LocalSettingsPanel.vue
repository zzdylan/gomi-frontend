<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import type { LocalSettings } from "../apis/type"
import type { CopyLibraryItem } from "@/pages/copy-library/apis/type"
import { getCopyLibraryListApi } from "@/pages/copy-library/apis"

interface Props {
  settings: LocalSettings
}

defineProps<Props>()

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
  <div class="local-settings-panel">
    <h4 class="panel-title">
      场景配置
    </h4>

    <el-form label-position="top" size="small">
      <el-form-item label="文案库">
        <el-select
          v-model="settings.copy_id"
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
    </el-form>
  </div>
</template>

<style scoped lang="scss">
.local-settings-panel {
  .panel-title {
    margin: 0 0 16px;
    font-size: 15px;
    font-weight: 600;
    color: #303133;
  }

  :deep(.el-divider__text) {
    font-size: 13px;
    color: #606266;
    font-weight: 500;
  }

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
