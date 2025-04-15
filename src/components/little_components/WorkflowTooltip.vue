<template>
  <div>
    <!-- Workflow Number Display -->
    <div 
      class="workflow-number" 
      v-if="number"
      @mouseenter="showTooltip"
      @mouseleave="hideTooltip"
    >
      {{ number }}
    </div>

    <!-- Workflow Tooltip -->
    <teleport to="body">
      <div class="workflow-tooltip" v-show="tooltipVisible" :style="tooltipStyle">
        <div v-if="number === 1">First check your trading pair and write your trade idea 💭</div>
        <div v-if="number === 2">Attribute points to your trading practices and check the bingo cases to increase your score! 🎯</div>
        <div v-if="number === 3">The more points you earn, the more risk you can allocate to your trade, which can be a further target / stoploss or more size for the trade! 📈</div>
        <div v-if="number === 4">Now enter the stoploss of your trade first (where your idea is wrong), then your entry and we will calculate a proposal of target based of the points you earned previously! 🎯💰</div>
      </div>
    </teleport>
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'WorkflowTooltip',
  
  props: {
    number: {
      type: Number,
      required: true
    }
  },
  
  data() {
    return {
      tooltipVisible: false,
      tooltipX: 0,
      tooltipY: 0
    };
  },
  
  computed: {
    tooltipStyle() {
      return {
        left: `${this.tooltipX}px`,
        top: `${this.tooltipY}px`,
        transform: 'translate(0, 20px)',
        opacity: this.tooltipVisible ? 1 : 0,
        visibility: this.tooltipVisible ? 'visible' : 'hidden'
      }
    }
  },
  
  methods: {
    showTooltip(event) {
      event.stopPropagation();  // Prevent event bubbling
      
      const workflowNumber = event.target;
      const rect = workflowNumber.getBoundingClientRect();
      
      this.tooltipX = rect.left;
      this.tooltipY = rect.bottom;
      this.tooltipVisible = true;
    },
    
    hideTooltip(event) {
      if (event) {
        event.stopPropagation();  // Prevent event bubbling
      }
      this.tooltipVisible = false;
    }
  }
});
</script>

<style>
@import '@/assets/styles/Workflow.css';
</style>
