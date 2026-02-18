<script lang="ts" setup>
import type { CompositionFolderItem, CompositionItem, CompositionSourceType, CompositionType } from "./apis/type"
import { Back, Check, Delete, Edit, Folder, FolderOpened, Plus, Refresh, Search, VideoPlay } from "@element-plus/icons-vue"
import {
  batchDeleteCompositionApi,
  createCompositionFolderApi,
  deleteCompositionFolderApi,
  getCompositionFolderListApi,
  getCompositionListApi,
  moveCompositionApi,
  updateCompositionFolderApi
} from "./apis"

defineOptions({
  name: "CompositionLibrary"
})

// ==================== 文件夹导航 ====================
interface BreadcrumbItem {
  id: number
  name: string
}

const breadcrumbs = ref<BreadcrumbItem[]>([{ id: 0, name: "全部作品" }])
const currentFolderId = computed(() => breadcrumbs.value[breadcrumbs.value.length - 1].id)

function enterFolder(folder: CompositionFolderItem) {
  breadcrumbs.value.push({ id: folder.id, name: folder.name })
  loadFolders(folder.id)
  currentPage.value = 1
  loadCompositions()
}

function navigateToFolder(index: number) {
  breadcrumbs.value = breadcrumbs.value.slice(0, index + 1)
  loadFolders(currentFolderId.value)
  currentPage.value = 1
  loadCompositions()
}

function goBack() {
  if (breadcrumbs.value.length > 1) {
    breadcrumbs.value.pop()
    loadFolders(currentFolderId.value)
    currentPage.value = 1
    loadCompositions()
  }
}

// ==================== 文件夹管理 ====================
const folders = ref<CompositionFolderItem[]>([])
const loadingFolders = ref(false)
const folderDialogVisible = ref(false)
const folderDialogTitle = ref("")
const folderForm = reactive({
  id: 0,
  name: "",
  parent_id: 0
})

async function loadFolders(parentId: number = 0) {
  loadingFolders.value = true
  try {
    const { data } = await getCompositionFolderListApi({ parent_id: parentId })
    folders.value = data.folders
  } catch (error) {
    console.error("加载文件夹失败:", error)
  } finally {
    loadingFolders.value = false
  }
}

async function handleFolderSave() {
  if (!folderForm.name.trim()) {
    ElMessage.warning("请输入文件夹名称")
    return
  }

  try {
    if (folderForm.id) {
      await updateCompositionFolderApi(folderForm.id, {
        name: folderForm.name,
        parent_id: folderForm.parent_id
      })
      ElMessage.success("文件夹更新成功")
    } else {
      await createCompositionFolderApi({
        name: folderForm.name,
        parent_id: currentFolderId.value
      })
      ElMessage.success("文件夹创建成功")
    }
    folderDialogVisible.value = false
    loadFolders(currentFolderId.value)
  } catch (error) {
    console.error("保存文件夹失败:", error)
  }
}

function showCreateFolderDialog() {
  folderDialogTitle.value = "创建文件夹"
  folderForm.id = 0
  folderForm.name = ""
  folderForm.parent_id = currentFolderId.value
  folderDialogVisible.value = true
}

function showEditFolderDialog(folder: CompositionFolderItem) {
  folderDialogTitle.value = "重命名文件夹"
  folderForm.id = folder.id
  folderForm.name = folder.name
  folderForm.parent_id = folder.parent_id
  folderDialogVisible.value = true
}

function handleDeleteFolder(folder: CompositionFolderItem) {
  ElMessageBox.confirm(`确定删除文件夹"${folder.name}"吗？`, "提示", {
    type: "warning",
    confirmButtonText: "确定",
    cancelButtonText: "取消"
  }).then(async () => {
    await deleteCompositionFolderApi(folder.id)
    ElMessage.success("删除成功")
    loadFolders(currentFolderId.value)
  }).catch(() => {})
}

// ==================== 作品管理 ====================
const compositions = ref<CompositionItem[]>([])
const loadingCompositions = ref(false)
const compositionType = ref<CompositionType | "">("")
const sourceType = ref<CompositionSourceType | "">("")
const searchName = ref("")
const selectedCompositions = ref<CompositionItem[]>([])
const previewDialogVisible = ref(false)
const previewComposition = ref<CompositionItem | null>(null)

// 分页数据
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

async function loadCompositions() {
  loadingCompositions.value = true
  try {
    const params: any = {
      folder_id: currentFolderId.value,
      page: currentPage.value,
      per_page: pageSize.value
    }
    if (compositionType.value) {
      params.type = compositionType.value
    }
    if (sourceType.value) {
      params.source_type = sourceType.value
    }
    if (searchName.value.trim()) {
      params.name = searchName.value.trim()
    }
    const { data } = await getCompositionListApi(params)
    compositions.value = data.compositions || []
    if (data.paging) {
      total.value = data.paging.total_count
      currentPage.value = data.paging.current_page
    }
  } catch (error) {
    console.error("加载作品失败:", error)
  } finally {
    loadingCompositions.value = false
  }
}

function handlePageChange(page: number) {
  currentPage.value = page
  loadCompositions()
}

function handleFilterChange() {
  currentPage.value = 1
  loadCompositions()
}

function handleSearch() {
  currentPage.value = 1
  loadCompositions()
}

// 预览作品
function handlePreview(item: CompositionItem) {
  previewComposition.value = item
  previewDialogVisible.value = true
}

// 批量删除作品
function handleBatchDelete() {
  if (selectedCompositions.value.length === 0) {
    ElMessage.warning("请选择要删除的作品")
    return
  }

  ElMessageBox.confirm(`确定删除选中的 ${selectedCompositions.value.length} 个作品吗？`, "提示", {
    type: "warning"
  }).then(async () => {
    const ids = selectedCompositions.value.map(m => m.id)
    await batchDeleteCompositionApi({ ids })
    ElMessage.success("删除成功")
    selectedCompositions.value = []
    loadCompositions()
  }).catch(() => {})
}

// 移动作品
const moveDialogVisible = ref(false)
const moveTargetFolderId = ref<number>(0)
const allFolders = ref<CompositionFolderItem[]>([])

async function loadAllFolders() {
  try {
    const { data } = await getCompositionFolderListApi({ parent_id: 0 })
    allFolders.value = data.folders
  } catch (error) {
    console.error("加载文件夹失败:", error)
  }
}

function handleShowMoveDialog() {
  if (selectedCompositions.value.length === 0) {
    ElMessage.warning("请选择要移动的作品")
    return
  }
  moveTargetFolderId.value = 0
  loadAllFolders()
  moveDialogVisible.value = true
}

async function handleMoveSubmit() {
  const ids = selectedCompositions.value.map(m => m.id)
  await moveCompositionApi({ ids, folder_id: moveTargetFolderId.value })
  ElMessage.success("移动成功")
  moveDialogVisible.value = false
  selectedCompositions.value = []
  loadCompositions()
}

// 选择/取消选择作品
function handleSelectComposition(item: CompositionItem) {
  const index = selectedCompositions.value.findIndex(m => m.id === item.id)
  if (index > -1) {
    selectedCompositions.value.splice(index, 1)
  } else {
    selectedCompositions.value.push(item)
  }
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return "-"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`
}

// 格式化时长（毫秒 -> mm:ss 或 hh:mm:ss）
function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return "-"
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}

// 来源类型中文映射
function getSourceLabel(source: string): string {
  const map: Record<string, string> = {
    xunclip: "讯剪",
    imagetext: "图文"
  }
  return map[source] || source
}

// 初始化
onMounted(() => {
  loadFolders(0)
  loadCompositions()
})
</script>

<template>
  <div class="composition-library">
    <!-- 左侧文件夹 -->
    <div class="folder-sidebar">
      <div class="folder-header">
        <h3>文件夹</h3>
        <el-button size="small" type="primary" @click="showCreateFolderDialog">
          <el-icon><Plus /></el-icon>
        </el-button>
      </div>

      <!-- 面包屑导航 -->
      <div class="breadcrumb-nav">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item
            v-for="(item, index) in breadcrumbs"
            :key="item.id"
            @click="navigateToFolder(index)"
            :class="{ clickable: index < breadcrumbs.length - 1 }"
          >
            {{ item.name }}
          </el-breadcrumb-item>
        </el-breadcrumb>
        <el-button
          v-if="breadcrumbs.length > 1"
          link
          size="small"
          @click="goBack"
          class="back-btn"
        >
          <el-icon><Back /></el-icon>
          返回上一级
        </el-button>
      </div>

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
          <div class="folder-actions" @click.stop>
            <el-button link size="small" @click="showEditFolderDialog(folder)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button link size="small" type="danger" @click="handleDeleteFolder(folder)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>

        <div v-if="folders.length === 0 && !loadingFolders" class="empty-folder">
          <el-empty description="当前目录下没有文件夹" :image-size="80" />
        </div>
      </div>
    </div>

    <!-- 右侧作品区域 -->
    <div class="composition-content">
      <!-- 工具栏 -->
      <div class="composition-toolbar">
        <div class="toolbar-left">
          <el-button @click="handleBatchDelete">
            <el-icon><Delete /></el-icon>
            批量删除
          </el-button>
          <el-button @click="handleShowMoveDialog">
            <el-icon><FolderOpened /></el-icon>
            移动到
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-input
            v-model="searchName"
            placeholder="搜索作品名称"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-select
            v-model="compositionType"
            placeholder="全部类型"
            clearable
            style="width: 120px"
            @change="handleFilterChange"
          >
            <el-option label="视频" value="video" />
            <el-option label="图文" value="image_text" />
          </el-select>
          <el-select
            v-model="sourceType"
            placeholder="全部来源"
            clearable
            style="width: 120px"
            @change="handleFilterChange"
          >
            <el-option label="讯剪" value="xunclip" />
            <el-option label="图文" value="imagetext" />
          </el-select>
          <el-button @click="loadCompositions">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
          <span class="selected-count">已选择: {{ selectedCompositions.length }} 个</span>
        </div>
      </div>

      <!-- 作品网格 -->
      <div v-loading="loadingCompositions" class="composition-grid">
        <div v-if="compositions.length === 0" class="empty-state">
          <el-empty description="暂无作品" />
        </div>

        <div
          v-for="item in compositions"
          :key="item.id"
          class="composition-card"
          :class="{ selected: selectedCompositions.some(m => m.id === item.id) }"
        >
          <!-- 预览区域 -->
          <div class="composition-preview" @click="handlePreview(item)">
            <img v-if="item.cover_url" :src="item.cover_url" :alt="item.name" crossorigin="anonymous">
            <div v-else class="no-cover">
              <el-icon :size="32">
                <VideoPlay />
              </el-icon>
            </div>
            <div class="composition-type-badge">
              {{ item.type === "video" ? "视频" : "图文" }}
            </div>
            <div v-if="item.duration" class="composition-duration-badge">
              {{ formatDuration(item.duration) }}
            </div>
          </div>

          <!-- 信息区域 -->
          <div class="composition-info" @click="handleSelectComposition(item)">
            <div class="composition-name" :title="item.name">
              {{ item.name }}
            </div>
            <div class="composition-meta">
              <span v-if="item.width && item.height">{{ item.width }}x{{ item.height }}</span>
              <span>{{ formatFileSize(item.file_size) }}</span>
              <el-tag size="small" type="info">
                {{ getSourceLabel(item.source_type) }}
              </el-tag>
            </div>
          </div>

          <!-- 选中标记 -->
          <div v-if="selectedCompositions.some(m => m.id === item.id)" class="selected-mark">
            <el-icon><Check /></el-icon>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next, jumper"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 创建/编辑文件夹对话框 -->
    <el-dialog v-model="folderDialogVisible" :title="folderDialogTitle" width="400px">
      <el-form>
        <el-form-item label="文件夹名称">
          <el-input v-model="folderForm.name" placeholder="请输入文件夹名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="folderDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="handleFolderSave">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 移动对话框 -->
    <el-dialog v-model="moveDialogVisible" title="移动到文件夹" width="400px">
      <el-form>
        <el-form-item label="目标文件夹">
          <el-select v-model="moveTargetFolderId" placeholder="请选择目标文件夹">
            <el-option label="根目录" :value="0" />
            <el-option
              v-for="folder in allFolders"
              :key="folder.id"
              :label="folder.name"
              :value="folder.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="moveDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="handleMoveSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 预览对话框 -->
    <el-dialog v-model="previewDialogVisible" :title="previewComposition?.name" class="preview-dialog">
      <div v-if="previewComposition" class="preview-content">
        <div class="preview-media">
          <video
            v-if="previewComposition.type === 'video' && previewComposition.video_url"
            :src="previewComposition.video_url"
            controls
            crossorigin="anonymous"
          />
          <div v-else class="no-preview">
            <el-icon :size="48">
              <VideoPlay />
            </el-icon>
            <p>暂无预览</p>
          </div>
        </div>
        <div class="preview-info">
          <p><strong>作品名称:</strong> {{ previewComposition.name }}</p>
          <p><strong>来源:</strong> {{ getSourceLabel(previewComposition.source_type) }}</p>
          <p v-if="previewComposition.duration">
            <strong>时长:</strong> {{ formatDuration(previewComposition.duration) }}
          </p>
          <p v-if="previewComposition.width && previewComposition.height">
            <strong>分辨率:</strong> {{ previewComposition.width }}x{{ previewComposition.height }}
          </p>
          <p v-if="previewComposition.file_size">
            <strong>文件大小:</strong> {{ formatFileSize(previewComposition.file_size) }}
          </p>
          <p v-if="previewComposition.bitrate">
            <strong>码率:</strong> {{ previewComposition.bitrate }}
          </p>
          <p v-if="previewComposition.word_text">
            <strong>文案:</strong> {{ previewComposition.word_text }}
          </p>
          <p><strong>创建时间:</strong> {{ previewComposition.created_at }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style lang="scss">
.preview-dialog {
  .el-dialog {
    width: auto !important;
    max-width: 90vw;
    min-width: 320px;
  }
}
</style>

<style lang="scss" scoped>
.composition-library {
  display: flex;
  height: calc(100vh - 120px);
  background: #f0f2f5;
  border-radius: 8px;
  overflow: hidden;
  margin: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.folder-sidebar {
  width: 220px;
  background: #fff;
  border-right: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;

  .folder-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
    border-bottom: 1px solid #ebeef5;

    h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }

    :deep(.el-button) {
      padding: 6px;
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

    .back-btn {
      margin-top: 6px;
      font-size: 12px;
      color: #909399;
    }
  }

  .folder-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }

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

      .folder-actions {
        opacity: 1;
      }
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

    .folder-actions {
      display: flex;
      gap: 2px;
      opacity: 0;
      transition: opacity 0.2s;
      flex-shrink: 0;

      :deep(.el-button) {
        padding: 4px;
      }
    }
  }

  .empty-folder {
    padding: 30px 0;

    :deep(.el-empty__description) {
      font-size: 12px;
    }
  }
}

.composition-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;

  .composition-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #fff;
    border-bottom: 1px solid #ebeef5;

    .toolbar-left {
      display: flex;
      gap: 8px;

      :deep(.el-button) {
        font-size: 13px;
      }
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 12px;

      .selected-count {
        color: #909399;
        font-size: 13px;
        white-space: nowrap;
        padding: 0 8px;
        background: #f5f7fa;
        border-radius: 4px;
        line-height: 28px;
      }

      :deep(.el-button) {
        font-size: 13px;
      }
    }
  }

  .composition-grid {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    grid-auto-rows: max-content;
    gap: 12px;
    align-content: start;
    background: #fafafa;

    .empty-state {
      grid-column: 1 / -1;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 300px;
    }
  }

  .pagination-container {
    padding: 10px 16px;
    background: #fff;
    border-top: 1px solid #ebeef5;
    display: flex;
    justify-content: center;

    :deep(.el-pagination) {
      --el-pagination-font-size: 13px;
    }
  }
}

.composition-card {
  position: relative;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.25s;
  height: fit-content;

  &:hover {
    border-color: #409eff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

    .composition-preview::after {
      opacity: 1;
    }
  }

  &.selected {
    border-color: #409eff;
    border-width: 2px;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.25);
  }

  .composition-preview {
    width: 100%;
    height: 140px;
    overflow: hidden;
    position: relative;
    cursor: pointer;
    background: #1a1a2e;

    &::after {
      content: "预览";
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 500;
      opacity: 0;
      transition: opacity 0.25s;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .no-cover {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #606266;
      background: #f5f5f5;
    }

    .composition-type-badge {
      position: absolute;
      top: 6px;
      left: 6px;
      padding: 2px 6px;
      background: rgba(0, 0, 0, 0.65);
      color: #fff;
      font-size: 11px;
      border-radius: 3px;
      z-index: 1;
    }

    .composition-duration-badge {
      position: absolute;
      bottom: 6px;
      right: 6px;
      padding: 2px 6px;
      background: rgba(0, 0, 0, 0.65);
      color: #fff;
      font-size: 11px;
      border-radius: 3px;
      z-index: 1;
    }
  }

  .composition-info {
    padding: 8px 10px;
    cursor: pointer;
    background: #fafafa;
    border-top: 1px solid #ebeef5;
    transition: background 0.2s;

    &:hover {
      background: #f0f7ff;
    }

    .composition-name {
      font-size: 12px;
      color: #606266;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.4;
    }

    .composition-meta {
      display: flex;
      gap: 6px;
      align-items: center;
      font-size: 11px;
      color: #909399;
      margin-top: 4px;

      .el-tag {
        height: 18px;
        line-height: 16px;
        font-size: 10px;
      }
    }
  }

  .selected-mark {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 20px;
    height: 20px;
    background: #409eff;
    color: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    z-index: 2;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
}

.preview-content {
  .preview-media {
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: auto;
    background: #1a1a2e;
    border-radius: 8px;
    padding: 16px;
    min-height: 200px;

    video {
      max-width: 80vw;
      max-height: 60vh;
      width: auto;
      height: auto;
      object-fit: contain;
      border-radius: 4px;
    }

    .no-preview {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      color: #909399;

      p {
        margin: 0;
        font-size: 13px;
      }
    }
  }

  .preview-info {
    margin-top: 16px;
    padding: 16px;
    background: #fafafa;
    border-radius: 8px;

    p {
      margin: 6px 0;
      font-size: 13px;
      color: #606266;
      display: flex;
      gap: 8px;

      strong {
        color: #303133;
        min-width: 70px;
        flex-shrink: 0;
      }
    }
  }
}
</style>
