<template>
    <div class="bingo-grid">
      <div v-for="(cell, index) in cells" 
           :key="index" 
           class="bingo-cell" 
           :class="{ 'selected': cell.selected }">
        <!-- Info zone (top) -->
        <div class="cell-info-zone" 
             @mouseenter="tooltipVisible = index"
             @mouseleave="tooltipVisible = null"
             @click="tooltipVisible = null">
          <div class="tooltip" v-show="tooltipVisible === index">
            <strong>{{ cell.title || 'Not set' }}</strong>
            <br>
            Points: {{ cell.points || '0' }}
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
        tooltipVisible: null
      }
    }
  }
  </script>
  