<template>
  <div class="bingo-widget widget-content">
    <div class="bingo-section">
      <div class="bingo-grid">
        <div 
          v-for="(cell, index) in cells" 
          :key="index"
          class="bingo-cell"
          :class="{ 
            'active': cell.selected,
            'has-points': cell.points > 0
          }"
          @click="handleCellClick(index)"
          @mouseover="showWorkflowTooltip($event, 2)"
          @mousemove="updateWorkflowTooltipPosition($event)"
          @mouseleave="hideWorkflowTooltip"
        >
          <div class="cell-content">
            <div class="cell-title">{{ cell.title }}</div>
            <div v-if="cell.points > 0" class="cell-points">{{ cell.points }} pts</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue';
import { useStore } from 'vuex';

export default defineComponent({
  name: 'BingoWidget',

  emits: ['workflow-tooltip'],

  setup() {
    const store = useStore();

    const cells = computed(() => {
      const currentPage = store.getters['bingo/getCurrentPage'];
      return currentPage ? currentPage.bingoCells : [];
    });

    const handleCellClick = (index) => {
      store.commit('bingo/TOGGLE_CELL', { index });
      store.dispatch('bingo/saveUserCard');
    };

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
      cells,
      handleCellClick,
      showWorkflowTooltip,
      hideWorkflowTooltip,
      updateWorkflowTooltipPosition
    };
  }
});
</script>

<style>
@import '@/assets/styles/widgets/BingoWidget.css';
</style>
