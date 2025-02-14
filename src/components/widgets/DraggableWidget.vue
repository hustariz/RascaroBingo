<template>
  <vue-draggable-resizable
    :x="x"
    :y="y"
    :width="width"
    :height="height"
    :min-width="200"
    :min-height="200"
    :draggable="true"
    :resizable="true"
    :parent="true"
    class-name="widget"
    @dragging="onDrag"
    @resizing="onResize"
  >
    <div class="widget-header">
      <div class="widget-title">{{ title }}</div>
      <div class="widget-controls">
        <button class="control-button" @click="$emit('close')">×</button>
      </div>
    </div>
    <div class="widget-content">
      <slot></slot>
    </div>
  </vue-draggable-resizable>
</template>

<script>
import VueDraggableResizable from 'vue3-draggable-resizable'
import 'vue3-draggable-resizable/dist/Vue3DraggableResizable.css'

export default {
  name: 'DraggableWidget',
  components: {
    VueDraggableResizable
  },
  props: {
    title: {
      type: String,
      default: 'Widget'
    },
    initialX: {
      type: Number,
      default: 0
    },
    initialY: {
      type: Number,
      default: 0
    },
    initialWidth: {
      type: Number,
      default: 300
    },
    initialHeight: {
      type: Number,
      default: 200
    }
  },
  data() {
    return {
      x: this.initialX,
      y: this.initialY,
      width: this.initialWidth,
      height: this.initialHeight
    }
  },
  methods: {
    onDrag(x, y) {
      this.x = x
      this.y = y
      this.$emit('position-changed', { x, y })
    },
    onResize(x, y, width, height) {
      this.x = x
      this.y = y
      this.width = width
      this.height = height
      this.$emit('size-changed', { width, height })
    }
  }
}
</script>

<style scoped>
@import '@/assets/styles/widgets/common.css';
@import '@/assets/styles/widgets/DraggableWidget.css';

.widget {
  background: linear-gradient(145deg, rgba(43, 24, 16, 0.7), rgba(25, 16, 5, 0.9));
  border: 1px solid rgba(255, 215, 0, 0.5);
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  width: 100%;
  height: 100%;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(43, 24, 16, 0.9);
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
  cursor: move;
}

.widget-title {
  color: rgb(238, 175, 17);
  font-weight: 600;
  font-size: 1rem;
}

.widget-controls {
  display: flex;
  gap: 4px;
}

.control-button {
  background: none;
  border: none;
  color: rgb(238, 175, 17);
  cursor: pointer;
  font-size: 1.2rem;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.control-button:hover {
  background-color: rgba(238, 175, 17, 0.2);
}

.widget-content {
  padding: 12px;
  height: calc(100% - 45px);
  overflow: auto;
  color: #fff;
}

/* Override some of the default vue3-draggable-resizable styles */
:deep(.vdr-container) {
  border: none !important;
}

:deep(.vdr-handle) {
  border-radius: 2px !important;
  background: rgba(255, 215, 0, 0.8) !important;
  border: none !important;
}

:deep(.vdr-handle:hover) {
  background: rgb(255, 215, 0) !important;
}
</style>
