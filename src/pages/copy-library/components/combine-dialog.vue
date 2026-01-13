<script setup lang="ts">
import { computed, ref } from "vue"

// 接收数据可用性状态
const props = defineProps<{
  dataAvailability?: {
    area: boolean
    keyword: boolean
    suffix: boolean
    var1: boolean
    var2: boolean
    var3: boolean
  }
}>()

const emit = defineEmits<{
  confirm: [config: CombineConfig]
}>()

// 定义 props 和 emits
const visible = defineModel<boolean>("visible", { required: true })

// 组合元素
interface CombineElement {
  value: string
  operator: "*" | "+" // * = 排列组合, + = 一对一
}

// 组合配置
export interface CombineConfig {
  elements: CombineElement[] // 组合元素和连接符
  usageCount: number // 每个文案调用次数
  deduplicate: boolean // 是否去重
  sortType: "random" | "order" // 排序类型
}

// 组合元素配置
interface ElementConfig {
  label: string
  value: string
  checked: boolean
  operator: "*" | "+"
}

// 所有可用的组合元素
const elementConfigs = ref<ElementConfig[]>([
  { label: "地区", value: "area", checked: true, operator: "*" },
  { label: "主词", value: "keyword", checked: true, operator: "*" },
  { label: "尾词", value: "suffix", checked: true, operator: "*" },
  { label: "变量1", value: "var1", checked: false, operator: "*" },
  { label: "变量2", value: "var2", checked: false, operator: "*" },
  { label: "变量3", value: "var3", checked: false, operator: "*" }
])

// 每个文案调用次数
const usageCount = ref<number | undefined>(undefined)

// 是否去重
const deduplicate = ref(false)

// 排序类型
const sortType = ref<"random" | "order">("random")

// 获取选中的元素
const selectedElements = computed(() => {
  return elementConfigs.value
    .filter(el => el.checked)
    .map(el => ({ value: el.value, operator: el.operator }))
})

// 检查是否有任何可用数据
const hasAnyData = computed(() => {
  if (!props.dataAvailability) return true
  return Object.values(props.dataAvailability).includes(true)
})

// 确认
function handleConfirm() {
  const config: CombineConfig = {
    elements: selectedElements.value,
    usageCount: usageCount.value || 0,
    deduplicate: deduplicate.value,
    sortType: sortType.value
  }
  emit("confirm", config)
  visible.value = false
}

// 取消
function handleCancel() {
  visible.value = false
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="文案组合"
    width="800px"
    :close-on-click-modal="false"
  >
    <div class="combine-dialog">
      <!-- 组合模式 -->
      <div class="config-row mode-row">
        <span class="label">组合模式</span>
        <div class="mode-selector">
          <!-- 没有数据时的提示 -->
          <div v-if="!hasAnyData" class="no-data-tip">
            <el-alert type="warning" :closable="false" show-icon>
              <template #title>
                请先填写地区、主词、尾词或变量等文案内容
              </template>
            </el-alert>
          </div>

          <!-- 有数据时显示元素选择 -->
          <template v-else>
            <div
              v-for="(config, index) in elementConfigs"
              v-show="!props.dataAvailability || (props.dataAvailability as any)[config.value]"
              :key="config.value"
              class="element-item"
            >
              <!-- 勾选框 -->
              <el-checkbox v-model="config.checked">
                {{ config.label }}
              </el-checkbox>

              <!-- 连接符下拉（最后一个元素不显示，且只有选中时显示） -->
              <el-select
                v-if="config.checked && index < elementConfigs.length - 1"
                v-model="config.operator"
                size="small"
                style="width: 60px"
                class="operator-select"
              >
                <el-option label="×" value="*" />
                <el-option label="+" value="+" />
              </el-select>
            </div>
          </template>
        </div>
      </div>

      <!-- 每个文案调用次数 -->
      <div class="config-row">
        <span class="label">每个文案调用次数</span>
        <el-select v-model="usageCount" placeholder="请选择" style="width: 150px">
          <el-option :value="1" label="1" />
          <el-option :value="2" label="2" />
          <el-option :value="3" label="3" />
          <el-option :value="4" label="4" />
          <el-option :value="5" label="5" />
          <el-option :value="10" label="10" />
        </el-select>
      </div>

      <!-- 是否去重 -->
      <div class="config-row">
        <span class="label">是否去重</span>
        <el-radio-group v-model="deduplicate">
          <el-radio :value="true">
            去重
          </el-radio>
          <el-radio :value="false">
            不去重
          </el-radio>
        </el-radio-group>
      </div>

      <!-- 排序 -->
      <div class="config-row">
        <span class="label">排序</span>
        <el-radio-group v-model="sortType">
          <el-radio value="random">
            乱序
          </el-radio>
          <el-radio value="order">
            顺序
          </el-radio>
        </el-radio-group>
      </div>

      <!-- 规则说明 -->
      <div class="rules-info">
        <div class="rule-item">
          <strong>组合逻辑：</strong>根据用户勾选的变量顺序，按照循环进行拼接，提交结果需要回显
        </div>
        <div class="rule-item">
          <strong>排列组合：</strong>11, 12, 13, 14
        </div>
        <div class="rule-item">
          <strong>+一对一：</strong>11, 22, 33, 44
        </div>
        <div class="rule-item">
          <strong>变量使用次数：</strong>根据用户设置的次数进行调用，使用达到次数后，下一个组合不再使用这个变量值
        </div>
        <div class="rule-item">
          <strong>去重：</strong>生成出来的文案跟前面的文案进行比对，变量量复50%以上则丢弃重新组合下一条
        </div>
        <div class="rule-item">
          <strong>不去重：</strong>生成所有组合结果保留
        </div>
        <div class="rule-item">
          <strong>顺序：</strong>按照变量关键词的顺序，上限取1000
        </div>
        <div class="rule-item">
          <strong>乱序：</strong>生成所有结果后打乱，上限取1000
        </div>
        <div class="rule-item">
          <strong>话题标签数量：</strong>1-5由用户可以选择发布时的数量
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleCancel">
        取消
      </el-button>
      <el-button type="primary" @click="handleConfirm">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.combine-dialog {
  .config-row {
    display: flex;
    align-items: flex-start;
    margin-bottom: 20px;
    gap: 16px;

    .label {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      min-width: 140px;
      padding-top: 8px;
    }

    .mode-selector {
      flex: 1;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;

      .element-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .operator-select {
          flex-shrink: 0;
        }
      }
    }
  }

  .mode-row {
    .mode-selector {
      grid-template-columns: repeat(3, 1fr);

      .no-data-tip {
        grid-column: 1 / -1;
      }
    }
  }

  .rules-info {
    margin-top: 24px;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 4px;

    .rule-item {
      font-size: 13px;
      line-height: 1.8;
      color: #606266;
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }

      strong {
        color: #303133;
      }
    }
  }
}
</style>
