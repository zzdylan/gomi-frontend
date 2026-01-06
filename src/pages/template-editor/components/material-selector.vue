<script setup lang="ts">
import type { MaterialFolderItem, MaterialItem } from "@/pages/material/apis/type"
import { Folder, Upload } from "@element-plus/icons-vue"
import MaterialUpload from "@/components/MaterialUpload.vue"
import { getMaterialFolderListApi, getMaterialListApi } from "@/pages/material/apis"

const emit = defineEmits<{
  select: [url: string]
  close: []
}>()

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
const filterType = ref("image") // 默认只显示图片

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
    const params: any = {
      folder_id: currentFolderId.value,
      page: currentPage.value,
      per_page: pageSize.value,
      type: filterType.value
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
  emit("select", material.url)
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
        >
          <div class="folder-content" @dblclick="enterFolder(folder)">
            <el-icon><Folder /></el-icon>
            <span>{{ folder.name }}</span>
            <el-tag size="small" type="info" class="enter-hint">
              双击进入
            </el-tag>
          </div>
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
        <el-select
          v-model="filterType"
          placeholder="素材类型"
          size="default"
          style="width: 120px"
          @change="handleTypeChange"
        >
          <el-option label="图片" value="image" />
          <el-option label="视频" value="video" />
        </el-select>

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
          <!-- 缩略图 -->
          <div class="thumbnail">
            <img v-if="material.type === 'image'" :src="material.url" :alt="material.original_name">
            <video v-else :src="material.url" preload="metadata" />
          </div>

          <!-- 信息 -->
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
  height: 600px;
  background: #fff;

  // 左侧文件夹侧边栏
  .folder-sidebar {
    width: 260px;
    border-right: 1px solid #e4e7ed;
    display: flex;
    flex-direction: column;
    background: #fff;

    .folder-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #e4e7ed;

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }
    }

    .breadcrumb-nav {
      padding: 12px 16px;
      background: #f5f7fa;
      border-bottom: 1px solid #e4e7ed;

      :deep(.el-breadcrumb__item) {
        .el-breadcrumb__inner {
          font-weight: normal;
        }

        &.clickable {
          .el-breadcrumb__inner {
            cursor: pointer;
            color: #409eff;

            &:hover {
              text-decoration: underline;
            }
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
        justify-content: space-between;
        padding: 10px 12px;
        margin-bottom: 4px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          background: #f5f7fa;
        }

        .folder-content {
          display: flex;
          align-items: center;
          flex: 1;
          gap: 8px;

          .el-icon {
            font-size: 16px;
          }

          .enter-hint {
            margin-left: auto;
            font-size: 12px;
            opacity: 0;
            transition: opacity 0.3s;
          }
        }

        &:hover .enter-hint {
          opacity: 1;
        }
      }

      .empty-folder {
        padding: 40px 0;
      }
    }
  }

  // 右侧素材区域
  .material-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .material-toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      background: #fff;
      border-bottom: 1px solid #e4e7ed;
    }

    .material-grid {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      grid-auto-rows: max-content;
      gap: 12px;
      align-content: start;

      .empty-tip {
        grid-column: 1 / -1;
        padding: 40px 0;
      }

      .material-card {
        background: #fff;
        border: 2px solid #e4e7ed;
        border-radius: 6px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.2s;
        height: fit-content;

        &:hover {
          border-color: #409eff;
          box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
        }

        .thumbnail {
          width: 100%;
          height: 150px;
          overflow: hidden;
          background: #f5f7fa;
          position: relative;

          img,
          video {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }
        }

        .material-info {
          padding: 8px;

          .name {
            font-size: 12px;
            color: #303133;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-bottom: 4px;
          }

          .meta {
            font-size: 11px;
            color: #909399;
          }
        }
      }
    }

    .pagination {
      padding: 12px 16px;
      border-top: 1px solid #e4e7ed;
      display: flex;
      justify-content: center;
    }
  }
}
</style>
