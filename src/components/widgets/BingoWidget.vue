<template>
  <div class="widget-content">
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

<style scoped>
.widget-content {
  height: 100%;
  padding: 10px;
}

.bingo-section {
  height: 100%;
  overflow: auto;
  padding: 1rem;
  position: relative;
}

.bingo-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
  height: 100%;
  padding: 0.5rem;
}

.bingo-cell {
  background: linear-gradient(145deg, rgba(43, 24, 16, 0.7), rgba(25, 16, 5, 0.9));
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 6px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.bingo-cell:hover {
  border-color: rgba(255, 215, 0, 0.6);
  box-shadow: 
    0 0 10px rgba(255, 215, 0, 0.1),
    inset 0 0 5px rgba(255, 215, 0, 0.1);
}

.bingo-cell.active {
  background: linear-gradient(145deg, rgba(255, 215, 0, 0.15), rgba(255, 215, 0, 0.05));
  border-color: rgba(255, 215, 0, 0.8);
  box-shadow: 
    0 0 15px rgba(255, 215, 0, 0.15),
    inset 0 0 10px rgba(255, 215, 0, 0.1);
}

.cell-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.cell-title {
  font-size: 0.85rem;
  color: rgba(255, 215, 0, 0.9);
  font-weight: 500;
  line-height: 1.2;
}

.cell-points {
  font-size: 0.75rem;
  color: rgba(255, 215, 0, 0.7);
  font-weight: 400;
}

.has-points .cell-title {
  font-weight: 600;
}

.workflow-number {
  width: 24px;
  height: 24px;
  background: #ffd700;
  border: 1px solid #ffd700;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: help;
  transition: all 0.2s ease;
}

.workflow-number:hover {
  background: #ffed4a;
  border-color: #ffed4a;
}
</style>
