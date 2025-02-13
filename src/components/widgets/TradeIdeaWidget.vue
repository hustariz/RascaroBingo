<template>
  <div class="widget-content">
    <div class="trade-idea-section">
      <TradeIdeaSection />
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { useStore } from 'vuex';
import TradeIdeaSection from '@/components/app/TradeIdeaSection.vue';

export default defineComponent({
  name: 'TradeIdeaWidget',
  components: {
    TradeIdeaSection
  },
  setup() {
    const store = useStore();

    const showWorkflowTooltip = (event, number) => {
      event.stopPropagation();
      store.commit('workflow/SHOW_TOOLTIP', { event, number });
    };

    const hideWorkflowTooltip = () => {
      store.commit('workflow/HIDE_TOOLTIP');
    };

    const updateWorkflowTooltipPosition = (event) => {
      event.stopPropagation();
      store.commit('workflow/UPDATE_TOOLTIP_POSITION', event);
    };

    return {
      showWorkflowTooltip,
      hideWorkflowTooltip,
      updateWorkflowTooltipPosition
    };
  }
});
</script>

<style scoped>
.widget-content {
  height: 100%;
  padding: 10px;
}

.trade-idea-section {
  height: 100%;
  overflow: auto;
  padding: 1rem;
  position: relative;
}
</style>
