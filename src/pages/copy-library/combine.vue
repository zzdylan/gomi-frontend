<script setup lang="ts">
import type { CombineConfig } from "./components/combine-dialog.vue"
import { ElMessage } from "element-plus"
import { computed, onMounted, ref } from "vue"
import { useRoute } from "vue-router"
import { batchCreateCopyLibraryApi, getCopyLibraryDetailApi, getCopyWordListApi } from "./apis"
import AreaSelector from "./components/area-selector.vue"
import CombineDialog from "./components/combine-dialog.vue"

// 地区选择器对话框
const areaSelectorVisible = ref(false)

// 文案组合配置对话框
const combineDialogVisible = ref(false)

// 当前组合类型
type CombineType = "title" | "description" | "topic"
const currentCombineType = ref<CombineType>("title")

// 可编辑的标题
const areaTitle = ref("地区")
const keywordTitle = ref("主词")
const suffixTitle = ref("尾词")
const variable1Title = ref("变量1")
const variable2Title = ref("变量2")
const variable3Title = ref("变量3")

// 地区数据（文本域，每行一个）
const areasText = ref("")

// 主词数据
const keywordsText = ref("")

// 尾词数据
const suffixesText = ref("")

// 变量数据
const variable1 = ref("")
const variable2 = ref("")
const variable3 = ref("")

// 组合标题（首页）- 可编辑的文本域
const combinedTitles = ref("")

// 文案描述 - 可编辑的文本域
const combinedDescriptions = ref("")
const showInWorkName = ref(false)

// 话题标签
const topics = ref("")

// 话题标签数量选择
const topicTagCount = ref<number | undefined>(undefined)

// 文案库名称
const copyLibraryName = ref("")

// 当前编辑的文案库ID（用于更新模式）
const currentLibraryId = ref<number>(0)

// 路由实例
const route = useRoute()

// 计算话题行数
const topicCount = computed(() => topics.value.split("\n").filter(line => line.trim()).length)

// 计算行数
const areaCount = computed(() => areasText.value.split("\n").filter(line => line.trim()).length)
const keywordCount = computed(() => keywordsText.value.split("\n").filter(line => line.trim()).length)
const suffixCount = computed(() => suffixesText.value.split("\n").filter(line => line.trim()).length)
const variable1Count = computed(() => variable1.value.split("\n").filter(line => line.trim()).length)
const variable2Count = computed(() => variable2.value.split("\n").filter(line => line.trim()).length)
const variable3Count = computed(() => variable3.value.split("\n").filter(line => line.trim()).length)
const titleCount = computed(() => combinedTitles.value.split("\n").filter(line => line.trim()).length)
const descCount = computed(() => combinedDescriptions.value.split("\n").filter(line => line.trim()).length)

// 计算数据可用性
const dataAvailability = computed(() => ({
  area: areasText.value.split("\n").filter(line => line.trim()).length > 0,
  keyword: keywordsText.value.split("\n").filter(line => line.trim()).length > 0,
  suffix: suffixesText.value.split("\n").filter(line => line.trim()).length > 0,
  var1: variable1.value.split("\n").filter(line => line.trim()).length > 0,
  var2: variable2.value.split("\n").filter(line => line.trim()).length > 0,
  var3: variable3.value.split("\n").filter(line => line.trim()).length > 0
}))

// 打开地区选择器
function selectAreas() {
  areaSelectorVisible.value = true
}

// 处理地区选择完成
function handleAreaSelected(areas: string[]) {
  if (areas.length === 0) return

  // 追加到现有地区列表
  const existing = areasText.value.trim()
  const newAreas = areas.filter((area) => {
    // 过滤掉已存在的地区
    const existingAreas = existing.split("\n").map(line => line.trim())
    return !existingAreas.includes(area)
  })

  if (newAreas.length > 0) {
    areasText.value = existing ? `${existing}\n${newAreas.join("\n")}` : newAreas.join("\n")
  }
}

// 乱序
function shuffleText(text: string): string {
  const lines = text.split("\n").filter(line => line.trim())
  const shuffled = lines.sort(() => Math.random() - 0.5)
  return shuffled.join("\n")
}

function shuffleAreas() {
  areasText.value = shuffleText(areasText.value)
}

function shuffleKeywords() {
  keywordsText.value = shuffleText(keywordsText.value)
}

function shuffleSuffixes() {
  suffixesText.value = shuffleText(suffixesText.value)
}

function shuffleVariable(varNum: number) {
  if (varNum === 1) variable1.value = shuffleText(variable1.value)
  if (varNum === 2) variable2.value = shuffleText(variable2.value)
  if (varNum === 3) variable3.value = shuffleText(variable3.value)
}

// 清空
function clearAreas() {
  areasText.value = ""
}

function clearKeywords() {
  keywordsText.value = ""
}

function clearSuffixes() {
  suffixesText.value = ""
}

function clearVariable(varNum: number) {
  if (varNum === 1) variable1.value = ""
  if (varNum === 2) variable2.value = ""
  if (varNum === 3) variable3.value = ""
}

// 打开组合对话框
function openCombineDialog(type: CombineType) {
  currentCombineType.value = type
  combineDialogVisible.value = true
}

// 组合标题
function combineTitles() {
  openCombineDialog("title")
}

// 清空组合标题
function clearCombinedTitles() {
  combinedTitles.value = ""
}

// 组合描述
function combineDescriptions() {
  openCombineDialog("description")
}

// 清空组合描述
function clearCombinedDescriptions() {
  combinedDescriptions.value = ""
}

// 组合话题标签
function combineTopics() {
  openCombineDialog("topic")
}

// 处理组合确认
function handleCombineConfirm(config: CombineConfig) {
  // 准备数据
  const dataMap: { [key: string]: string[] } = {
    area: areasText.value.split("\n").filter(line => line.trim()),
    keyword: keywordsText.value.split("\n").filter(line => line.trim()),
    suffix: suffixesText.value.split("\n").filter(line => line.trim()),
    var1: variable1.value.split("\n").filter(line => line.trim()),
    var2: variable2.value.split("\n").filter(line => line.trim()),
    var3: variable3.value.split("\n").filter(line => line.trim())
  }

  // 检查必填项
  const hasRequiredData = config.elements.every(el => dataMap[el.value] && dataMap[el.value].length > 0)
  if (!hasRequiredData) {
    ElMessage.warning("请确保所选组合元素都有数据")
    return
  }

  // 执行组合
  const results = performCombination(dataMap, config)

  // 根据类型保存结果
  const existing = currentCombineType.value === "title"
    ? combinedTitles.value.trim()
    : currentCombineType.value === "description"
      ? combinedDescriptions.value.trim()
      : topics.value.trim()

  const newContent = existing ? `${existing}\n${results.join("\n")}` : results.join("\n")

  if (currentCombineType.value === "title") {
    combinedTitles.value = newContent
  } else if (currentCombineType.value === "description") {
    combinedDescriptions.value = newContent
  } else {
    topics.value = newContent
  }
}

// 执行组合逻辑
function performCombination(dataMap: { [key: string]: string[] }, config: CombineConfig): string[] {
  const { elements, usageCount, deduplicate, sortType } = config

  // 初始化结果为第一个元素的数据
  let results: string[][] = dataMap[elements[0].value].map(item => [item])

  // 逐步组合每个元素
  for (let i = 1; i < elements.length; i++) {
    const currentElement = elements[i - 1] // 注意：操作符是前一个元素的
    const nextData = dataMap[elements[i].value]
    const newResults: string[][] = []

    if (currentElement.operator === "*") {
      // 排列组合（笛卡尔积）
      results.forEach((combo) => {
        nextData.forEach((item) => {
          newResults.push([...combo, item])
        })
      })
    } else {
      // 一对一配对
      const minLength = Math.min(results.length, nextData.length)
      for (let j = 0; j < minLength; j++) {
        newResults.push([...results[j], nextData[j]])
      }
    }

    results = newResults
  }

  // 限制每个元素的使用次数
  if (usageCount > 0) {
    const usageTracker: { [key: string]: { [value: string]: number } } = {}
    elements.forEach((el) => {
      usageTracker[el.value] = {}
      dataMap[el.value].forEach((val) => {
        usageTracker[el.value][val] = 0
      })
    })

    results = results.filter((combo) => {
      // 检查每个元素是否超过使用次数
      const canUse = combo.every((val, idx) => {
        const key = elements[idx].value
        return usageTracker[key][val] < usageCount
      })

      if (canUse) {
        // 更新使用次数
        combo.forEach((val, idx) => {
          const key = elements[idx].value
          usageTracker[key][val]++
        })
        return true
      }

      return false
    })
  }

  // 去重处理
  if (deduplicate) {
    const uniqueSet = new Set<string>()
    results = results.filter((combo) => {
      const text = combo.join("")
      if (uniqueSet.has(text)) {
        return false
      }

      // 检查与已有结果的相似度
      for (const existing of uniqueSet) {
        if (calculateSimilarity(text, existing) >= 0.5) {
          return false
        }
      }

      uniqueSet.add(text)
      return true
    })
  }

  // 转换为字符串
  const textResults = results.map(combo => combo.join(""))

  // 排序
  if (sortType === "random") {
    // 乱序
    for (let i = textResults.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [textResults[i], textResults[j]] = [textResults[j], textResults[i]]
    }
  }

  // 限制最多1000条
  return textResults.slice(0, 1000)
}

// 计算两个字符串的相似度
function calculateSimilarity(str1: string, str2: string): number {
  const set1 = new Set(str1.split(""))
  const set2 = new Set(str2.split(""))

  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])

  return intersection.size / union.size
}

// 清空话题标签
function clearTopics() {
  topics.value = ""
}

// 提交状态
const submitting = ref(false)

// 提交
async function handleSubmit() {
  const titles = combinedTitles.value.split("\n").filter(line => line.trim())
  const descriptions = combinedDescriptions.value.split("\n").filter(line => line.trim())
  const topicList = topics.value.split("\n").filter(line => line.trim())

  if (!copyLibraryName.value.trim()) {
    ElMessage.warning("请输入文案库名称")
    return
  }

  if (titles.length === 0) {
    ElMessage.warning("请至少填写一条标题")
    return
  }

  try {
    submitting.value = true

    const { data } = await batchCreateCopyLibraryApi({
      id: currentLibraryId.value || undefined,
      name: copyLibraryName.value.trim(),
      config: {
        areas: areasText.value.split("\n").filter(line => line.trim()),
        keywords: keywordsText.value.split("\n").filter(line => line.trim()),
        suffixes: suffixesText.value.split("\n").filter(line => line.trim()),
        variable1: variable1.value.split("\n").filter(line => line.trim()),
        variable2: variable2.value.split("\n").filter(line => line.trim()),
        variable3: variable3.value.split("\n").filter(line => line.trim()),
        showInWorkName: showInWorkName.value
      },
      titles,
      descriptions,
      topics: topicList,
      topic_tag_count: topicTagCount.value || 0
    })

    ElMessage.success(`${data.message}，共创建 ${data.words_count} 条文案`)
  } catch (error) {
    console.error("提交错误:", error)
  } finally {
    submitting.value = false
  }
}

// 加载文案库数据
async function loadCopyLibrary(id: number) {
  try {
    const { data } = await getCopyLibraryDetailApi(id)
    const library = data

    // 填充基本信息
    copyLibraryName.value = library.name || ""
    currentLibraryId.value = library.id

    // 解析配置
    let config: any = {}
    try {
      config = JSON.parse(library.content || "{}")
    } catch (e) {
      console.error("解析配置失败:", e)
    }

    // 填充数据
    areasText.value = (config.areas || []).join("\n")
    keywordsText.value = (config.keywords || []).join("\n")
    suffixesText.value = (config.suffixes || []).join("\n")
    variable1.value = (config.variable1 || []).join("\n")
    variable2.value = (config.variable2 || []).join("\n")
    variable3.value = (config.variable3 || []).join("\n")
    showInWorkName.value = config.showInWorkName || false

    // 加载文案词条
    const wordsResponse = await getCopyWordListApi({
      copy_id: id,
      per_page: 10000 // 获取所有词条
    })

    if (wordsResponse.data && wordsResponse.data.items.length > 0) {
      const words = wordsResponse.data.items

      // 提取标题
      const titles = words.map(word => word.title).filter(t => t)
      combinedTitles.value = titles.join("\n")

      // 提取文案描述
      const descriptions = words.map(word => word.text).filter(t => t)
      combinedDescriptions.value = descriptions.join("\n")

      // 提取话题（需要解析JSON）
      const topicsSet = new Set<string>()
      words.forEach((word) => {
        if (word.topics) {
          try {
            const topicList = JSON.parse(word.topics)
            if (Array.isArray(topicList)) {
              topicList.forEach((topic: any) => {
                if (topic.name) {
                  topicsSet.add(topic.name)
                }
              })
            }
          } catch (e) {
            console.error("解析话题失败:", e)
          }
        }
      })
      topics.value = Array.from(topicsSet).join("\n")
    }
  } catch (error) {
    console.error("加载文案库失败:", error)
  }
}

// 组件挂载时检查URL参数
onMounted(() => {
  const id = route.query.id
  if (id) {
    loadCopyLibrary(Number(id))
  }
})
</script>

<template>
  <div class="copy-library-page">
    <div class="page-header">
      <h2>文案组合器</h2>
    </div>

    <div class="content-wrapper">
      <!-- 文案库名称 -->
      <div class="library-name-section">
        <div class="name-label">
          文案库名称
        </div>
        <el-input
          v-model="copyLibraryName"
          placeholder="请输入文案库名称"
          maxlength="200"
          show-word-limit
          style="max-width: 500px"
        />
      </div>

      <!-- 第一行：地区、主词、尾词 -->
      <el-row :gutter="16" class="input-row">
        <!-- 地区 -->
        <el-col :span="8">
          <div class="input-card">
            <div class="card-header">
              <el-input
                v-model="areaTitle"
                class="title-input"
                placeholder="字段名称"
                maxlength="10"
              />
              <span class="count">{{ areaCount }}/20</span>
            </div>

            <el-input
              v-model="areasText"
              type="textarea"
              :rows="5"
              placeholder="每行一个地区&#10;例如：&#10;上海&#10;黄浦&#10;徐汇"
            />

            <div class="card-footer">
              <el-button text type="primary" @click="selectAreas">
                选择地区
              </el-button>
              <el-button text type="primary" @click="shuffleAreas">
                乱序
              </el-button>
              <el-button text type="primary" @click="clearAreas">
                清空
              </el-button>
              <span class="line-count">{{ areaCount }}/100行</span>
            </div>
          </div>
        </el-col>

        <!-- 主词 -->
        <el-col :span="8">
          <div class="input-card">
            <div class="card-header">
              <el-input
                v-model="keywordTitle"
                class="title-input"
                placeholder="字段名称"
                maxlength="10"
              />
              <span class="count">{{ keywordCount }}/20</span>
            </div>

            <el-input
              v-model="keywordsText"
              type="textarea"
              :rows="5"
              placeholder="每行一个主词&#10;例如：&#10;主词1&#10;主词2&#10;主词3"
            />

            <div class="card-footer">
              <el-button text type="primary" @click="shuffleKeywords">
                乱序
              </el-button>
              <el-button text type="primary" @click="clearKeywords">
                清空
              </el-button>
              <span class="line-count">{{ keywordCount }}/100行</span>
            </div>
          </div>
        </el-col>

        <!-- 尾词 -->
        <el-col :span="8">
          <div class="input-card">
            <div class="card-header">
              <el-input
                v-model="suffixTitle"
                class="title-input"
                placeholder="字段名称"
                maxlength="10"
              />
              <span class="count">{{ suffixCount }}/20</span>
            </div>

            <el-input
              v-model="suffixesText"
              type="textarea"
              :rows="5"
              placeholder="每行一个尾词&#10;例如：&#10;尾词1&#10;尾词2&#10;尾词3"
            />

            <div class="card-footer">
              <el-button text type="primary" @click="shuffleSuffixes">
                乱序
              </el-button>
              <el-button text type="primary" @click="clearSuffixes">
                清空
              </el-button>
              <span class="line-count">{{ suffixCount }}/100行</span>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 第二行：变量1、变量2、变量3 -->
      <el-row :gutter="16" class="input-row">
        <!-- 变量1 -->
        <el-col :span="8">
          <div class="input-card">
            <div class="card-header">
              <el-input
                v-model="variable1Title"
                class="title-input"
                placeholder="字段名称"
                maxlength="10"
              />
              <span class="count">{{ variable1Count }}/20</span>
            </div>

            <el-input
              v-model="variable1"
              type="textarea"
              :rows="5"
              placeholder="非必填，上限100段/每段300字"
            />

            <div class="card-footer">
              <el-button text type="primary" @click="shuffleVariable(1)">
                乱序
              </el-button>
              <el-button text type="primary" @click="clearVariable(1)">
                清空
              </el-button>
              <span class="line-count">{{ variable1Count }}/100行</span>
            </div>
          </div>
        </el-col>

        <!-- 变量2 -->
        <el-col :span="8">
          <div class="input-card">
            <div class="card-header">
              <el-input
                v-model="variable2Title"
                class="title-input"
                placeholder="字段名称"
                maxlength="10"
              />
              <span class="count">{{ variable2Count }}/20</span>
            </div>

            <el-input
              v-model="variable2"
              type="textarea"
              :rows="5"
              placeholder="非必填，上限100段/每段300字"
            />

            <div class="card-footer">
              <el-button text type="primary" @click="shuffleVariable(2)">
                乱序
              </el-button>
              <el-button text type="primary" @click="clearVariable(2)">
                清空
              </el-button>
              <span class="line-count">{{ variable2Count }}/100行</span>
            </div>
          </div>
        </el-col>

        <!-- 变量3 -->
        <el-col :span="8">
          <div class="input-card">
            <div class="card-header">
              <el-input
                v-model="variable3Title"
                class="title-input"
                placeholder="字段名称"
                maxlength="10"
              />
              <span class="count">{{ variable3Count }}/20</span>
            </div>

            <el-input
              v-model="variable3"
              type="textarea"
              :rows="5"
              placeholder="非必填，上限100段/每段300字"
            />

            <div class="card-footer">
              <el-button text type="primary" @click="shuffleVariable(3)">
                乱序
              </el-button>
              <el-button text type="primary" @click="clearVariable(3)">
                清空
              </el-button>
              <span class="line-count">{{ variable3Count }}/100行</span>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 组合结果区域 -->
      <div class="result-section">
        <!-- 组合标题 -->
        <div class="result-card">
          <div class="card-header">
            <span class="title">组合标题</span>
            <span class="count">{{ titleCount }} 条</span>
          </div>

          <el-input
            v-model="combinedTitles"
            type="textarea"
            :rows="8"
            placeholder="点击【组合】按钮生成标题，也可以直接编辑&#10;每行一条标题"
          />

          <div class="card-footer">
            <el-button text type="primary" @click="combineTitles">
              组合
            </el-button>
            <el-button text type="primary" @click="clearCombinedTitles">
              清空
            </el-button>
          </div>
        </div>

        <!-- 文案描述 -->
        <div class="result-card">
          <div class="card-header">
            <span class="title">* 文案描述</span>
            <div class="switch-wrapper">
              <span>是否显示在作品名称</span>
              <el-switch v-model="showInWorkName" />
            </div>
            <span class="count">{{ descCount }} 条</span>
          </div>

          <el-input
            v-model="combinedDescriptions"
            type="textarea"
            :rows="8"
            placeholder="点击【组合】按钮生成描述，也可以直接编辑&#10;每行一条描述"
          />

          <div class="card-footer">
            <el-button text type="primary" @click="combineDescriptions">
              组合
            </el-button>
            <el-button text type="primary" @click="clearCombinedDescriptions">
              清空
            </el-button>
          </div>
        </div>

        <!-- 话题标签 -->
        <div class="result-card">
          <div class="card-header">
            <span class="title">* 话题标签</span>
            <span class="count">{{ topicCount }} 条</span>
          </div>

          <el-input
            v-model="topics"
            type="textarea"
            :rows="5"
            placeholder="点击【组合】按钮生成话题标签，也可以直接编辑&#10;每行一个话题，格式：地区主词尾词"
          />

          <div class="card-footer">
            <el-button text type="primary" @click="combineTopics">
              组合
            </el-button>
            <el-button text type="primary" @click="clearTopics">
              清空
            </el-button>
          </div>
        </div>

        <!-- 配置区域 -->
        <div class="config-section">
          <div class="config-item">
            <span class="config-label">话题标签数量</span>
            <el-select v-model="topicTagCount" placeholder="请选择" size="default" style="width: 150px">
              <el-option :value="1" label="1" />
              <el-option :value="2" label="2" />
              <el-option :value="3" label="3" />
              <el-option :value="4" label="4" />
              <el-option :value="5" label="5" />
            </el-select>
          </div>
        </div>
      </div>

      <!-- 提交按钮 -->
      <div class="submit-section">
        <el-button type="primary" size="large" :loading="submitting" @click="handleSubmit">
          {{ submitting ? '生成中...' : '提交生成' }}
        </el-button>
      </div>
    </div>

    <!-- 地区选择器 -->
    <AreaSelector v-model:visible="areaSelectorVisible" @confirm="handleAreaSelected" />

    <!-- 文案组合对话框 -->
    <CombineDialog
      v-model:visible="combineDialogVisible"
      :data-availability="dataAvailability"
      @confirm="handleCombineConfirm"
    />
  </div>
</template>

<style scoped lang="scss">
.copy-library-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;

  h2 {
    font-size: 24px;
    font-weight: 600;
    color: #333;
  }
}

.content-wrapper {
  background: white;
  padding: 24px;
  border-radius: 8px;
}

.input-row {
  margin-bottom: 16px;
}

.input-card {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 16px;
  background: #fafafa;

  .el-textarea {
    margin-bottom: 12px;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;

  .title {
    font-size: 14px;
    font-weight: 600;
    color: #333;
  }

  .title-input {
    width: 120px;

    :deep(.el-input__wrapper) {
      padding: 2px 8px;
      box-shadow: none;
      background: transparent;
      border-bottom: 1px dashed #dcdfe6;
      border-radius: 0;
      transition: all 0.3s;

      &:hover {
        border-bottom-color: #409eff;
      }
    }

    :deep(.el-input__inner) {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      text-align: left;
    }

    :deep(.el-input__wrapper.is-focus) {
      border-bottom-color: #409eff;
      box-shadow: none;
    }
  }

  .count {
    font-size: 12px;
    color: #999;
    margin-left: auto;
  }

  .switch-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
  }
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid #e4e7ed;

  .line-count {
    margin-left: auto;
    font-size: 12px;
    color: #999;
  }
}

.config-section {
  margin-top: 12px;
  padding: 16px 20px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  display: flex;
  gap: 24px;
  align-items: center;

  .config-item {
    display: flex;
    align-items: center;
    gap: 12px;

    .config-label {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      white-space: nowrap;
    }
  }
}

.result-section {
  margin-top: 24px;
}

.result-card {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 16px;
  background: #fafafa;
  margin-bottom: 16px;

  .el-textarea {
    margin-bottom: 12px;
  }
}

.library-name-section {
  margin-bottom: 24px;
  padding: 20px;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 4px;

  .name-label {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 12px;

    &::before {
      content: "*";
      color: #f56c6c;
      margin-right: 4px;
    }
  }
}

.submit-section {
  margin-top: 24px;
  text-align: center;
}
</style>
