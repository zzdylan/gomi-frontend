# 字幕坐标与对齐系统说明

## 背景

前端编辑器画布尺寸为 360x640（FECanvas），阿里云 ICE 视频输出为 1080x1920（9:16）。ICE 字幕的 X、Y 接受 0~0.9999 的百分比值，Alignment 字段决定 X 坐标的锚点含义。

## 坐标系对照

| 层级 | X 含义 | 坐标范围 | Alignment |
|------|--------|---------|-----------|
| 编辑器内部（Konva） | 容器左边缘像素 | 0 ~ 360 | 通过 align 属性视觉对齐 |
| 编辑器内部（clip.X） | 锚点像素位置 | 0 ~ 360 | Left / Center / Right |
| 数据库 / ICE | 锚点百分比 | 0 ~ 1 | Left / Center / Right |

## 数据流

```
编辑器操作（像素）
    ↓ exportJSON: X / canvasWidth, Y / canvasHeight
数据库存储（百分比）
    ↓ 后端直接使用，不再转换
ICE 渲染（百分比）

数据库存储（百分比）
    ↓ loadFromJSON: X * canvasWidth, Y * canvasHeight
编辑器显示（像素）
```

转换在 `useTimeline.ts` 的 `exportJSON`（保存时像素→百分比）和 `loadFromJSON`（加载时百分比→像素）中完成。后端直接使用数据库中的百分比值，只做 Alignment 校验（`validateSubtitleAlignment`）。

## ICE Alignment 含义

ICE 的 Alignment 在指定了 X、Y 时，作用是**定义锚点**：

- `Left`：X 指向文字**左边缘**
- `Center`：X 指向文字**水平中心**
- `Right`：X 指向文字**右边缘**

Y 始终指向文字**顶部边缘**。

## 前端坐标体系

### clip.X 与 Konva container.x 的关系

Konva 的 `x` 属性始终是容器**左边缘**位置。但 clip.X 存储的是**锚点位置**（编辑器内为像素），二者需要根据 Alignment 和容器宽度互转：

```
clipX → containerX（渲染时）:
  Left:   containerX = clipX
  Center: containerX = clipX - width / 2
  Right:  containerX = clipX - width

containerX → clipX（拖拽/变换后保存）:
  Left:   clipX = containerX
  Center: clipX = containerX + width / 2
  Right:  clipX = containerX + width
```

其中 `width = measureTextWidth(clip) + TEXT_PADDING(40px)`。

### 切换对齐方式时保持位置不变

切换 Alignment 时，X 的含义变了，所以必须重新计算 X：

```
1. 用旧 Alignment + 旧 X 算出容器左边缘 containerLeft
2. 用新 Alignment + containerLeft 反算新 X
```

示例：文字宽度 100px，当前 Center、X=180

- 切到 Left：containerLeft = 180 - 50 = 130，新 X = 130
- 切到 Right：containerLeft = 180 - 50 = 130，新 X = 130 + 100 = 230

视觉上文字没动，只是锚点定义变了。

### 新建文字默认值

```typescript
createSubtitleClip() → { X: 180, Y: 150, Alignment: "Center" }
```

X=180 是 360px 画布的正中间，配合 Center 对齐，文字居中显示。

## 保存后的数据示例

画布 360x640：

| 编辑器值（像素） | 数据库/ICE 值（百分比） | ICE 渲染效果 |
|----------------|----------------------|-------------|
| X:180, Alignment:Center | X:0.5, Center | 文字中心在屏幕50% |
| X:0, Alignment:Left | X:0, Left | 文字左边缘贴左 |
| X:360, Alignment:Right | X:1.0, Right | 文字右边缘贴右 |
| X:100, Alignment:Center | X:0.278, Center | 文字中心在屏幕27.8% |

## FontSize 处理

FontSize 不需要手动缩放。ICE 通过 FECanvas 自动按比例放大：

```
FECanvas: 360x640, FontSize: 24
ICE 输出 1080x1920 时自动缩放: 24 * (1080/360) = 72
```

前端 `timeline_build.go` 会将模板的 FECanvas 透传到输出 Timeline，ICE 据此计算缩放比。

## 涉及文件

| 文件 | 职责 |
|------|------|
| `composables/useTimeline.ts` | 保存时像素→百分比，加载时百分比→像素 |
| `types/timeline.ts` | SubtitleTrackClip 类型定义，createSubtitleClip 默认值 |
| `components/canvas-editor-konva.vue` | Konva 渲染、拖拽、变换时的 clipX ↔ containerX 转换 |
| `components/property-panel-konva.vue` | 对齐切换时重算 X，属性面板输入 |
| `app/logic/xunclip/template_loader.go` | 后端 Alignment 校验（`validateSubtitleAlignment`） |
| `pkg/timeline/timeline.go` | SubtitleTrackClip 结构体（含 Alignment 字段） |
| `pkg/timeline/builder.go` | AddSubtitleClipWithStyle 完整拷贝样式字段 |
