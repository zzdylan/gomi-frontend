<script setup lang="ts">
import { provinceAndCityData } from "element-china-area-data"
import { ref } from "vue"

const emit = defineEmits<{
  confirm: [areas: string[]]
}>()
// 定义 props 和 emits
const visible = defineModel<boolean>("visible", { required: true })
// 已选择的省份
const selectedProvinces = ref<string[]>([])

// 输出格式
const outputFormat = ref<string>("with_district")

// 地理区域分组
interface RegionData {
  name: string
  provinces: string[]
}

// 中国地理区域划分（简化的省份名称）
const regions: RegionData[] = [
  {
    name: "华北地区",
    provinces: ["北京", "天津", "河北", "山西", "内蒙古"]
  },
  {
    name: "华东地区",
    provinces: ["上海", "江苏", "浙江", "安徽", "福建", "江西", "山东"]
  },
  {
    name: "西南地区",
    provinces: ["重庆", "四川", "贵州", "云南", "西藏"]
  },
  {
    name: "东北地区",
    provinces: ["辽宁", "吉林", "黑龙江"]
  },
  {
    name: "华中地区",
    provinces: ["河南", "湖北", "湖南"]
  },
  {
    name: "华南地区",
    provinces: ["广东", "广西", "海南"]
  },
  {
    name: "西北地区",
    provinces: ["陕西", "甘肃", "青海", "宁夏", "新疆"]
  },
  {
    name: "港澳台地区",
    provinces: ["香港", "澳门", "台湾"]
  }
]

// 简化省份名称（去掉"省"、"市"、"区"、"自治区"等后缀）
function simplifyProvinceName(fullName: string): string {
  return fullName
    .replace(/省$/, "")
    .replace(/市$/, "")
    .replace(/区$/, "")
    .replace(/县$/, "")
    .replace(/自治区$/, "")
    .replace(/特别行政区$/, "")
    .replace(/壮族/, "")
    .replace(/回族/, "")
    .replace(/维吾尔/, "")
}

// 检查地区是否全选
function isRegionFullySelected(region: RegionData): boolean {
  return region.provinces.every(p => selectedProvinces.value.includes(p))
}

// 检查地区是否部分选中
function isRegionIndeterminate(region: RegionData): boolean {
  const selectedCount = region.provinces.filter(p => selectedProvinces.value.includes(p)).length
  return selectedCount > 0 && selectedCount < region.provinces.length
}

// 切换省份选择
function toggleProvince(province: string) {
  const index = selectedProvinces.value.indexOf(province)
  if (index > -1) {
    selectedProvinces.value.splice(index, 1)
  } else {
    selectedProvinces.value.push(province)
  }
}

// 切换地区选择
function toggleRegion(region: RegionData, checked: boolean) {
  if (checked) {
    // 全选该地区的所有省份
    region.provinces.forEach((province) => {
      if (!selectedProvinces.value.includes(province)) {
        selectedProvinces.value.push(province)
      }
    })
  } else {
    // 取消选择该地区的所有省份
    region.provinces.forEach((province) => {
      const index = selectedProvinces.value.indexOf(province)
      if (index > -1) {
        selectedProvinces.value.splice(index, 1)
      }
    })
  }
}

// 全选
function selectAll() {
  selectedProvinces.value = regions.flatMap(r => r.provinces)
}

// 确认选择
function handleConfirm() {
  const result: string[] = []

  selectedProvinces.value.forEach((provinceName) => {
    // 从 provinceAndCityData 中找到对应的省份数据
    const provinceData = provinceAndCityData.find((item) => {
      const simplifiedName = simplifyProvinceName(item.label)
      return simplifiedName === provinceName
    })

    if (!provinceData) {
      // 如果找不到省份数据，只返回省份名
      result.push(provinceName)
      return
    }

    switch (outputFormat.value) {
      case "with_district":
        // 包含所辖区县：返回所有省、市、区县
        result.push(provinceName) // 省份
        if (provinceData.children) {
          provinceData.children.forEach((city) => {
            const cityName = simplifyProvinceName(city.label)
            result.push(cityName) // 城市
            if (city.children) {
              city.children.forEach((district) => {
                result.push(simplifyProvinceName(district.label)) // 区县
              })
            }
          })
        }
        break

      case "no_district":
        // 不包含所辖区县：只返回省、市
        result.push(provinceName) // 省份
        if (provinceData.children) {
          provinceData.children.forEach((city) => {
            result.push(simplifyProvinceName(city.label)) // 城市
          })
        }
        break

      case "province_city":
        // 省+市：返回"省份+城市"格式
        if (provinceData.children) {
          provinceData.children.forEach((city) => {
            const cityName = simplifyProvinceName(city.label)
            result.push(`${provinceName}${cityName}`)
          })
        }
        break

      case "city_district":
        // 市+区县：返回"城市+区县"格式
        if (provinceData.children) {
          provinceData.children.forEach((city) => {
            const cityName = simplifyProvinceName(city.label)
            if (city.children) {
              city.children.forEach((district) => {
                const districtName = simplifyProvinceName(district.label)
                result.push(`${cityName}${districtName}`)
              })
            } else {
              // 如果没有区县，只返回城市名
              result.push(cityName)
            }
          })
        }
        break

      default:
        result.push(provinceName)
    }
  })

  emit("confirm", result)
  visible.value = false
  selectedProvinces.value = []
  outputFormat.value = "with_district"
}

// 取消
function handleCancel() {
  visible.value = false
  selectedProvinces.value = []
  outputFormat.value = "with_district"
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="地区选择"
    width="700px"
    :close-on-click-modal="false"
  >
    <div class="area-selector">
      <!-- 输出格式选择 -->
      <div class="output-format">
        <span class="label">地区精确度</span>
        <el-radio-group v-model="outputFormat" size="small">
          <el-radio value="with_district">
            包含所辖区县
          </el-radio>
          <el-radio value="no_district">
            不包含所辖区县
          </el-radio>
          <el-radio value="province_city">
            省+市
          </el-radio>
          <el-radio value="city_district">
            市+区县
          </el-radio>
        </el-radio-group>
      </div>

      <!-- 地区省份选择 -->
      <div class="regions-container">
        <div v-for="region in regions" :key="region.name" class="region-section">
          <div class="region-header">
            <el-checkbox
              :model-value="isRegionFullySelected(region)"
              :indeterminate="isRegionIndeterminate(region)"
              @change="(val) => toggleRegion(region, val as boolean)"
            >
              {{ region.name }}
            </el-checkbox>
          </div>
          <div class="provinces-grid">
            <el-checkbox
              v-for="province in region.provinces"
              :key="province"
              :model-value="selectedProvinces.includes(province)"
              @change="toggleProvince(province)"
            >
              {{ province }}
            </el-checkbox>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="footer-actions">
        <el-button text @click="selectAll">
          全选
        </el-button>
        <div class="right-actions">
          <el-button @click="handleCancel">
            取消
          </el-button>
          <el-button type="primary" @click="handleConfirm">
            确定
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.area-selector {
  .output-format {
    padding: 16px;
    background: #f5f7fa;
    border-radius: 4px;
    margin-bottom: 16px;

    .label {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      margin-right: 16px;
    }

    .el-radio-group {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 16px;
    }
  }

  .regions-container {
    max-height: 500px;
    overflow-y: auto;
    padding: 0 4px;

    .region-section {
      margin-bottom: 20px;

      &:last-child {
        margin-bottom: 0;
      }

      .region-header {
        margin-bottom: 12px;
        padding: 8px 12px;
        background: #f5f7fa;
        border-radius: 4px;

        :deep(.el-checkbox) {
          font-weight: 600;
          font-size: 14px;

          .el-checkbox__label {
            color: #303133;
          }
        }
      }

      .provinces-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 12px 16px;
        padding: 8px 12px;

        :deep(.el-checkbox) {
          margin-right: 0;

          .el-checkbox__label {
            font-size: 14px;
            color: #606266;
          }
        }
      }
    }
  }
}

.footer-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  .right-actions {
    display: flex;
    gap: 8px;
  }
}
</style>
