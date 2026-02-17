import type {
  AspectRatio,
  Config,
  GlobalSettings,
  LocalSettings,
  MaterialInfo,
  SceneConfig,
  SceneTypeValue,
  VoiceSettings,
  XunProjectItem
} from "../apis/type"
import type { MaterialItem } from "@/pages/material/apis/type"
import { batchInfoMaterialApi } from "@/pages/material/apis"
import { SceneType } from "../apis/type"

/** 默认配音设置 */
function defaultVoiceSettings(): VoiceSettings {
  return {
    speakers: [],
    speed_ratio: 1.0,
    volume_ratio: 1.0,
    pitch_ratio: 1.0
  }
}

/** 默认全局设置 */
function defaultGlobalSettings(): GlobalSettings {
  return {
    mode: "follow_material",
    allow_repeat: false,
    template_ids: [],
    copy: {
      copy_id: undefined,
      show_subtitle: true
    },
    voice: defaultVoiceSettings(),
    background: {
      musics: [],
      music_volume: 0.3,
      enable_blur: false
    }
  }
}

/** 默认局部设置 */
function defaultLocalSettings(): LocalSettings {
  return {
    mode: "follow_material",
    copy_id: undefined,
    duration: 0
  }
}

/** 创建默认场景 */
function createScene(type: SceneTypeValue, isGlobal: boolean): SceneConfig {
  return {
    type,
    materials: [],
    local_settings: isGlobal ? null : defaultLocalSettings()
  }
}

export function useXunclipForm() {
  // 项目元数据
  const projectId = ref<number | null>(null)
  const projectTitle = ref("未命名工程")
  const aspect = ref<AspectRatio>("9:16")

  // 模式：全局 vs 局部
  const isGlobalMode = ref(true)

  // 场景列表
  const scenes = ref<SceneConfig[]>([
    createScene(SceneType.Main, true)
  ])
  const selectedSceneIndex = ref(0)

  // 全局设置
  const globalSettings = reactive<GlobalSettings>(defaultGlobalSettings())

  // 当前选中的场景（计算属性）
  const selectedScene = computed(() => scenes.value[selectedSceneIndex.value])

  // 是否已有片头/片尾
  const hasOpening = computed(() => scenes.value.some(s => s.type === SceneType.Opening))
  const hasEnding = computed(() => scenes.value.some(s => s.type === SceneType.Ending))

  // 选择场景
  function selectScene(index: number) {
    if (index >= 0 && index < scenes.value.length) {
      selectedSceneIndex.value = index
    }
  }

  // 添加场景（片头插入最前面，片尾插入最后面，正片插入片尾前面）
  function addScene(type: SceneTypeValue = SceneType.Main) {
    // 片头/片尾只能各一个
    if (type === SceneType.Opening && hasOpening.value) {
      return
    }
    if (type === SceneType.Ending && hasEnding.value) {
      return
    }

    const scene = createScene(type, isGlobalMode.value)

    if (type === SceneType.Opening) {
      scenes.value.unshift(scene)
      selectedSceneIndex.value = 0
    } else if (type === SceneType.Ending) {
      scenes.value.push(scene)
      selectedSceneIndex.value = scenes.value.length - 1
    } else {
      // 正片：插入到片尾之前（如有片尾），否则插入末尾
      const endingIndex = scenes.value.findIndex(s => s.type === SceneType.Ending)
      if (endingIndex >= 0) {
        scenes.value.splice(endingIndex, 0, scene)
        selectedSceneIndex.value = endingIndex
      } else {
        scenes.value.push(scene)
        selectedSceneIndex.value = scenes.value.length - 1
      }
    }
  }

  // 删除场景
  function removeScene(index: number) {
    if (scenes.value.length <= 1) return
    scenes.value.splice(index, 1)
    if (selectedSceneIndex.value >= scenes.value.length) {
      selectedSceneIndex.value = scenes.value.length - 1
    }
  }

  // 添加素材到当前场景
  function addMaterialToScene(material: MaterialItem) {
    const scene = selectedScene.value
    if (!scene) return

    const info: MaterialInfo = {
      id: material.id,
      url: material.url,
      cover_url: material.cover_url,
      duration: material.duration ?? 0,
      width: material.width ?? 0,
      height: material.height ?? 0,
      media_type: material.type
    }
    scene.materials.push(info)
  }

  // 从当前场景移除素材
  function removeMaterialFromScene(materialIndex: number) {
    const scene = selectedScene.value
    if (!scene) return
    scene.materials.splice(materialIndex, 1)
  }

  // 切换模式
  function toggleMode() {
    isGlobalMode.value = !isGlobalMode.value
    for (const scene of scenes.value) {
      if (isGlobalMode.value) {
        scene.local_settings = null
      } else {
        scene.local_settings = defaultLocalSettings()
      }
    }
  }

  // 构建 Config JSON（不存临时URL，加载时实时获取）
  function buildConfig(): Config {
    return {
      scenes: scenes.value.map(s => ({
        type: s.type,
        materials: s.materials.map(m => ({
          id: m.id,
          duration: m.duration,
          width: m.width,
          height: m.height,
          media_type: m.media_type
        })),
        local_settings: s.local_settings
      })),
      settings: { ...globalSettings },
      global: isGlobalMode.value
    }
  }

  // 从已有工程加载
  async function loadFromProject(project: XunProjectItem) {
    projectId.value = project.id
    projectTitle.value = project.title
    aspect.value = project.aspect

    if (!project.content) return

    try {
      const config: Config = JSON.parse(project.content)
      scenes.value = config.scenes
      isGlobalMode.value = config.global

      // 加载全局设置
      Object.assign(globalSettings, defaultGlobalSettings(), config.settings)

      // 确保选中索引有效
      if (selectedSceneIndex.value >= scenes.value.length) {
        selectedSceneIndex.value = 0
      }

      // 收集所有素材ID，批量获取最新URL
      const idSet = new Set<number>()
      for (const scene of config.scenes) {
        for (const m of scene.materials) {
          idSet.add(m.id)
        }
      }
      if (idSet.size > 0) {
        const { data } = await batchInfoMaterialApi({ ids: [...idSet] })
        const infoMap = new Map<number, { url: string, cover_url?: string, type: string }>()
        for (const m of data.materials) {
          infoMap.set(m.id, { url: m.url, cover_url: m.cover_url, type: m.type })
        }
        // 回填 URL、封面、类型
        for (const scene of scenes.value) {
          for (const m of scene.materials) {
            const info = infoMap.get(m.id)
            if (info) {
              m.url = info.url
              m.cover_url = info.cover_url
              m.media_type = info.type as MaterialInfo["media_type"]
            }
          }
        }
      }
    } catch {
      console.error("解析工程配置失败")
    }
  }

  // 校验
  function validate(): { valid: boolean, message: string } {
    if (!projectTitle.value.trim()) {
      return { valid: false, message: "请输入工程标题" }
    }
    if (scenes.value.length === 0) {
      return { valid: false, message: "请至少添加一个场景" }
    }
    for (let i = 0; i < scenes.value.length; i++) {
      if (scenes.value[i].materials.length === 0) {
        return { valid: false, message: `场景 ${i + 1} 没有添加素材` }
      }
    }
    return { valid: true, message: "" }
  }

  return {
    // 元数据
    projectId,
    projectTitle,
    aspect,
    // 模式
    isGlobalMode,
    // 场景
    scenes,
    selectedSceneIndex,
    selectedScene,
    hasOpening,
    hasEnding,
    // 全局设置
    globalSettings,
    // 操作
    selectScene,
    addScene,
    removeScene,
    addMaterialToScene,
    removeMaterialFromScene,
    toggleMode,
    // 序列化
    buildConfig,
    loadFromProject,
    // 校验
    validate
  }
}
