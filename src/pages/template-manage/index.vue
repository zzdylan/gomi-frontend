<script lang="ts" setup>
import type { TemplateFolderItem, TemplateItem } from "./apis/type"
import { ArrowLeft, Check, Close, FolderAdd } from "@element-plus/icons-vue"
import { useRouter } from "vue-router"
import {
  batchDeleteTemplateApi,
  createTemplateFolderApi,
  deleteTemplateApi,
  deleteTemplateFolderApi,
  getTemplateFolderListApi,
  getTemplateListApi,
  moveTemplateApi,
  updateTemplateFolderApi
} from "./apis"

defineOptions({
  name: "TemplateManage"
})

const router = useRouter()

// ==================== 视图状态 ====================
const viewMode = ref<"folders" | "templates">("folders") // folders=文件夹列表视图, templates=模板列表视图
const currentFolderId = ref<number | null>(null)
const currentFolderName = ref("")

// 进入文件夹查看模板
function enterFolder(folder: TemplateFolderItem) {
  currentFolderId.value = folder.id
  currentFolderName.value = folder.name
  viewMode.value = "templates"
  currentPage.value = 1
  loadTemplates()
}

// 返回文件夹列表
function backToFolders() {
  viewMode.value = "folders"
  currentFolderId.value = null
  currentFolderName.value = ""
  selectedTemplates.value = []
}

// ==================== 文件夹管理 ====================
const folders = ref<TemplateFolderItem[]>([])
const loadingFolders = ref(false)
const folderDialogVisible = ref(false)
const folderDialogTitle = ref("")
const folderForm = reactive({
  id: 0,
  name: ""
})

// 加载文件夹列表（只加载一级文件夹）
async function loadFolders() {
  loadingFolders.value = true
  try {
    const { data } = await getTemplateFolderListApi({ parent_id: 0 })
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
      await updateTemplateFolderApi(folderForm.id, {
        name: folderForm.name,
        parent_id: 0
      })
      ElMessage.success("文件夹更新成功")
    } else {
      await createTemplateFolderApi({
        name: folderForm.name,
        parent_id: 0
      })
      ElMessage.success("文件夹创建成功")
    }
    folderDialogVisible.value = false
    loadFolders()
  } catch (error) {
    console.error("保存文件夹失败:", error)
  }
}

// 显示创建文件夹对话框
function showCreateFolderDialog() {
  folderDialogTitle.value = "创建文件夹"
  folderForm.id = 0
  folderForm.name = ""
  folderDialogVisible.value = true
}

// 显示编辑文件夹对话框
function showEditFolderDialog(folder: TemplateFolderItem) {
  folderDialogTitle.value = "重命名文件夹"
  folderForm.id = folder.id
  folderForm.name = folder.name
  folderDialogVisible.value = true
}

// 删除文件夹
function handleDeleteFolder(folder: TemplateFolderItem) {
  ElMessageBox.confirm(`确定删除文件夹"${folder.name}"吗？`, "提示", {
    type: "warning",
    confirmButtonText: "确定",
    cancelButtonText: "取消"
  }).then(async () => {
    try {
      await deleteTemplateFolderApi(folder.id)
      ElMessage.success("删除成功")

      // 如果删除的是当前打开的文件夹，返回文件夹列表
      if (currentFolderId.value === folder.id) {
        backToFolders()
      }

      loadFolders()
    } catch (error: any) {
      ElMessage.error(error.message || "删除失败")
    }
  })
}

// ==================== 模板管理 ====================
const templates = ref<TemplateItem[]>([])
const loadingTemplates = ref(false)
const selectedTemplates = ref<TemplateItem[]>([])

// 分页数据
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 加载模板列表（只在模板视图下加载）
async function loadTemplates() {
  if (!currentFolderId.value) return

  loadingTemplates.value = true
  try {
    const params: any = {
      folder_id: currentFolderId.value,
      page: currentPage.value,
      per_page: pageSize.value
    }
    const { data } = await getTemplateListApi(params)
    templates.value = data.templates
    if (data.paging) {
      total.value = data.paging.total_count
      currentPage.value = data.paging.current_page
    }
  } catch (error) {
    console.error("加载模板失败:", error)
  } finally {
    loadingTemplates.value = false
  }
}

// 切换页码
function handlePageChange(page: number) {
  currentPage.value = page
  loadTemplates()
}

// 选择/取消选择模板
function toggleSelection(template: TemplateItem) {
  const index = selectedTemplates.value.findIndex(t => t.id === template.id)
  if (index > -1) {
    selectedTemplates.value.splice(index, 1)
  } else {
    selectedTemplates.value.push(template)
  }
}

// 全选/取消全选
const isAllSelected = computed(() => {
  return templates.value.length > 0 && selectedTemplates.value.length === templates.value.length
})

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedTemplates.value = []
  } else {
    selectedTemplates.value = [...templates.value]
  }
}

// 打开模板编辑器（使用模板）
function openTemplateEditor(template: TemplateItem) {
  router.push({
    name: "TemplateEditor",
    query: {
      templateId: template.id,
      folderId: currentFolderId.value
    }
  })
}

// 新建模板
function createNewTemplate() {
  router.push({
    name: "TemplateEditor",
    query: { folderId: currentFolderId.value }
  })
}

// 删除单个模板
function handleDeleteTemplate(template: TemplateItem) {
  ElMessageBox.confirm(`确定删除模板"${template.name}"吗？`, "提示", {
    type: "warning",
    confirmButtonText: "确定",
    cancelButtonText: "取消"
  }).then(async () => {
    try {
      await deleteTemplateApi(template.id)
      ElMessage.success("删除成功")
      loadTemplates()
    } catch (error: any) {
      ElMessage.error(error.message || "删除失败")
    }
  })
}

// 批量删除模板
function handleBatchDelete() {
  if (selectedTemplates.value.length === 0) {
    ElMessage.warning("请选择要删除的模板")
    return
  }

  ElMessageBox.confirm(`确定删除选中的 ${selectedTemplates.value.length} 个模板吗？`, "提示", {
    type: "warning",
    confirmButtonText: "确定",
    cancelButtonText: "取消"
  }).then(async () => {
    try {
      await batchDeleteTemplateApi({
        ids: selectedTemplates.value.map(t => t.id)
      })
      ElMessage.success("批量删除成功")
      selectedTemplates.value = []
      loadTemplates()
    } catch (error: any) {
      ElMessage.error(error.message || "批量删除失败")
    }
  })
}

// 移动模板
const moveDialogVisible = ref(false)
const targetFolderId = ref<number>(0)
const moveDialogFolders = ref<TemplateFolderItem[]>([])

// 移动对话框中内联新建文件夹
const isCreatingFolderInMove = ref(false)
const newFolderNameInMove = ref("")

async function showMoveDialog() {
  if (selectedTemplates.value.length === 0) {
    ElMessage.warning("请选择要移动的模板")
    return
  }

  // 加载文件夹列表
  await loadAllFolders()

  // 默认选择第一个文件夹（如果有的话）
  if (moveDialogFolders.value.length > 0) {
    targetFolderId.value = moveDialogFolders.value[0].id
  }

  moveDialogVisible.value = true
}

async function loadAllFolders() {
  try {
    const { data } = await getTemplateFolderListApi({ parent_id: 0 })
    moveDialogFolders.value = data.folders
  } catch (error) {
    console.error("加载文件夹失败:", error)
  }
}

async function handleMoveConfirm() {
  if (!targetFolderId.value) {
    ElMessage.warning("请选择目标文件夹")
    return
  }

  try {
    await moveTemplateApi({
      ids: selectedTemplates.value.map(t => t.id),
      folder_id: targetFolderId.value
    })
    ElMessage.success("移动成功")
    moveDialogVisible.value = false
    selectedTemplates.value = []
    loadTemplates()
  } catch (error: any) {
    ElMessage.error(error.message || "移动失败")
  }
}

// 显示移动对话框中的内联创建文件夹输入框
function showInlineFolderInputInMove() {
  isCreatingFolderInMove.value = true
  newFolderNameInMove.value = ""
}

// 取消移动对话框中的内联创建文件夹
function cancelInlineFolderCreationInMove() {
  isCreatingFolderInMove.value = false
  newFolderNameInMove.value = ""
}

// 确认移动对话框中的内联创建文件夹
async function confirmInlineFolderCreationInMove() {
  if (!newFolderNameInMove.value.trim()) {
    ElMessage.warning("请输入文件夹名称")
    return
  }

  try {
    const { data } = await createTemplateFolderApi({
      name: newFolderNameInMove.value,
      parent_id: 0
    })
    ElMessage.success("文件夹创建成功")

    // 重新加载文件夹列表
    await loadAllFolders()

    // 自动选择新创建的文件夹
    targetFolderId.value = data.id

    // 重置状态
    isCreatingFolderInMove.value = false
    newFolderNameInMove.value = ""
  } catch (error: any) {
    ElMessage.error(error.message || "创建文件夹失败")
  }
}

// ==================== 生命周期 ====================
onMounted(() => {
  loadFolders()
})
</script>

<template>
  <div class="template-manage-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <!-- 文件夹视图 -->
        <template v-if="viewMode === 'folders'">
          <el-button @click="showCreateFolderDialog">
            <el-icon><FolderAdd /></el-icon>
            新建文件夹
          </el-button>
          <el-button @click="loadFolders">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </template>

        <!-- 模板视图 -->
        <template v-else>
          <el-button text @click="backToFolders">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <span class="current-folder-name">{{ currentFolderName }}</span>
          <el-button type="primary" @click="createNewTemplate">
            <el-icon><Plus /></el-icon>
            新建模板
          </el-button>
          <el-button @click="loadTemplates">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </template>
      </div>
      <div class="toolbar-right">
        <el-button v-if="selectedTemplates.length > 0" @click="showMoveDialog">
          <el-icon><Folder /></el-icon>
          移动到
        </el-button>
        <el-button v-if="selectedTemplates.length > 0" type="danger" @click="handleBatchDelete">
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
        <span v-if="selectedTemplates.length > 0" class="selected-count">
          已选择: {{ selectedTemplates.length }} 个
        </span>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="content-wrapper">
      <!-- 文件夹列表视图 -->
      <div v-if="viewMode === 'folders'" class="folder-view">
        <el-empty v-if="!loadingFolders && folders.length === 0" description="暂无文件夹">
          <el-button type="primary" @click="showCreateFolderDialog">
            创建第一个文件夹
          </el-button>
        </el-empty>

        <div v-else class="folder-grid">
          <div
            v-for="folder in folders"
            :key="folder.id"
            class="folder-card"
            @click="enterFolder(folder)"
          >
            <div class="folder-card-icon">
              <el-icon><Folder /></el-icon>
            </div>
            <div class="folder-card-name">
              {{ folder.name }}
            </div>
            <div class="folder-card-actions">
              <el-button text @click.stop="showEditFolderDialog(folder)">
                <el-icon><Edit /></el-icon>
                重命名
              </el-button>
              <el-button text type="danger" @click.stop="handleDeleteFolder(folder)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 模板列表视图 -->
      <div v-else class="template-view">
        <div class="section-header">
          <div class="section-title">
            模板列表
          </div>
          <el-checkbox v-if="templates.length > 0" :model-value="isAllSelected" @change="toggleSelectAll">
            全选
          </el-checkbox>
        </div>

        <el-empty v-if="!loadingTemplates && templates.length === 0" description="暂无模板">
          <el-button type="primary" @click="createNewTemplate">
            创建第一个模板
          </el-button>
        </el-empty>

        <div v-else class="template-grid">
          <div
            v-for="template in templates"
            :key="template.id"
            class="template-card"
            :class="{ selected: selectedTemplates.some((t) => t.id === template.id) }"
          >
            <!-- 缩略图区域 -->
            <div class="template-preview" @click="openTemplateEditor(template)">
              <img v-if="template.thumbnail" :src="template.thumbnail" :alt="template.name">
              <div v-else class="no-thumbnail">
                <el-icon><Document /></el-icon>
                <div>无缩略图</div>
              </div>
            </div>

            <!-- 信息区域 -->
            <div class="template-info" @click="toggleSelection(template)">
              <div class="template-name" :title="template.name">
                {{ template.name }}
              </div>
              <div class="template-meta">
                <span>{{ template.canvas_width }} × {{ template.canvas_height }}</span>
                <span>{{ new Date(template.created_at).toLocaleDateString() }}</span>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="template-actions">
              <el-button text type="danger" @click.stop="handleDeleteTemplate(template)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="total > pageSize" class="pagination-container">
          <el-pagination
            :current-page="currentPage"
            :page-size="pageSize"
            :total="total"
            layout="total, prev, pager, next"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </div>

    <!-- 文件夹对话框 -->
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

    <!-- 移动模板对话框 -->
    <el-dialog v-model="moveDialogVisible" title="移动模板" width="500px">
      <el-form label-width="90px">
        <el-form-item label="目标文件夹" required>
          <div style="display: flex; gap: 8px; align-items: flex-start; width: 100%;">
            <el-select v-model="targetFolderId" placeholder="请选择目标文件夹" style="flex: 1; min-width: 200px;">
              <el-option
                v-for="folder in moveDialogFolders"
                :key="folder.id"
                :label="folder.name"
                :value="folder.id"
              />
            </el-select>
            <el-button v-if="!isCreatingFolderInMove" @click="showInlineFolderInputInMove" style="flex-shrink: 0;">
              <el-icon><FolderAdd /></el-icon>
              新建
            </el-button>
          </div>
        </el-form-item>
        <el-form-item v-if="isCreatingFolderInMove" label="文件夹名称" required>
          <div style="display: flex; gap: 8px;">
            <el-input
              v-model="newFolderNameInMove"
              placeholder="请输入文件夹名称"
              style="flex: 1"
              @keyup.enter="confirmInlineFolderCreationInMove"
            />
            <el-button type="primary" @click="confirmInlineFolderCreationInMove" style="flex-shrink: 0;">
              <el-icon><Check /></el-icon>
            </el-button>
            <el-button @click="cancelInlineFolderCreationInMove" style="flex-shrink: 0;">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="moveDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="handleMoveConfirm">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.template-manage-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e4e7ed;

  .toolbar-left,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .current-folder-name {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin: 0 12px;
  }

  .selected-count {
    margin-left: 12px;
    color: #409eff;
    font-size: 14px;
    white-space: nowrap;
  }
}

.content-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

// 文件夹视图
.folder-view {
  .folder-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 24px;
  }

  .folder-card {
    background: white;
    border: 2px solid #e4e7ed;
    border-radius: 12px;
    padding: 24px;
    cursor: pointer;
    transition: all 0.3s;
    text-align: center;

    &:hover {
      border-color: #409eff;
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);

      .folder-card-actions {
        opacity: 1;
      }
    }

    .folder-card-icon {
      font-size: 64px;
      color: #409eff;
      margin-bottom: 16px;
    }

    .folder-card-name {
      font-size: 16px;
      font-weight: 500;
      color: #303133;
      margin-bottom: 12px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .folder-card-actions {
      display: flex;
      justify-content: center;
      gap: 8px;
      opacity: 0;
      transition: opacity 0.3s;
    }
  }
}

// 模板视图
.template-view {
  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 16px;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .template-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    grid-auto-rows: max-content;
    gap: 16px;
    align-content: start;
  }

  .template-card {
    background: white;
    border: 2px solid #e4e7ed;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s;
    height: fit-content;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    &.selected {
      border-color: #409eff;
      background: #ecf5ff;
    }

    .template-preview {
      width: 100%;
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f7fa;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .no-thumbnail {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        color: #909399;

        .el-icon {
          font-size: 48px;
        }
      }
    }

    .template-info {
      padding: 12px;

      .template-name {
        font-size: 14px;
        font-weight: 500;
        color: #303133;
        margin-bottom: 8px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .template-meta {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #909399;
      }
    }

    .template-actions {
      padding: 0 12px 12px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .pagination-container {
    display: flex;
    justify-content: center;
    margin-top: 24px;
  }
}
</style>
