<script setup lang="ts">
import type { TemplateFolderItem, TemplateItem } from "@/pages/template-manage/apis/type"
import { Folder } from "@element-plus/icons-vue"
import { isMediaId, resolveMediaIds } from "@/api/media"
import { getTemplateFolderListApi, getTemplateListApi } from "@/pages/template-manage/apis"

// Props 定义
interface Props {
  /** 是否多选模式 */
  multiple?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false
})

const emit = defineEmits<{
  /** 单选模式：选择模板时触发 */
  select: [template: TemplateItem]
  /** 多选模式：确认选择时触发 */
  selectMultiple: [templates: TemplateItem[]]
  /** 关闭选择器 */
  close: []
}>()

// 文件夹导航
interface BreadcrumbItem {
  id: number
  name: string
}

const breadcrumbs = ref<BreadcrumbItem[]>([{ id: 0, name: "全部模板" }])
const currentFolderId = computed(() => breadcrumbs.value[breadcrumbs.value.length - 1].id)

// 文件夹列表
const folders = ref<TemplateFolderItem[]>([])
const loadingFolders = ref(false)

// 模板列表
const templates = ref<TemplateItem[]>([])
const loadingTemplates = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 多选状态
const selectedMap = reactive(new Map<number, TemplateItem>())
const selectedCount = computed(() => selectedMap.size)

function isSelected(id: number) {
  return selectedMap.has(id)
}

function toggleSelect(template: TemplateItem) {
  if (selectedMap.has(template.id)) {
    selectedMap.delete(template.id)
  } else {
    selectedMap.set(template.id, template)
  }
}

function confirmMultiSelect() {
  const items = Array.from(selectedMap.values())
  emit("selectMultiple", items)
  selectedMap.clear()
  emit("close")
}

// 加载文件夹列表
async function loadFolders() {
  loadingFolders.value = true
  try {
    const { data } = await getTemplateFolderListApi({ parent_id: currentFolderId.value })
    folders.value = data.folders
  } catch (error) {
    console.error("加载文件夹失败:", error)
  } finally {
    loadingFolders.value = false
  }
}

// 进入文件夹
function enterFolder(folder: TemplateFolderItem) {
  breadcrumbs.value.push({ id: folder.id, name: folder.name })
  loadFolders()
  currentPage.value = 1
  loadTemplates()
}

// 通过面包屑导航
function navigateToFolder(index: number) {
  breadcrumbs.value = breadcrumbs.value.slice(0, index + 1)
  loadFolders()
  currentPage.value = 1
  loadTemplates()
}

// 加载模板列表
async function loadTemplates() {
  loadingTemplates.value = true
  try {
    const { data } = await getTemplateListApi({
      folder_id: currentFolderId.value,
      page: currentPage.value,
      per_page: pageSize.value
    })
    templates.value = data.templates
    total.value = data.paging.total_count

    // 批量解析 thumbnail 中的 media_id 为 URL
    const mediaIds = templates.value.map(t => t.thumbnail).filter(isMediaId)
    if (mediaIds.length > 0) {
      const urls = await resolveMediaIds(mediaIds)
      for (const t of templates.value) {
        if (t.thumbnail && urls[t.thumbnail]) {
          t.thumbnail = urls[t.thumbnail]
        }
      }
    }
  } catch (error) {
    console.error("加载模板失败:", error)
  } finally {
    loadingTemplates.value = false
  }
}

// 切换页码
function handlePageChange() {
  loadTemplates()
}

// 点击模板卡片
function handleCardClick(template: TemplateItem) {
  if (props.multiple) {
    toggleSelect(template)
  } else {
    emit("select", template)
    emit("close")
  }
}

// 初始化
onMounted(() => {
  loadFolders()
  loadTemplates()
})
</script>

<template>
  <div class="template-selector">
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

    <!-- 右侧模板区域 -->
    <div class="template-content">
      <!-- 模板网格 -->
      <div v-loading="loadingTemplates" class="template-grid">
        <div v-if="templates.length === 0 && !loadingTemplates" class="empty-tip">
          <el-empty description="暂无模板" :image-size="100" />
        </div>

        <div
          v-for="tpl in templates"
          :key="tpl.id"
          class="template-card"
          :class="{ selected: multiple && isSelected(tpl.id) }"
          @click="handleCardClick(tpl)"
        >
          <div class="thumbnail">
            <img v-if="tpl.thumbnail" :src="tpl.thumbnail" :alt="tpl.name" crossorigin="anonymous">
            <div v-else class="no-thumbnail">
              无缩略图
            </div>

            <!-- 多选模式：勾选标记 -->
            <div v-if="multiple" class="check-mark" :class="{ checked: isSelected(tpl.id) }">
              <el-icon><svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M406.656 706.944 195.84 496.128a32 32 0 1 0-45.248 45.248l256 256 512-512a32 32 0 0 0-45.248-45.248L406.592 706.944z" /></svg></el-icon>
            </div>
          </div>

          <div class="template-info">
            <div class="name" :title="tpl.name">
              {{ tpl.name }}
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
          size="small"
          @current-change="handlePageChange"
        />
      </div>

      <!-- 多选模式：底部操作栏 -->
      <div v-if="multiple" class="multi-select-bar">
        <span class="selected-info">已选 {{ selectedCount }} 个模板</span>
        <el-button type="primary" :disabled="selectedCount === 0" @click="confirmMultiSelect">
          确认添加
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.template-selector {
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

  .template-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #fff;

    .template-grid {
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

      .template-card {
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

        &.selected {
          border-color: #409eff;
          box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);

          .check-mark {
            opacity: 1;
          }
        }

        .thumbnail {
          width: 100%;
          height: 120px;
          overflow: hidden;
          position: relative;
          background-color: #f5f5f5;

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

          .check-mark {
            position: absolute;
            top: 6px;
            right: 6px;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            border: 2px solid #fff;
            background: rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 14px;
            z-index: 1;
            transition: all 0.2s;

            &.checked {
              background: #409eff;
              border-color: #409eff;
            }
          }

          img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
          }

          .no-thumbnail {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: #c0c4cc;
          }
        }

        .template-info {
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

    .multi-select-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      background: #fff;
      border-top: 1px solid #ebeef5;

      .selected-info {
        font-size: 13px;
        color: #606266;
      }
    }
  }
}

/* 多选模式下隐藏单选的 hover 蒙层 */
.template-selector .template-card .thumbnail .check-mark ~ ::after,
.template-selector .template-content .template-grid .template-card:has(.check-mark):hover .thumbnail::after {
  opacity: 0 !important;
}
</style>
