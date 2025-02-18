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
           @mouseleave="hideTooltip">
        <BingoCellTooltip 
          :show="tooltipVisible === index"
          :title="cell.title"
          :points="cell.points"
          :x="tooltipX"
          :y="tooltipY"
        />
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
import BingoCellTooltip from './BingoCellTooltip.vue'

export default {
  name: 'BingoGrid',
  components: {
    BingoCellTooltip
  },
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
  methods: {
    showTooltip(event, index) {
      this.tooltipVisible = index;
      this.tooltipX = event.clientX;
      this.tooltipY = event.clientY;
    },
    hideTooltip() {
      this.tooltipVisible = null;
    }
  }
}
</script>

<style>
</style>