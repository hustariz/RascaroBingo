<template>
  <div>
    <button 
      class="page-nav-button export-button"
      @click="$emit('export')"
      @mouseover="showTooltip"
      @mouseleave="hideTooltip"
    >
      ↓
    </button>
    <teleport to="body" v-if="tooltipVisible">
      <div class="workflow-tooltip" :style="{
        left: tooltipX + 'px',
        top: tooltipY + 'px',
        visibility: 'visible'
      }">
        Export to Excel
      </div>
    </teleport>
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ExportTooltip',
  
  emits: ['export'],
  
  data() {
    return {
      tooltipVisible: false,
      tooltipX: 0,
      tooltipY: 0
    };
  },
  
  methods: {
    showTooltip(event) {
      const exportButton = event.target;
      const rect = exportButton.getBoundingClientRect();
      
      this.tooltipX = rect.left;
      this.tooltipY = rect.bottom;
      this.tooltipVisible = true;
    },
    
    hideTooltip() {
      this.tooltipVisible = false;
    }
  }
});
</script>

<style>
/* The tooltip styling is imported from Workflow.css */
</style>
