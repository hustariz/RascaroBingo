<template>
  <div class="widget-content">
    <div class="trade-details-section">
      <div class="trade-details-content">
        <TradeDetailsSection />
      </div>
    </div>
  </div>
</template>

<script>
import TradeDetailsSection from '@/components/app/TradeDetailsSection.vue';
import { mapMutations } from 'vuex';

export default {
  name: 'TradeDetailsWidget',
  components: {
    TradeDetailsSection
  },
  methods: {
    ...mapMutations('workflow', ['SET_TOOLTIP_VISIBLE', 'SET_TOOLTIP_NUMBER', 'SET_TOOLTIP_POSITION']),
    showWorkflowTooltip(event, workflowNumber) {
      this.SET_TOOLTIP_VISIBLE(true)
      this.SET_TOOLTIP_NUMBER(workflowNumber)
      this.updateWorkflowTooltipPosition(event)
    },
    updateWorkflowTooltipPosition(event) {
      this.SET_TOOLTIP_POSITION({
        x: event.clientX + 10,
        y: event.clientY + 10
      })
    },
    hideWorkflowTooltip() {
      this.SET_TOOLTIP_VISIBLE(false)
    }
  }
}
</script>

<style scoped>
.widget-content {
  height: 100%;
  padding: 10px;
}

.trade-details-section {
  height: 100%;
  overflow: auto;
  padding: 1rem;
  position: relative;
}
</style>
