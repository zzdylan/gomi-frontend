<script lang="ts" setup>
import type { MaterialFolderItem, MaterialItem, MaterialType } from "./apis/type"
import { Back, Check, Delete, Edit, Folder, FolderOpened, Plus, Refresh, Upload } from "@element-plus/icons-vue"
import MaterialUpload from "@/common/components/MaterialUpload/index.vue"
import {
  batchDeleteMaterialApi,
  createMaterialFolderApi,
  deleteMaterialFolderApi,
  getMaterialFolderListApi,
  getMaterialListApi,
  moveMaterialApi,
  updateMaterialFolderApi
} from "./apis"

defineOptions({
  name: "MaterialLibrary"
})

// ==================== 文件夹导航 ====================
interface BreadcrumbItem {
  id: number
  name: string
}

const breadcrumbs = ref<BreadcrumbItem[]>([{ id: 0, name: "全部素材" }])
const currentFolderId = computed(() => breadcrumbs.value[breadcrumbs.value.length - 1].id)

// 进入文件夹
function enterFolder(folder: MaterialFolderItem) {
  breadcrumbs.value.push({ id: folder.id, name: folder.name })
  loadFolders(folder.id)
  currentPage.value = 1 // 重置到第一页
  loadMaterials()
}

// 通过面包屑导航
function navigateToFolder(index: number) {
  breadcrumbs.value = breadcrumbs.value.slice(0, index + 1)
  loadFolders(currentFolderId.value)
  currentPage.value = 1 // 重置到第一页
  loadMaterials()
}

// 返回上一级
function goBack() {
  if (breadcrumbs.value.length > 1) {
    breadcrumbs.value.pop()
    loadFolders(currentFolderId.value)
    currentPage.value = 1 // 重置到第一页
    loadMaterials()
  }
}

// ==================== 文件夹管理 ====================
const folders = ref<MaterialFolderItem[]>([])
const loadingFolders = ref(false)
const folderDialogVisible = ref(false)
const folderDialogTitle = ref("")
const folderForm = reactive({
  id: 0,
  name: "",
  parent_id: 0
})

// 加载文件夹列表
async function loadFolders(parentId: number = 0) {
  loadingFolders.value = true
  try {
    const { data } = await getMaterialFolderListApi({ parent_id: parentId })
    folders.value = data.folders
  } catch (error) {
    console.error("加载文件夹失败:", error)
  } finally {
    loadingFolders.value = false
  }
}

// 创建/编辑文件夹
async function handleFolderSave() {
  if (!folderForm.name.trim()) {
    ElMessage.warning("请输入文件夹名称")
    return
  }

  try {
    if (folderForm.id) {
      await updateMaterialFolderApi(folderForm.id, {
        name: folderForm.name,
        parent_id: folderForm.parent_id
      })
      ElMessage.success("文件夹更新成功")
    } else {
      await createMaterialFolderApi({
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

// 显示创建文件夹对话框
function showCreateFolderDialog() {
  folderDialogTitle.value = "创建文件夹"
  folderForm.id = 0
  folderForm.name = ""
  folderForm.parent_id = currentFolderId.value
  folderDialogVisible.value = true
}

// 显示编辑文件夹对话框
function showEditFolderDialog(folder: MaterialFolderItem) {
  folderDialogTitle.value = "重命名文件夹"
  folderForm.id = folder.id
  folderForm.name = folder.name
  folderForm.parent_id = folder.parent_id
  folderDialogVisible.value = true
}

// 删除文件夹
function handleDeleteFolder(folder: MaterialFolderItem) {
  ElMessageBox.confirm(`确定删除文件夹"${folder.name}"吗？`, "提示", {
    type: "warning",
    confirmButtonText: "确定",
    cancelButtonText: "取消"
  }).then(async () => {
    await deleteMaterialFolderApi(folder.id)
    ElMessage.success("删除成功")
    loadFolders(currentFolderId.value)
  }).catch(() => {})
}

// ==================== 素材管理 ====================
const materials = ref<MaterialItem[]>([])
const loadingMaterials = ref(false)
const materialType = ref<MaterialType | "">("")
const selectedMaterials = ref<MaterialItem[]>([])
const previewDialogVisible = ref(false)
const previewMaterial = ref<MaterialItem | null>(null)

// 分页数据
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 加载素材列表
async function loadMaterials() {
  loadingMaterials.value = true
  try {
    const params: any = {
      folder_id: currentFolderId.value,
      page: currentPage.value,
      per_page: pageSize.value
    }
    if (materialType.value) {
      params.type = materialType.value
    }
    const { data } = await getMaterialListApi(params)
    materials.value = data.materials
    if (data.paging) {
      total.value = data.paging.total_count
      currentPage.value = data.paging.current_page
    }
  } catch (error) {
    console.error("加载素材失败:", error)
  } finally {
    loadingMaterials.value = false
  }
}

// 切换页码
function handlePageChange(page: number) {
  currentPage.value = page
  loadMaterials()
}

// 切换类型筛选
function handleTypeChange() {
  currentPage.value = 1 // 重置到第一页
  loadMaterials()
}

// 上传素材
const uploadDialogVisible = ref(false)

function handleUploadSuccess() {
  loadMaterials()
}

// 预览素材
function handlePreview(material: MaterialItem) {
  previewMaterial.value = material
  previewDialogVisible.value = true
}

// 批量删除素材
function handleBatchDelete() {
  if (selectedMaterials.value.length === 0) {
    ElMessage.warning("请选择要删除的素材")
    return
  }

  ElMessageBox.confirm(`确定删除选中的 ${selectedMaterials.value.length} 个素材吗？`, "提示", {
    type: "warning"
  }).then(async () => {
    const ids = selectedMaterials.value.map(m => m.id)
    await batchDeleteMaterialApi({ ids })
    ElMessage.success("删除成功")
    selectedMaterials.value = []
    loadMaterials()
  }).catch(() => {})
}

// 移动素材
const moveDialogVisible = ref(false)
const moveTargetFolderId = ref<number>(0)
const allFolders = ref<MaterialFolderItem[]>([])

// 加载所有文件夹（用于移动对话框）
async function loadAllFolders() {
  try {
    // 这里简化处理，只加载根目录文件夹
    // 如果需要完整的树形结构，需要递归加载
    const { data } = await getMaterialFolderListApi({ parent_id: 0 })
    allFolders.value = data.folders
  } catch (error) {
    console.error("加载文件夹失败:", error)
  }
}

function handleShowMoveDialog() {
  if (selectedMaterials.value.length === 0) {
    ElMessage.warning("请选择要移动的素材")
    return
  }
  moveTargetFolderId.value = 0
  loadAllFolders()
  moveDialogVisible.value = true
}

async function handleMoveSubmit() {
  const ids = selectedMaterials.value.map(m => m.id)
  await moveMaterialApi({ ids, folder_id: moveTargetFolderId.value })
  ElMessage.success("移动成功")
  moveDialogVisible.value = false
  selectedMaterials.value = []
  loadMaterials()
}

// 选择/取消选择素材
function handleSelectMaterial(material: MaterialItem) {
  const index = selectedMaterials.value.findIndex(m => m.id === material.id)
  if (index > -1) {
    selectedMaterials.value.splice(index, 1)
  } else {
    selectedMaterials.value.push(material)
  }
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
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

// 初始化
onMounted(() => {
  loadFolders(0)
  loadMaterials()
})
</script>

<template>
  <div class="material-library">
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
        <!-- 文件夹列表 -->
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

    <!-- 右侧素材区域 -->
    <div class="material-content">
      <!-- 工具栏 -->
      <div class="material-toolbar">
        <div class="toolbar-left">
          <el-button type="primary" @click="uploadDialogVisible = true">
            <el-icon><Upload /></el-icon>
            上传素材
          </el-button>
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
          <el-select
            v-model="materialType"
            placeholder="全部类型"
            clearable
            style="width: 120px"
            @change="handleTypeChange"
          >
            <el-option label="图片" value="image" />
            <el-option label="视频" value="video" />
          </el-select>
          <el-button @click="loadMaterials">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
          <span class="selected-count">已选择: {{ selectedMaterials.length }} 个</span>
        </div>
      </div>

      <!-- 素材网格 -->
      <div v-loading="loadingMaterials" class="material-grid">
        <div v-if="materials.length === 0" class="empty-state">
          <el-empty description="暂无素材" />
        </div>

        <div
          v-for="material in materials"
          :key="material.id"
          class="material-card"
          :class="{ selected: selectedMaterials.some(m => m.id === material.id) }"
        >
          <!-- 预览区域 - 点击预览 -->
          <div class="material-preview" @click="handlePreview(material)">
            <img v-if="material.type === 'image'" :src="material.url" :alt="material.original_name" crossorigin="anonymous">
            <video v-else-if="material.type === 'video'" :src="material.url" preload="metadata" crossorigin="anonymous" />
            <div class="material-type-badge">
              {{ material.type === "image" ? "图片" : "视频" }}
            </div>
            <div v-if="material.status === 0" class="material-status-badge">
              处理中
            </div>
          </div>

          <!-- 信息区域 - 点击选中 -->
          <div class="material-info" @click="handleSelectMaterial(material)">
            <div class="material-name" :title="material.original_name">
              {{ material.original_name }}
            </div>
            <div class="material-meta">
              <span>{{ formatFileSize(material.size) }}</span>
              <span v-if="material.width && material.height">
                {{ material.width }}x{{ material.height }}
              </span>
            </div>
          </div>

          <!-- 选中标记 -->
          <div v-if="selectedMaterials.some(m => m.id === material.id)" class="selected-mark">
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

    <!-- 上传对话框 -->
    <MaterialUpload
      v-model:visible="uploadDialogVisible"
      :folder-id="currentFolderId"
      @success="handleUploadSuccess"
    />

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
    <el-dialog v-model="previewDialogVisible" :title="previewMaterial?.original_name" class="preview-dialog">
      <div v-if="previewMaterial" class="preview-content">
        <div class="preview-media">
          <img
            v-if="previewMaterial.type === 'image'"
            :src="previewMaterial.url"
            :alt="previewMaterial.original_name"
            crossorigin="anonymous"
          >
          <video
            v-else-if="previewMaterial.type === 'video'"
            :src="previewMaterial.url"
            controls
            crossorigin="anonymous"
          />
        </div>
        <div class="preview-info">
          <p><strong>文件名:</strong> {{ previewMaterial.original_name }}</p>
          <p><strong>大小:</strong> {{ formatFileSize(previewMaterial.size) }}</p>
          <p><strong>类型:</strong> {{ previewMaterial.mime_type }}</p>
          <p v-if="previewMaterial.width && previewMaterial.height">
            <strong>尺寸:</strong> {{ previewMaterial.width }}x{{ previewMaterial.height }}
          </p>
          <template v-if="previewMaterial.type === 'video'">
            <p v-if="previewMaterial.duration">
              <strong>时长:</strong> {{ formatDuration(previewMaterial.duration) }}
            </p>
            <p v-if="previewMaterial.bitrate">
              <strong>码率:</strong> {{ previewMaterial.bitrate }}
            </p>
          </template>
          <p><strong>上传时间:</strong> {{ previewMaterial.created_at }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style lang="scss">
// 预览对话框样式（不能 scoped，否则 dialog 样式不生效）
.preview-dialog {
  .el-dialog {
    width: auto !important;
    max-width: 90vw;
    min-width: 320px;
  }
}
</style>

<style lang="scss" scoped>
.material-library {
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

.material-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;

  .material-toolbar {
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

  .material-grid {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
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

.material-card {
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

    .material-preview::after {
      opacity: 1;
    }
  }

  &.selected {
    border-color: #409eff;
    border-width: 2px;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.25);
  }

  .material-preview {
    width: 100%;
    height: 120px;
    overflow: hidden;
    position: relative;
    cursor: pointer;
    // 棋盘格背景，用于显示透明图片
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

    img,
    video {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .material-type-badge {
      position: absolute;
      top: 6px;
      right: 6px;
      padding: 2px 6px;
      background: rgba(0, 0, 0, 0.65);
      color: #fff;
      font-size: 11px;
      border-radius: 3px;
      z-index: 1;
    }

    .material-status-badge {
      position: absolute;
      bottom: 6px;
      right: 6px;
      padding: 2px 6px;
      background: #e6a23c;
      color: #fff;
      font-size: 11px;
      border-radius: 3px;
      z-index: 1;
    }
  }

  .material-info {
    padding: 8px 10px;
    cursor: pointer;
    background: #fafafa;
    border-top: 1px solid #ebeef5;
    transition: background 0.2s;

    &:hover {
      background: #f0f7ff;
    }

    .material-name {
      font-size: 12px;
      color: #606266;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.4;
    }

    .material-meta {
      display: flex;
      gap: 8px;
      font-size: 11px;
      color: #909399;
      margin-top: 4px;
    }
  }

  .selected-mark {
    position: absolute;
    top: 6px;
    left: 6px;
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
    background: #f5f5f5;
    border-radius: 8px;
    padding: 16px;

    img,
    video {
      max-width: 80vw;
      max-height: 60vh;
      width: auto;
      height: auto;
      object-fit: contain;
      border-radius: 4px;
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
