<script lang="ts" setup>
import type { UploadFile, UploadFiles, UploadInstance } from "element-plus"
import type { MaterialFolderItem, MaterialItem, MaterialType } from "./apis/type"
import {
  batchDeleteMaterialApi,
  batchUploadMaterialApi,
  createMaterialFolderApi,
  deleteMaterialFolderApi,
  getMaterialFolderListApi,
  getMaterialListApi,
  moveMaterialApi,
  updateMaterialFolderApi,
  uploadMaterialApi
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
    try {
      await deleteMaterialFolderApi(folder.id)
      ElMessage.success("删除成功")
      loadFolders(currentFolderId.value)
    } catch (error: any) {
      ElMessage.error(error.message || "删除失败")
    }
  })
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
const uploadRef = useTemplateRef<UploadInstance>("uploadRef")
const uploadDialogVisible = ref(false)
const uploadFileList = ref<UploadFiles>([])
const uploadProgress = ref(0)
const isUploading = ref(false)
const uploadStatus = ref("")

function handleUploadChange(file: UploadFile, files: UploadFiles) {
  uploadFileList.value = files
}

function handleUploadRemove(file: UploadFile) {
  uploadFileList.value = uploadFileList.value.filter(f => f.uid !== file.uid)
}

async function handleUploadSubmit() {
  if (uploadFileList.value.length === 0) {
    ElMessage.warning("请选择要上传的文件")
    return
  }

  isUploading.value = true
  uploadProgress.value = 0
  uploadStatus.value = "上传中..."

  const formData = new FormData()

  if (uploadFileList.value.length === 1) {
    // 单文件上传
    formData.append("file", uploadFileList.value[0].raw as File)
    formData.append("folder_id", currentFolderId.value.toString())

    try {
      await uploadMaterialApi(formData, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100)
          uploadProgress.value = percent
          uploadStatus.value = percent >= 100 ? "处理中..." : `上传中... ${percent}%`
        }
      })
      ElMessage.success("上传成功")
      uploadDialogVisible.value = false
      uploadFileList.value = []
      uploadProgress.value = 0
      uploadStatus.value = ""
      loadMaterials()
    } catch (error) {
      console.error("上传失败:", error)
      uploadStatus.value = "上传失败"
    } finally {
      isUploading.value = false
    }
  } else {
    // 批量上传
    uploadFileList.value.forEach((file) => {
      formData.append("files", file.raw as File)
    })
    formData.append("folder_id", currentFolderId.value.toString())

    try {
      const { data } = await batchUploadMaterialApi(formData, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100)
          uploadProgress.value = percent
          uploadStatus.value = percent >= 100 ? "处理中..." : `上传中... ${percent}%`
        }
      })
      ElMessage.success(`批量上传完成：成功 ${data.success_count} 个，失败 ${data.failed_count} 个`)
      uploadDialogVisible.value = false
      uploadFileList.value = []
      uploadProgress.value = 0
      uploadStatus.value = ""
      loadMaterials()
    } catch (error) {
      console.error("批量上传失败:", error)
      uploadStatus.value = "上传失败"
    } finally {
      isUploading.value = false
    }
  }
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
    try {
      const ids = selectedMaterials.value.map(m => m.id)
      await batchDeleteMaterialApi({ ids })
      ElMessage.success("删除成功")
      selectedMaterials.value = []
      loadMaterials()
    } catch (error: any) {
      ElMessage.error(error.message || "删除失败")
    }
  })
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
  try {
    const ids = selectedMaterials.value.map(m => m.id)
    await moveMaterialApi({ ids, folder_id: moveTargetFolderId.value })
    ElMessage.success("移动成功")
    moveDialogVisible.value = false
    selectedMaterials.value = []
    loadMaterials()
  } catch (error: any) {
    ElMessage.error(error.message || "移动失败")
  }
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
        >
          <div class="folder-content" @dblclick="enterFolder(folder)">
            <el-icon><Folder /></el-icon>
            <span>{{ folder.name }}</span>
            <el-tag size="small" type="info" class="enter-hint">
              双击进入
            </el-tag>
          </div>
          <div class="folder-actions">
            <el-button link size="small" @click.stop="enterFolder(folder)">
              <el-icon><Right /></el-icon>
            </el-button>
            <el-button link size="small" @click.stop="showEditFolderDialog(folder)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button link size="small" type="danger" @click.stop="handleDeleteFolder(folder)">
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
            <img v-if="material.type === 'image'" :src="material.url" :alt="material.original_name">
            <video v-else-if="material.type === 'video'" :src="material.url" preload="metadata" />
            <div class="material-type-badge">
              {{ material.type === "image" ? "图片" : "视频" }}
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
    <el-dialog v-model="uploadDialogVisible" title="上传素材" width="500px" :close-on-click-modal="!isUploading">
      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        :file-list="uploadFileList"
        :disabled="isUploading"
        accept="image/*,video/*"
        multiple
        drag
        @change="handleUploadChange"
        @remove="handleUploadRemove"
      >
        <el-icon class="el-icon--upload">
          <upload-filled />
        </el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持图片和视频文件，可多选
          </div>
        </template>
      </el-upload>

      <!-- 上传进度条 -->
      <div v-if="isUploading" style="margin-top: 16px;">
        <div style="margin-bottom: 8px; color: #606266; font-size: 14px;">
          {{ uploadStatus }}
        </div>
        <el-progress
          :percentage="uploadProgress"
          :status="uploadProgress === 100 ? undefined : undefined"
        />
      </div>

      <template #footer>
        <el-button @click="uploadDialogVisible = false" :disabled="isUploading">
          取消
        </el-button>
        <el-button type="primary" @click="handleUploadSubmit" :loading="isUploading">
          {{ isUploading ? uploadStatus : '确定上传' }}
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
    <el-dialog v-model="previewDialogVisible" :title="previewMaterial?.original_name" width="70%">
      <div v-if="previewMaterial" class="preview-content">
        <div class="preview-media">
          <img
            v-if="previewMaterial.type === 'image'"
            :src="previewMaterial.url"
            :alt="previewMaterial.original_name"
          >
          <video
            v-else-if="previewMaterial.type === 'video'"
            :src="previewMaterial.url"
            controls
          />
        </div>
        <div class="preview-info">
          <p><strong>文件名:</strong> {{ previewMaterial.original_name }}</p>
          <p><strong>大小:</strong> {{ formatFileSize(previewMaterial.size) }}</p>
          <p><strong>类型:</strong> {{ previewMaterial.mime_type }}</p>
          <p v-if="previewMaterial.width && previewMaterial.height">
            <strong>尺寸:</strong> {{ previewMaterial.width }}x{{ previewMaterial.height }}
          </p>
          <p><strong>上传时间:</strong> {{ previewMaterial.created_at }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.material-library {
  display: flex;
  height: calc(100vh - 120px);
  background: #f5f7fa;
}

.folder-sidebar {
  width: 280px;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;

  .folder-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #e4e7ed;

    h3 {
      margin: 0;
      font-size: 16px;
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

    .back-btn {
      margin-top: 8px;
      display: flex;
      align-items: center;
      gap: 4px;
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

    .folder-actions {
      display: none;
      gap: 4px;
    }

    &:hover .folder-actions {
      display: flex;
    }
  }

  .empty-folder {
    padding: 40px 0;
  }
}

.material-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .material-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: #fff;
    border-bottom: 1px solid #e4e7ed;

    .toolbar-left {
      display: flex;
      gap: 8px;
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 16px;

      .selected-count {
        color: #606266;
        font-size: 14px;
        white-space: nowrap;
      }
    }
  }

  .material-grid {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    grid-auto-rows: max-content;
    gap: 16px;
    align-content: start;

    .empty-state {
      grid-column: 1 / -1;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
    }
  }

  .pagination-container {
    padding: 16px;
    background: #fff;
    border-top: 1px solid #e4e7ed;
    display: flex;
    justify-content: center;
  }
}

.material-card {
  position: relative;
  background: #fff;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
  height: fit-content;

  &:hover {
    border-color: #409eff;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
  }

  &.selected {
    border-color: #409eff;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
  }

  .material-preview {
    width: 100%;
    height: 200px;
    overflow: hidden;
    background: #f5f7fa;
    position: relative;
    cursor: pointer;

    img,
    video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .material-type-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      padding: 4px 8px;
      background: rgba(0, 0, 0, 0.7);
      color: #fff;
      font-size: 12px;
      border-radius: 4px;
    }
  }

  .material-info {
    padding: 12px;
    cursor: pointer;

    .material-name {
      font-size: 14px;
      color: #303133;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 8px;
    }

    .material-meta {
      display: flex;
      gap: 12px;
      font-size: 12px;
      color: #909399;
    }
  }

  .selected-mark {
    position: absolute;
    top: 8px;
    left: 8px;
    width: 24px;
    height: 24px;
    background: #409eff;
    color: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }
}

.preview-content {
  .preview-media {
    display: flex;
    justify-content: center;
    align-items: center;
    max-height: 50vh;
    overflow: auto;

    img,
    video {
      max-width: 100%;
      max-height: 50vh;
      width: auto;
      height: auto;
      object-fit: contain;
    }
  }

  .preview-info {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e4e7ed;

    p {
      margin: 8px 0;
      font-size: 14px;
      color: #606266;
    }
  }
}
</style>
