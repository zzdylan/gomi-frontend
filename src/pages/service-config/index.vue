<script lang="ts" setup>
import type { AliyunIceConfigJSON, AliyunOssConfigJSON, LocalConfigJSON, MicrosoftTtsConfigJSON, MinioConfigJSON, VolcengineTtsConfigJSON } from "./apis/type"
import { getServiceConfigApi, saveServiceConfigApi } from "./apis"

defineOptions({
  name: "ServiceConfigManagement"
})

// 配置类型选项
const CONFIG_TYPES = [
  { label: "存储配置", value: "storage" },
  { label: "ICE媒体服务", value: "ice" },
  { label: "TTS语音合成", value: "tts" }
]

// 存储驱动选项
const STORAGE_DRIVERS = [
  { label: "本地存储", value: "local" },
  { label: "MinIO", value: "minio" },
  { label: "阿里云OSS", value: "aliyun_oss" }
]

// ICE驱动选项
const ICE_DRIVERS = [
  { label: "阿里云ICE", value: "aliyun_ice" }
]

// TTS驱动选项
const TTS_DRIVERS = [
  { label: "火山引擎", value: "volcengine" },
  { label: "微软", value: "microsoft" }
]

// 当前选择的配置类型
const currentType = ref("storage")
const loading = ref(false)
const saving = ref(false)
const configId = ref<number>(0)

// 通用表单数据
const driver = ref("")
const remark = ref("")

// 各驱动配置数据
const localConfig = reactive<LocalConfigJSON>({
  root: "",
  url: ""
})

const minioConfig = reactive<MinioConfigJSON>({
  access_key: "",
  secret_key: "",
  region: "",
  bucket: "",
  url: "",
  endpoint: "",
  ssl: false
})

const aliyunOssConfig = reactive<AliyunOssConfigJSON>({
  access_key_id: "",
  access_key_secret: "",
  bucket: "",
  url: "",
  endpoint: ""
})

const aliyunIceConfig = reactive<AliyunIceConfigJSON>({
  access_key_id: "",
  access_key_secret: "",
  endpoint: "",
  callback_url: "",
  callback_secret: ""
})

const volcengineTtsConfig = reactive<VolcengineTtsConfigJSON>({
  app_id: "",
  token: "",
  cluster: ""
})

const microsoftTtsConfig = reactive<MicrosoftTtsConfigJSON>({
  region: "",
  api_key: ""
})

// 获取当前类型的驱动选项
const currentDriverOptions = computed(() => {
  switch (currentType.value) {
    case "storage":
      return STORAGE_DRIVERS
    case "ice":
      return ICE_DRIVERS
    case "tts":
      return TTS_DRIVERS
    default:
      return []
  }
})

// 重置表单
function resetForm() {
  configId.value = 0
  driver.value = ""
  remark.value = ""
  Object.assign(localConfig, { root: "", url: "" })
  Object.assign(minioConfig, { access_key: "", secret_key: "", region: "", bucket: "", url: "", endpoint: "", ssl: false })
  Object.assign(aliyunOssConfig, { access_key_id: "", access_key_secret: "", bucket: "", url: "", endpoint: "" })
  Object.assign(aliyunIceConfig, { access_key_id: "", access_key_secret: "", endpoint: "", callback_url: "", callback_secret: "" })
  Object.assign(volcengineTtsConfig, { app_id: "", token: "", cluster: "" })
  Object.assign(microsoftTtsConfig, { region: "", api_key: "" })
}

// 获取当前驱动的配置对象
function getCurrentDriverConfig() {
  switch (driver.value) {
    case "local":
      return localConfig
    case "minio":
      return minioConfig
    case "aliyun_oss":
      return aliyunOssConfig
    case "aliyun_ice":
      return aliyunIceConfig
    case "volcengine":
      return volcengineTtsConfig
    case "microsoft":
      return microsoftTtsConfig
    default:
      return null
  }
}

// 各类型的默认驱动
const DEFAULT_DRIVERS: Record<string, string> = {
  storage: "aliyun_oss",
  ice: "aliyun_ice",
  tts: "volcengine"
}

// 加载配置
async function loadConfig() {
  loading.value = true

  try {
    const res = await getServiceConfigApi(currentType.value)
    const config = res.data.config

    // API 返回后再重置并填充数据
    resetForm()

    if (config) {
      configId.value = config.id
      driver.value = config.driver
      remark.value = config.remark || ""

      // 解析配置JSON并填充对应的配置对象
      if (config.config) {
        try {
          const configJson = JSON.parse(config.config)
          const targetConfig = getCurrentDriverConfig()
          if (targetConfig) {
            Object.assign(targetConfig, configJson)
          }
        } catch (e) {
          console.error("解析配置JSON失败", e)
        }
      }
    } else {
      // 没有配置时设置默认驱动
      driver.value = DEFAULT_DRIVERS[currentType.value] || ""
    }
  } catch (error) {
    console.error("加载配置失败", error)
  } finally {
    loading.value = false
  }
}

// 保存配置
async function handleSave() {
  if (!driver.value) {
    ElMessage.warning("请选择驱动类型")
    return
  }

  saving.value = true

  try {
    const driverConfig = getCurrentDriverConfig()
    const configJson = JSON.stringify(driverConfig)

    await saveServiceConfigApi(currentType.value, {
      driver: driver.value,
      config: configJson,
      remark: remark.value
    })

    ElMessage.success("保存成功")
    loadConfig()
  } catch (error) {
    console.error("保存失败", error)
  } finally {
    saving.value = false
  }
}

// 切换配置类型时重新加载
watch(currentType, () => {
  loadConfig()
})

// 初始加载
onMounted(() => {
  loadConfig()
})
</script>

<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>服务配置</span>
        </div>
      </template>

      <!-- 配置类型选择 -->
      <el-tabs v-model="currentType" class="config-tabs">
        <el-tab-pane
          v-for="item in CONFIG_TYPES"
          :key="item.value"
          :label="item.label"
          :name="item.value"
        />
      </el-tabs>

      <el-form
        v-loading="loading"
        label-width="120px"
        style="max-width: 600px; margin-top: 20px; min-height: 200px;"
      >
        <template v-if="!loading">
          <!-- 驱动选择 -->
          <el-form-item label="驱动类型" required>
            <el-select v-model="driver" placeholder="请选择驱动类型" style="width: 100%">
              <el-option
                v-for="item in currentDriverOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <!-- 本地存储配置 -->
          <template v-if="driver === 'local'">
            <el-form-item label="存储根目录" required>
              <el-input v-model="localConfig.root" placeholder="如：./storage/app" />
            </el-form-item>
            <el-form-item label="访问URL" required>
              <el-input v-model="localConfig.url" placeholder="如：http://localhost:3000/storage" />
            </el-form-item>
          </template>

          <!-- MinIO配置 -->
          <template v-if="driver === 'minio'">
            <el-form-item label="Access Key" required>
              <el-input v-model="minioConfig.access_key" placeholder="MinIO Access Key" />
            </el-form-item>
            <el-form-item label="Secret Key" required>
              <el-input v-model="minioConfig.secret_key" type="password" show-password placeholder="MinIO Secret Key" />
            </el-form-item>
            <el-form-item label="Region">
              <el-input v-model="minioConfig.region" placeholder="如：us-east-1" />
            </el-form-item>
            <el-form-item label="Bucket" required>
              <el-input v-model="minioConfig.bucket" placeholder="存储桶名称" />
            </el-form-item>
            <el-form-item label="访问URL" required>
              <el-input v-model="minioConfig.url" placeholder="如：http://localhost:9000" />
            </el-form-item>
            <el-form-item label="Endpoint" required>
              <el-input v-model="minioConfig.endpoint" placeholder="如：localhost:9000" />
            </el-form-item>
            <el-form-item label="使用SSL">
              <el-switch v-model="minioConfig.ssl" />
            </el-form-item>
          </template>

          <!-- 阿里云OSS配置 -->
          <template v-if="driver === 'aliyun_oss'">
            <el-form-item label="AccessKey ID" required>
              <el-input v-model="aliyunOssConfig.access_key_id" placeholder="阿里云AccessKey ID" />
            </el-form-item>
            <el-form-item label="AccessKey Secret" required>
              <el-input v-model="aliyunOssConfig.access_key_secret" type="password" show-password placeholder="阿里云AccessKey Secret" />
            </el-form-item>
            <el-form-item label="Bucket" required>
              <el-input v-model="aliyunOssConfig.bucket" placeholder="OSS存储桶名称" />
            </el-form-item>
            <el-form-item label="访问URL" required>
              <el-input v-model="aliyunOssConfig.url" placeholder="如：https://bucket.oss-cn-shanghai.aliyuncs.com" />
            </el-form-item>
            <el-form-item label="Endpoint" required>
              <el-input v-model="aliyunOssConfig.endpoint" placeholder="如：oss-cn-shanghai.aliyuncs.com" />
            </el-form-item>
          </template>

          <!-- 阿里云ICE配置 -->
          <template v-if="driver === 'aliyun_ice'">
            <el-form-item label="AccessKey ID" required>
              <el-input v-model="aliyunIceConfig.access_key_id" placeholder="阿里云AccessKey ID" />
            </el-form-item>
            <el-form-item label="AccessKey Secret" required>
              <el-input v-model="aliyunIceConfig.access_key_secret" type="password" show-password placeholder="阿里云AccessKey Secret" />
            </el-form-item>
            <el-form-item label="Endpoint" required>
              <el-input v-model="aliyunIceConfig.endpoint" placeholder="如：ice.cn-shanghai.aliyuncs.com" />
            </el-form-item>
            <el-form-item label="回调地址">
              <el-input v-model="aliyunIceConfig.callback_url" placeholder="任务完成回调URL" />
            </el-form-item>
            <el-form-item label="回调密钥">
              <el-input v-model="aliyunIceConfig.callback_secret" type="password" show-password placeholder="回调签名密钥" />
            </el-form-item>
          </template>

          <!-- 火山引擎TTS配置 -->
          <template v-if="driver === 'volcengine'">
            <el-form-item label="应用ID" required>
              <el-input v-model="volcengineTtsConfig.app_id" placeholder="火山引擎应用ID" />
            </el-form-item>
            <el-form-item label="Access Token" required>
              <el-input v-model="volcengineTtsConfig.token" type="password" show-password placeholder="Access Token" />
            </el-form-item>
            <el-form-item label="集群" required>
              <el-input v-model="volcengineTtsConfig.cluster" placeholder="如：volcano_tts" />
            </el-form-item>
          </template>

          <!-- 微软TTS配置 -->
          <template v-if="driver === 'microsoft'">
            <el-form-item label="区域" required>
              <el-input v-model="microsoftTtsConfig.region" placeholder="如：eastasia" />
            </el-form-item>
            <el-form-item label="API密钥" required>
              <el-input v-model="microsoftTtsConfig.api_key" type="password" show-password placeholder="Microsoft Azure API Key" />
            </el-form-item>
          </template>

          <!-- 备注 -->
          <el-form-item v-if="driver" label="备注">
            <el-input v-model="remark" type="textarea" :rows="2" placeholder="配置备注（可选）" />
          </el-form-item>

          <!-- 保存按钮 -->
          <el-form-item v-if="driver">
            <el-button type="primary" :loading="saving" @click="handleSave">
              保存配置
            </el-button>
          </el-form-item>
        </template>
      </el-form>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.app-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.config-tabs {
  margin-bottom: 10px;
}
</style>
