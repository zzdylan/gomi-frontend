<script setup lang="ts">
import type { MaterialFolderItem, MaterialItem, MaterialType } from "@/pages/material/apis/type"
import { Folder, Upload } from "@element-plus/icons-vue"
import MaterialUpload from "@/common/components/MaterialUpload/index.vue"
import { getMaterialFolderListApi, getMaterialListApi } from "@/pages/material/apis"

// Props 定义
interface Props {
  /** 允许选择的素材类型，默认 ['image', 'video'] 全部 */
  acceptTypes?: MaterialType[]
  /** 是否显示类型筛选下拉框，默认根据 acceptTypes 自动判断 */
  showTypeFilter?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  acceptTypes: () => ["image", "video"],
  showTypeFilter: undefined
})

const emit = defineEmits<{
  /** 选择素材时触发，返回素材对象 */
  select: [material: MaterialItem]
  /** 关闭选择器 */
  close: []
}>()

// 是否显示类型筛选（如果只有一种类型则不显示）
const shouldShowTypeFilter = computed(() => {
  if (props.showTypeFilter !== undefined) {
    return props.showTypeFilter
  }
  return props.acceptTypes.length > 1
})

// 类型筛选选项
const typeOptions = computed(() => {
  const options: { label: string, value: MaterialType | "" }[] = []
  if (props.acceptTypes.length > 1) {
    options.push({ label: "全部", value: "" })
  }
  if (props.acceptTypes.includes("image")) {
    options.push({ label: "图片", value: "image" })
  }
  if (props.acceptTypes.includes("video")) {
    options.push({ label: "视频", value: "video" })
  }
  return options
})

// 文件夹导航
interface BreadcrumbItem {
  id: number
  name: string
}

const breadcrumbs = ref<BreadcrumbItem[]>([{ id: 0, name: "全部素材" }])
const currentFolderId = computed(() => breadcrumbs.value[breadcrumbs.value.length - 1].id)

// 文件夹列表
const folders = ref<MaterialFolderItem[]>([])
const loadingFolders = ref(false)

// 素材列表
const materials = ref<MaterialItem[]>([])
const loadingMaterials = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 当前筛选类型
const filterType = ref<MaterialType | "">(
  props.acceptTypes.length === 1 ? props.acceptTypes[0] : ""
)

// 加载文件夹列表
async function loadFolders() {
  loadingFolders.value = true
  try {
    const { data } = await getMaterialFolderListApi({ parent_id: currentFolderId.value })
    folders.value = data.folders
  } catch (error) {
    console.error("加载文件夹失败:", error)
  } finally {
    loadingFolders.value = false
  }
}

// 进入文件夹
function enterFolder(folder: MaterialFolderItem) {
  breadcrumbs.value.push({ id: folder.id, name: folder.name })
  loadFolders()
  currentPage.value = 1
  loadMaterials()
}

// 通过面包屑导航
function navigateToFolder(index: number) {
  breadcrumbs.value = breadcrumbs.value.slice(0, index + 1)
  loadFolders()
  currentPage.value = 1
  loadMaterials()
}

// 加载素材列表
async function loadMaterials() {
  loadingMaterials.value = true
  try {
    const params: Record<string, any> = {
      folder_id: currentFolderId.value,
      page: currentPage.value,
      per_page: pageSize.value
    }

    if (filterType.value) {
      params.type = filterType.value
    } else if (props.acceptTypes.length === 1) {
      params.type = props.acceptTypes[0]
    }

    const { data } = await getMaterialListApi(params)
    materials.value = data.materials
    total.value = data.paging.total_count
  } catch (error) {
    console.error("加载素材失败:", error)
  } finally {
    loadingMaterials.value = false
  }
}

// 切换页码
function handlePageChange() {
  loadMaterials()
}

// 切换类型筛选
function handleTypeChange() {
  currentPage.value = 1
  loadMaterials()
}

// 选择素材
function handleSelect(material: MaterialItem) {
  emit("select", material)
  emit("close")
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`
}

// 上传素材
const uploadDialogVisible = ref(false)

function handleUploadSuccess() {
  currentPage.value = 1
  loadMaterials()
}

// 初始化
onMounted(() => {
  loadFolders()
  loadMaterials()
})
</script>

<template>
  <div class="material-selector">
    <!-- 左侧文件夹 -->
    <div class="folder-sidebar">
      <div class="folder-header">
        <h3>文件夹</h3>
      </div>

      <!-- 面包屑导航 -->
      <div class="breadcrumb-nav">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item
            v-for="(item, index) in breadcrumbs"
            :key="item.id"
            :class="{ clickable: index < breadcrumbs.length - 1 }"
            @click="navigateToFolder(index)"
          >
            {{ item.name }}
          </el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <!-- 文件夹列表 -->
      <div v-loading="loadingFolders" class="folder-list">
        <div
          v-for="folder in folders"
          :key="folder.id"
          class="folder-item"
          @click="enterFolder(folder)"
        >
          <el-icon class="folder-icon">
            <Folder />
          </el-icon>
          <span class="folder-name">{{ folder.name }}</span>
        </div>

        <div v-if="folders.length === 0 && !loadingFolders" class="empty-folder">
          <el-empty description="当前目录下没有文件夹" :image-size="80" />
        </div>
      </div>
    </div>

    <!-- 右侧素材区域 -->
    <div class="material-content">
      <!-- 工具栏 -->
      <div class="material-toolbar">
        <div class="toolbar-left">
          <el-select
            v-if="shouldShowTypeFilter"
            v-model="filterType"
            style="width: 100px"
            size="default"
            @change="handleTypeChange"
          >
            <el-option
              v-for="opt in typeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </div>
        <el-button type="primary" @click="uploadDialogVisible = true">
          <el-icon><Upload /></el-icon>
          上传素材
        </el-button>
      </div>

      <!-- 素材网格 -->
      <div v-loading="loadingMaterials" class="material-grid">
        <div v-if="materials.length === 0" class="empty-tip">
          <el-empty description="暂无素材" :image-size="100" />
        </div>

        <div
          v-for="material in materials"
          :key="material.id"
          class="material-card"
          @click="handleSelect(material)"
        >
          <div class="thumbnail">
            <img v-if="material.type === 'image'" :src="material.url" :alt="material.original_name">
            <video v-else :src="material.url" preload="metadata" />
          </div>

          <div class="material-info">
            <div class="name" :title="material.original_name">
              {{ material.original_name }}
            </div>
            <div class="meta">
              <span>{{ formatFileSize(material.size) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="total > 0" class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          small
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 上传对话框 -->
    <MaterialUpload
      v-model:visible="uploadDialogVisible"
      :folder-id="currentFolderId"
      @success="handleUploadSuccess"
    />
  </div>
</template>

<style scoped lang="scss">
.material-selector {
  display: flex;
  height: 550px;
  background: #fafafa;
  border-radius: 8px;
  overflow: hidden;

  .folder-sidebar {
    width: 200px;
    border-right: 1px solid #ebeef5;
    display: flex;
    flex-direction: column;
    background: #fff;

    .folder-header {
      padding: 14px 16px;
      border-bottom: 1px solid #ebeef5;

      h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #303133;
      }
    }

    .breadcrumb-nav {
      padding: 10px 16px;
      background: #fafafa;
      border-bottom: 1px solid #ebeef5;

      :deep(.el-breadcrumb) {
        font-size: 12px;
      }

      :deep(.el-breadcrumb__item) {
        .el-breadcrumb__inner {
          font-weight: normal;
          color: #909399;
        }

        &:last-child .el-breadcrumb__inner {
          color: #303133;
        }

        &.clickable .el-breadcrumb__inner {
          cursor: pointer;
          color: #409eff;

          &:hover {
            text-decoration: underline;
          }
        }
      }
    }

    .folder-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px;

      .folder-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        margin-bottom: 2px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: #f0f7ff;
        }

        .folder-icon {
          font-size: 18px;
          color: #faad14;
          flex-shrink: 0;
        }

        .folder-name {
          flex: 1;
          font-size: 13px;
          color: #606266;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .empty-folder {
        padding: 30px 0;

        :deep(.el-empty__description) {
          font-size: 12px;
        }
      }
    }
  }

  .material-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #fff;

    .material-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: #fff;
      border-bottom: 1px solid #ebeef5;

      .toolbar-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      :deep(.el-button) {
        font-size: 13px;
      }
    }

    .material-grid {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      grid-auto-rows: max-content;
      gap: 12px;
      align-content: start;

      .empty-tip {
        grid-column: 1 / -1;
        padding: 60px 0;
      }

      .material-card {
        background: #fff;
        border: 1px solid #ebeef5;
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.25s;

        &:hover {
          border-color: #409eff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

          .thumbnail::after {
            opacity: 1;
          }
        }

        .thumbnail {
          width: 100%;
          height: 100px;
          overflow: hidden;
          position: relative;
          background-color: #f5f5f5;
          background-image:
            linear-gradient(45deg, #e0e0e0 25%, transparent 25%), linear-gradient(-45deg, #e0e0e0 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #e0e0e0 75%), linear-gradient(-45deg, transparent 75%, #e0e0e0 75%);
          background-size: 12px 12px;
          background-position:
            0 0,
            0 6px,
            6px -6px,
            -6px 0;

          &::after {
            content: "选择";
            position: absolute;
            inset: 0;
            background: rgba(64, 158, 255, 0.85);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            font-weight: 500;
            opacity: 0;
            transition: opacity 0.25s;
          }

          img,
          video {
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
          }
        }

        .material-info {
          padding: 8px 10px;
          background: #fafafa;
          border-top: 1px solid #ebeef5;

          .name {
            font-size: 12px;
            color: #606266;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.4;
          }

          .meta {
            font-size: 11px;
            color: #909399;
            margin-top: 2px;
          }
        }
      }
    }

    .pagination {
      padding: 10px 16px;
      border-top: 1px solid #ebeef5;
      background: #fafafa;
      display: flex;
      justify-content: center;

      :deep(.el-pagination) {
        --el-pagination-font-size: 12px;
      }
    }
  }
}
</style>
