<script lang="ts" setup>
import type { ElMessageBoxOptions } from "element-plus"
import type { VxeGridInstance, VxeGridProps } from "vxe-table"
import type { CopyWordItem } from "./apis/type"
import { ElMessage, ElMessageBox } from "element-plus"
import { computed, onMounted, reactive, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { batchApproveCopyWordApi, batchDeleteCopyWordApi, generateSmartCopyLibraryApi, getCopyLibraryDetailApi, getCopyWordListApi } from "./apis"
import AreaSelector from "./components/area-selector.vue"

defineOptions({
  name: "SmartCopyLibrary"
})

const route = useRoute()
const router = useRouter()

// 文案库名称
const copyLibraryName = ref("")
const currentLibraryId = ref<number>(0)

// 地区选择器对话框
const areaSelectorVisible = ref(false)

// 区域词
const areaInput = ref("")

// 前置词
const prefixInput = ref("")

// 关键词
const keywordInput = ref("")

// 后缀词
const suffixInput = ref("")

// 生成配置
const maxLimit = ref<number>(100) // 最大生成数量
const descWordCount = ref("40-60") // 文案描述字数范围

// vxe-grid 表格
const xGridDom = useTemplateRef<VxeGridInstance>("xGridDom")

// 选中的行数
const selectedCount = ref(0)

// 状态映射
const statusMap: Record<number, { text: string, type: "" | "success" | "warning" | "info" | "danger" }> = {
  1: { text: "生成中", type: "warning" },
  2: { text: "待审核", type: "info" },
  3: { text: "失败", type: "danger" },
  4: { text: "审核通过", type: "success" },
  5: { text: "已引用", type: "" }
}

// 处理选择变化
function handleSelectionChange({ records }: any) {
  selectedCount.value = records.length
}

// vxe-grid 配置
const xGridOpt: VxeGridProps = reactive({
  loading: false,
  autoResize: true,
  /** 分页配置项 */
  pagerConfig: {
    align: "right",
    pageSize: 20,
    pageSizes: [10, 20, 50, 100]
  },
  /** 工具栏配置 */
  toolbarConfig: {
    refresh: true,
    slots: {
      buttons: "toolbar-btns"
    }
  },
  /** 列配置 */
  columns: [
    {
      type: "checkbox",
      width: "50px"
    },
    {
      field: "id",
      title: "ID",
      width: "80px"
    },
    {
      field: "long_tail_word",
      title: "长尾词",
      width: "200px"
    },
    {
      field: "status",
      title: "文案状态",
      width: "120px",
      slots: {
        default: "status-slot"
      }
    },
    {
      field: "title",
      title: "标题",
      minWidth: "200px"
    },
    {
      field: "text",
      title: "文案描述",
      minWidth: "300px"
    },
    {
      field: "topics",
      title: "话题标签",
      width: "200px",
      slots: {
        default: "topics-slot"
      }
    }
  ],
  /** 数据代理配置项 */
  proxyConfig: {
    seq: true,
    props: {
      total: "total"
    },
    ajax: {
      query: ({ page }) => {
        if (!currentLibraryId.value) {
          return Promise.resolve({ total: 0, result: [] })
        }

        xGridOpt.loading = true
        return new Promise((resolve) => {
          let total = 0
          let result: CopyWordItem[] = []

          const callback = (res: any) => {
            if (res?.data) {
              total = res.data.pager?.total_count || 0
              result = res.data.items || []
            }
            xGridOpt.loading = false
            resolve({ total, result })
          }

          const params = {
            copy_id: currentLibraryId.value,
            page: page.currentPage,
            per_page: page.pageSize
          }

          getCopyWordListApi(params).then(callback).catch(callback)
        })
      }
    }
  }
})

// 计算每个文本域的行数
const areaLineCount = computed(() => {
  return areaInput.value ? areaInput.value.split("\n").length : 0
})

const prefixLineCount = computed(() => {
  return prefixInput.value ? prefixInput.value.split("\n").length : 0
})

const keywordLineCount = computed(() => {
  return keywordInput.value ? keywordInput.value.split("\n").length : 0
})

const suffixLineCount = computed(() => {
  return suffixInput.value ? suffixInput.value.split("\n").length : 0
})

// 打开地区选择器
function selectAreas() {
  areaSelectorVisible.value = true
}

// 处理地区选择完成
function handleAreaSelected(areas: string[]) {
  if (areas.length === 0) return

  // 追加到现有地区列表
  const existing = areaInput.value.trim()
  const newAreas = areas.filter((area) => {
    // 过滤掉已存在的地区
    const existingAreas = existing.split("\n").map(line => line.trim())
    return !existingAreas.includes(area)
  })

  if (newAreas.length > 0) {
    areaInput.value = existing ? `${existing}\n${newAreas.join("\n")}` : newAreas.join("\n")
  }
}

// 清空文本域
function clearArea() {
  areaInput.value = ""
}

function clearPrefix() {
  prefixInput.value = ""
}

function clearKeyword() {
  keywordInput.value = ""
}

function clearSuffix() {
  suffixInput.value = ""
}

// 生成智能文案
async function generateSmart() {
  if (!copyLibraryName.value.trim()) {
    ElMessage.warning("请输入任务名称")
    return
  }

  if (!keywordInput.value.trim()) {
    ElMessage.warning("请至少添加一个关键词")
    return
  }

  try {
    // 将文本域内容转换为数组（按行分割，过滤空行）
    const areas = areaInput.value
      ? areaInput.value
          .split("\n")
          .map(line => line.trim())
          .filter(line => line)
      : []

    const prefixes = prefixInput.value
      ? prefixInput.value
          .split("\n")
          .map(line => line.trim())
          .filter(line => line)
      : []

    const keywords = keywordInput.value
      .split("\n")
      .map(line => line.trim())
      .filter(line => line)

    const suffixes = suffixInput.value
      ? suffixInput.value
          .split("\n")
          .map(line => line.trim())
          .filter(line => line)
      : []

    const { data } = await generateSmartCopyLibraryApi({
      id: currentLibraryId.value || undefined,
      name: copyLibraryName.value.trim(),
      config: {
        areas,
        prefixes,
        keywords,
        suffixes,
        max_limit: maxLimit.value,
        desc_word_count: descWordCount.value
      }
    })

    ElMessage.success(data.message || "智能文案生成任务已提交")

    // 保存当前库ID
    if (data.library?.id) {
      currentLibraryId.value = data.library.id

      // 跳转回列表
      setTimeout(() => {
        router.push("/copy-library/index")
      }, 1500)
    }
  } catch (error: any) {
    ElMessage.error(error.message || "生成失败")
  }
}

// 加载文案库详情
async function loadCopyLibrary(id: number) {
  try {
    const { data } = await getCopyLibraryDetailApi(id)
    const library = data

    copyLibraryName.value = library.name || ""
    currentLibraryId.value = library.id

    // 解析配置
    let config: any = {}
    try {
      config = JSON.parse(library.content || "{}")
    } catch (e) {
      console.error("解析配置失败:", e)
    }

    // 将数组转换为文本（每行一个）
    areaInput.value = (config.areas || []).join("\n")
    prefixInput.value = (config.prefixes || []).join("\n")
    keywordInput.value = (config.keywords || []).join("\n")
    suffixInput.value = (config.suffixes || []).join("\n")
    maxLimit.value = config.max_limit || 100
    descWordCount.value = config.desc_word_count || "40-60"

    // 重置选中状态
    selectedCount.value = 0

    // 刷新表格数据
    xGridDom.value?.commitProxy("query")
  } catch (error) {
    console.error("加载文案库失败:", error)
    ElMessage.error("加载文案库失败")
  }
}

// 批量删除
function batchDelete() {
  const checkedRows = xGridDom.value?.getCheckboxRecords() as CopyWordItem[]
  if (!checkedRows || checkedRows.length === 0) {
    ElMessage.warning("请选择要删除的词条")
    return
  }

  const tip = `确定 <strong style="color: var(--el-color-danger);"> 批量删除 </strong> 选中的 ${checkedRows.length} 条词条吗？`
  const config: ElMessageBoxOptions = {
    type: "warning",
    showClose: true,
    closeOnClickModal: true,
    closeOnPressEscape: true,
    cancelButtonText: "取消",
    confirmButtonText: "确定",
    dangerouslyUseHTMLString: true
  }

  ElMessageBox.confirm(tip, "提示", config).then(() => {
    const ids = checkedRows.map(row => row.id)
    batchDeleteCopyWordApi({ ids }).then(() => {
      ElMessage.success(`成功删除 ${checkedRows.length} 条词条`)
      // 清空选择
      xGridDom.value?.clearCheckboxRow()
      selectedCount.value = 0
      // 刷新表格
      xGridDom.value?.commitProxy("query")
    })
  })
}

// 批量审核
function batchApprove() {
  const checkedRows = xGridDom.value?.getCheckboxRecords() as CopyWordItem[]
  if (!checkedRows || checkedRows.length === 0) {
    ElMessage.warning("请选择要审核的词条")
    return
  }

  const tip = `确定 <strong style="color: var(--el-color-primary);"> 批量审核通过 </strong> 选中的 ${checkedRows.length} 条词条吗？`
  const config: ElMessageBoxOptions = {
    type: "info",
    showClose: true,
    closeOnClickModal: true,
    closeOnPressEscape: true,
    cancelButtonText: "取消",
    confirmButtonText: "确定",
    dangerouslyUseHTMLString: true
  }

  ElMessageBox.confirm(tip, "提示", config).then(() => {
    const ids = checkedRows.map(row => row.id)
    batchApproveCopyWordApi({ ids }).then(() => {
      ElMessage.success(`成功审核 ${checkedRows.length} 条词条`)
      // 清空选择
      xGridDom.value?.clearCheckboxRow()
      selectedCount.value = 0
      // 刷新表格
      xGridDom.value?.commitProxy("query")
    })
  })
}

// 挂载时检查是否编辑模式
onMounted(() => {
  const id = route.query.id
  if (id) {
    loadCopyLibrary(Number(id))
  }
})
</script>

<template>
  <div class="app-container">
    <!-- 顶部配置 -->
    <div class="top-config">
      <el-form :inline="true">
        <el-form-item>
          <template #label>
            <span><span style="color: red">*</span> 任务名称</span>
          </template>
          <el-input
            v-model="copyLibraryName"
            placeholder="请输入任务名称"
            maxlength="100"
            style="width: 300px"
          />
        </el-form-item>

        <el-form-item>
          <template #label>
            <span><span style="color: red">*</span> 生成数量</span>
          </template>
          <el-input-number v-model="maxLimit" :min="1" :max="1000" style="width: 150px" />
        </el-form-item>

        <el-form-item>
          <template #label>
            <span><span style="color: red">*</span> 文案描述字数</span>
          </template>
          <el-select v-model="descWordCount" style="width: 150px">
            <el-option label="40-60" value="40-60" />
            <el-option label="60-80" value="60-80" />
            <el-option label="80-100" value="80-100" />
            <el-option label="100-120" value="100-120" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <!-- 四个文本域 -->
    <div class="textarea-grid">
      <!-- 区域词 -->
      <div class="textarea-card">
        <div class="card-header">
          <svg class="icon" viewBox="0 0 1024 1024" width="16" height="16">
            <path
              d="M512 85.333333c235.648 0 426.666667 191.018667 426.666667 426.666667s-191.018667 426.666667-426.666667 426.666667S85.333333 747.648 85.333333 512 276.352 85.333333 512 85.333333z m0 85.333334C323.477333 170.666667 170.666667 323.477333 170.666667 512s152.810667 341.333333 341.333333 341.333333 341.333333-152.810667 341.333333-341.333333S700.522667 170.666667 512 170.666667z m0 128c141.141333 0 256 114.858667 256 256s-114.858667 256-256 256-256-114.858667-256-256 114.858667-256 256-256z m0 85.333333c-94.122667 0-170.666667 76.544-170.666667 170.666667s76.544 170.666667 170.666667 170.666666 170.666667-76.544 170.666667-170.666666-76.544-170.666667-170.666667-170.666667z m0 85.333333c47.061333 0 85.333333 38.272 85.333333 85.333334s-38.272 85.333333-85.333333 85.333333-85.333333-38.272-85.333333-85.333333 38.272-85.333333 85.333333-85.333334z"
              fill="currentColor"
            />
          </svg>
          <span class="card-title">区域词</span>
        </div>
        <el-input
          v-model="areaInput"
          type="textarea"
          :rows="25"
          placeholder="请输入地区名称，多个地区之间换行，例如：&#10;上海&#10;黄浦&#10;徐汇&#10;长宁&#10;静安"
          class="card-textarea"
        />
        <div class="card-footer">
          <el-button link type="primary" @click="selectAreas">
            选择地区
          </el-button>
          <el-button link type="primary" @click="clearArea">
            清空
          </el-button>
          <span class="line-count">{{ areaLineCount }}/50行</span>
        </div>
      </div>

      <!-- 前置词 -->
      <div class="textarea-card">
        <div class="card-header">
          <svg class="icon" viewBox="0 0 1024 1024" width="16" height="16">
            <path
              d="M853.333333 128c47.104 0 85.333333 38.229333 85.333334 85.333333v597.333334c0 47.104-38.229333 85.333333-85.333334 85.333333H170.666667c-47.104 0-85.333333-38.229333-85.333334-85.333333V213.333333c0-47.104 38.229333-85.333333 85.333334-85.333333h682.666666z m0 85.333333H170.666667v597.333334h682.666666V213.333333z m-128 384v85.333334H298.666667v-85.333334h426.666666z m0-170.666666v85.333333H298.666667v-85.333333h426.666666z m0-170.666667v85.333333H298.666667V256h426.666666z"
              fill="currentColor"
            />
          </svg>
          <span class="card-title">前置词</span>
        </div>
        <el-input
          v-model="prefixInput"
          type="textarea"
          :rows="25"
          placeholder="请输入入品牌名或者商品型号或者商品描述信息，例如：XHP900、BK18-8G型、BK15-8型；移动式、离心式、螺杆式"
          class="card-textarea"
        />
        <div class="card-footer">
          <el-button link type="primary" @click="clearPrefix">
            清空
          </el-button>
          <span class="line-count">{{ prefixLineCount }}/50行</span>
        </div>
      </div>

      <!-- 关键词 -->
      <div class="textarea-card">
        <div class="card-header">
          <svg class="icon" viewBox="0 0 1024 1024" width="16" height="16">
            <path
              d="M725.333333 128c94.122667 0 170.666667 76.544 170.666667 170.666667v426.666666c0 94.122667-76.544 170.666667-170.666667 170.666667H298.666667c-94.122667 0-170.666667-76.544-170.666667-170.666667V298.666667c0-94.122667 76.544-170.666667 170.666667-170.666667h426.666666z m0 85.333333H298.666667c-47.061333 0-85.333333 38.272-85.333334 85.333334v426.666666c0 47.061333 38.272 85.333333 85.333334 85.333334h426.666666c47.061333 0 85.333333-38.272 85.333334-85.333334V298.666667c0-47.061333-38.272-85.333333-85.333334-85.333334z m-42.666666 128c23.530667 0 42.666667 19.136 42.666666 42.666667v256c0 23.530667-19.136 42.666667-42.666666 42.666667H341.333333c-23.530667 0-42.666667-19.136-42.666666-42.666667V384c0-23.530667 19.136-42.666667 42.666666-42.666667h341.333334z m-42.666667 85.333334H384v170.666666h256V426.666667z"
              fill="currentColor"
            />
          </svg>
          <span class="card-title"><span style="color: red">*</span> 关键词</span>
        </div>
        <el-input
          v-model="keywordInput"
          type="textarea"
          :rows="25"
          placeholder="请输入入搜索商品词，例如：空压机、洗衣机、电视机、冰箱"
          class="card-textarea"
        />
        <div class="card-footer">
          <el-button link type="primary" @click="clearKeyword">
            清空
          </el-button>
          <span class="line-count">{{ keywordLineCount }}/50行</span>
        </div>
      </div>

      <!-- 后缀词 -->
      <div class="textarea-card">
        <div class="card-header">
          <svg class="icon" viewBox="0 0 1024 1024" width="16" height="16">
            <path
              d="M853.333333 128c47.104 0 85.333333 38.229333 85.333334 85.333333v597.333334c0 47.104-38.229333 85.333333-85.333334 85.333333H170.666667c-47.104 0-85.333333-38.229333-85.333334-85.333333V213.333333c0-47.104 38.229333-85.333333 85.333334-85.333333h682.666666z m-42.666666 85.333333H213.333333v597.333334h597.333334V213.333333zM341.333333 426.666667v85.333333h-85.333333v-85.333333h85.333333z m213.333334 0v85.333333h-128v-85.333333h128z m213.333333 0v85.333333h-128v-85.333333h128z"
              fill="currentColor"
            />
          </svg>
          <span class="card-title">后缀词</span>
        </div>
        <el-input
          v-model="suffixInput"
          type="textarea"
          :rows="25"
          placeholder="请输入入服务描述词或生产型词，例如：多少钱、怎么样、厂商批发、报价、批发价等"
          class="card-textarea"
        />
        <div class="card-footer">
          <el-button link type="primary" @click="clearSuffix">
            清空
          </el-button>
          <span class="line-count">{{ suffixLineCount }}/50行</span>
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="bottom-actions">
      <el-button @click="router.push('/copy-library/index')">
        返回列表
      </el-button>
      <el-button type="primary" size="large" @click="generateSmart" class="generate-btn">
        点击生成
      </el-button>
    </div>

    <!-- 生成结果表格 -->
    <div class="result-table" v-if="currentLibraryId > 0">
      <vxe-grid ref="xGridDom" v-bind="xGridOpt" @checkbox-change="handleSelectionChange" @checkbox-all="handleSelectionChange">
        <!-- 工具栏按钮 -->
        <template #toolbar-btns>
          <vxe-button status="primary" icon="vxe-icon-square-check" :disabled="selectedCount === 0" @click="batchApprove">
            批量审核
          </vxe-button>
          <vxe-button status="danger" icon="vxe-icon-delete" :disabled="selectedCount === 0" @click="batchDelete">
            批量删除
          </vxe-button>
        </template>
        <!-- 状态 -->
        <template #status-slot="{ row }">
          <el-tag :type="statusMap[row.status]?.type || 'info'">
            {{ statusMap[row.status]?.text || "未知" }}
          </el-tag>
        </template>
        <!-- 话题标签 -->
        <template #topics-slot="{ row }">
          <template v-if="row.topics">
            <el-tag
              v-for="(topic, index) in JSON.parse(row.topics)"
              :key="index"
              size="small"
              style="margin-right: 4px"
            >
              #{{ topic.name }}
            </el-tag>
          </template>
        </template>
      </vxe-grid>
    </div>

    <!-- 地区选择器 -->
    <AreaSelector v-model:visible="areaSelectorVisible" @confirm="handleAreaSelected" />
  </div>
</template>

<style scoped lang="scss">
.app-container {
  padding: 20px;
}

.top-config {
  margin-bottom: 24px;
  background: #fff;
  padding: 20px;
  border-radius: 4px;
}

.textarea-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.textarea-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e4e7ed;

  .card-header {
    background: #e8e5ff;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 8px;

    .icon {
      color: #6366f1;
    }

    .card-title {
      font-size: 14px;
      font-weight: 500;
      color: #303133;
    }
  }

  .card-textarea {
    :deep(.el-textarea__inner) {
      border: none;
      border-radius: 0;
      padding: 16px;
      font-size: 13px;
      line-height: 1.6;
      resize: none;
      box-shadow: none;

      &:focus {
        box-shadow: none;
      }
    }
  }

  .card-footer {
    padding: 8px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #e4e7ed;
    background: #fafafa;

    .line-count {
      font-size: 12px;
      color: #909399;
    }
  }
}

.bottom-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;

  .generate-btn {
    min-width: 200px;
  }
}

.result-table {
  margin-top: 32px;
  background: #fff;
  padding: 20px;
  border-radius: 4px;
}
</style>
