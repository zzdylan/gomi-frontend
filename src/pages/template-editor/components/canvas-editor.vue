<template>
  <div class="canvas-editor">
    <div class="canvas-wrapper">
      <canvas ref="canvasEl" />
    </div>
  </div>
</template>

<script setup lang="ts">
const canvasEl = ref<HTMLCanvasElement>()

// 暴露 canvas 引用给父组件
defineExpose({
  canvasEl,
})
</script>

<style scoped lang="scss">
.canvas-editor {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  overflow: auto;
}

.canvas-wrapper {
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  background: #ffffff;
}

canvas {
  display: block;
  background: #ffffff;
}
</style>
