<template>
  <div class="bingo-grid">
    <div 
      v-for="(cell, index) in cells" 
      :key="index" 
      class="bingo-cell" 
      :class="{ 'selected': cell.selected }"
    >
      <!-- Info zone (top) -->
      <div class="cell-info-zone" 
           @mouseenter="showTooltip($event, index)"
           @mouseleave="hideTooltip"
           @mousemove="updateTooltipPosition($event)">
        <div class="tooltip" v-show="tooltipVisible === index">
          <strong>{{ cell.title || 'Not set' }}</strong>
          <br>
          Points: <span class="points">{{ cell.points || '0' }}</span>
        </div>
      </div>
      
      <!-- Content zone (middle) -->
      <div class="cell-content" @click="$emit('cell-click', index)">
        {{ index + 1 }}
      </div>
      
      <!-- Edit zone (bottom) -->
      <div class="cell-edit-zone" @click.stop="$emit('cell-edit', index)"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BingoGrid',
  props: {
    cells: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      tooltipVisible: null,
      tooltipX: 0,
      tooltipY: 0
    }
  },
  computed: {
    tooltipStyle() {
      return {
        left: `${this.tooltipX}px`,
        top: `${this.tooltipY}px`
      }
    }
  },
  methods: {
    showTooltip(event, index) {
      this.tooltipVisible = index;
      this.updateTooltipPosition(event);
    },
    hideTooltip() {
      this.tooltipVisible = null;
    },
    updateTooltipPosition(event) {
      if (this.tooltipVisible !== null) {
        this.tooltipX = event.clientX;
        this.tooltipY = event.clientY;
      }
    }
  }
}
</script>

<style>
.bingo-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  padding: 8px;
  background: #1a1a1a;
  border-radius: 8px;
}

.bingo-cell {
  position: relative;
  aspect-ratio: 1;
  background: #2a2a2a;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s ease;
}

.bingo-cell.selected {
  background: #3a3a3a;
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.2);
}

.cell-info-zone {
  height: 20%;
  background: rgba(0, 0, 0, 0.2);
  cursor: help;
}

.cell-content {
  height: 60%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2em;
  color: #fff;
  cursor: pointer;
}

.cell-edit-zone {
  height: 20%;
  background: rgba(0, 0, 0, 0.2);
  cursor: pointer;
}

.tooltip {
  position: fixed;
  background: #333;
  color: white;
  padding: 8px;
  border-radius: 4px;
  font-size: 0.9em;
  pointer-events: none;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.tooltip .points {
  color: #4CAF50;
  font-weight: bold;
}

.tooltip {
  left: v-bind(tooltipX) + 'px';
  top: v-bind(tooltipY) + 'px';
}
</style>