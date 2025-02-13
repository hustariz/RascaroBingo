<template>
  <div class="widget-content">
    <div class="risk-reward-section">
      <RiskRewardSection :score="score" />
    </div>
  </div>
</template>

<script>
import RiskRewardSection from '@/components/app/RiskRewardSection.vue';
import { mapMutations } from 'vuex';

export default {
  name: 'RiskRewardWidget',
  components: {
    RiskRewardSection
  },
  props: {
    score: {
      type: Number,
      default: 0
    }
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

.risk-reward-section {
  height: 100%;
  overflow: auto;
  padding: 1rem;
  position: relative;
}
</style>
