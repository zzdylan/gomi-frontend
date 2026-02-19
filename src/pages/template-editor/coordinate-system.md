# 字幕坐标与对齐系统说明

## 背景

前端编辑器画布尺寸为 360x640（FECanvas），阿里云 ICE 视频输出为 1080x1920（9:16）。ICE 字幕的 X、Y 接受 0~0.9999 的百分比值，Alignment 字段决定 X 坐标的锚点含义。

## 三方坐标系对照

| 层级 | X 含义 | 坐标范围 | Alignment |
|------|--------|---------|-----------|
| 前端 Konva | 容器左边缘像素 | 0 ~ 360 | 通过 align 属性视觉对齐 |
| 前端存储（clip.X） | 锚点像素位置 | 0 ~ 360 | Left / Center / Right |
| 后端归一化后 | 锚点百分比 | 0 ~ 1 | Left / Center / Right |
| ICE 最终渲染 | 锚点百分比 | 0 ~ 1 | Left / Center / Right |

## ICE Alignment 含义

ICE 的 Alignment 在指定了 X、Y 时，作用是**定义锚点**：

- `Left`：X 指向文字**左边缘**
- `Center`：X 指向文字**水平中心**
- `Right`：X 指向文字**右边缘**

Y 始终指向文字**顶部边缘**。

## 前端坐标体系

### clip.X 与 Konva container.x 的关系

Konva 的 `x` 属性始终是容器**左边缘**位置。但 clip.X 存储的是**锚点位置**，二者需要根据 Alignment 和容器宽度互转：

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

## 后端归一化

文件：`app/logic/xunclip/template_loader.go` 的 `normalizeSubtitlePosition`

```
X(百分比) = X(像素) / FECanvas.Width
Y(百分比) = Y(像素) / FECanvas.Height
Alignment 直接透传
```

示例（画布 360x640）：

| 前端值 | 归一化后 | ICE 渲染效果 |
|-------|---------|-------------|
| X:180, Alignment:Center | X:0.5, Center | 文字中心在屏幕50% |
| X:0, Alignment:Left | X:0, Left | 文字左边缘贴左 |
| X:360, Alignment:Right | X:1.0, Right | 文字右边缘贴右 |
| X:100, Alignment:Center | X:0.278, Center | 文字中心在屏幕27.8% |

### 三个调用入口

1. **`extractStyleFromTimeline`** - 提取字幕/动态文案样式时归一化
2. **`BuildStaticTextTracks`** - 输出固定文字时归一化
3. 两处都调用同一个 `normalizeSubtitlePosition`

## FontSize 处理

FontSize 不需要手动缩放。ICE 通过 FECanvas 自动按比例放大：

```
FECanvas: 360x640, FontSize: 24
ICE 输出 1080x1920 时自动缩放: 24 * (1080/360) = 72
```

前端 timeline_build.go 会将模板的 FECanvas 透传到输出 Timeline，ICE 据此计算缩放比。

## 涉及文件

| 文件 | 职责 |
|------|------|
| `types/timeline.ts` | SubtitleTrackClip 类型定义，createSubtitleClip 默认值 |
| `components/canvas-editor-konva.vue` | Konva 渲染、拖拽、变换、导出时的坐标转换 |
| `components/property-panel-konva.vue` | 对齐切换时重算 X，属性面板输入 |
| `app/logic/xunclip/template_loader.go` | 后端像素→百分比归一化 |
| `pkg/timeline/timeline.go` | SubtitleTrackClip 结构体（含 Alignment 字段） |
| `pkg/timeline/builder.go` | AddSubtitleClipWithStyle 完整拷贝样式字段 |
