<template>
  <teleport to="body">
    <div class="bingo-tooltip" v-show="show" :style="tooltipStyle" :key="tooltipKey">
      <strong>{{ title || 'Not set' }}</strong>
      <br>
      Points: <span class="points">{{ points || '0' }}</span>
    </div>
  </teleport>
</template>

<script>
export default {
  name: 'BingoCellTooltip',
  props: {
    show: Boolean,
    title: String,
    points: [Number, String],
    x: Number,
    y: Number
  },
  data() {
    return {
      tooltipKey: 0
    };
  },
  watch: {
    title() {
      this.tooltipKey++; // Force re-render when title changes
    },
    points() {
      this.tooltipKey++; // Force re-render when points change
    }
  },
  computed: {
    tooltipStyle() {
      if (!this.x || !this.y) return {};
      return {
        left: `${this.x}px`,
        top: `${this.y}px`
      };
    }
  }
}
</script>

<style>
.bingo-tooltip {
  position: fixed;
  background: linear-gradient(145deg, rgba(43, 24, 16, 0.95), rgba(25, 16, 5, 0.98));
  color: white;
  padding: 10px 15px;
  border-radius: 4px;
  font-size: 1.1rem;
  font-family: Arial, sans-serif;
  pointer-events: none;
  z-index: 3000;
  border: 1px solid rgba(255, 215, 0, 0.5);
  box-shadow: 
    0 4px 6px rgba(0, 0, 0, 0.2),
    0 0 15px rgba(238, 175, 17, 0.15);
  white-space: nowrap;
  transform: translate(-50%, calc(-100% + 10px));
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.bingo-tooltip strong {
  color: rgb(238, 175, 17);
  font-size: 1.2rem;
  font-family: Arial, sans-serif;
  display: block;
  margin-bottom: 4px;
}

.bingo-tooltip .points {
  color: rgb(238, 175, 17);
  font-weight: bold;
}

.bingo-tooltip::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid rgba(25, 16, 5, 0.98);
}
</style>
