<template>
    <div class="bingo-grid">
      <div v-for="(cell, index) in cells" 
           :key="index" 
           class="bingo-cell" 
           :class="{ 'selected': cell.selected }">
        <!-- Info zone (top) -->
        <div class="cell-info-zone" 
             @mouseenter="showTooltip($event, index)"
             @mouseleave="hideTooltip"
             @mousemove="updateTooltipPosition($event)">
          <div class="tooltip" v-show="tooltipVisible === index" :style="tooltipStyle">
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