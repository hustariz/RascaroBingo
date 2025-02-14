<template>
  <div class="bingo-widget widget-content">
    <div class="bingo-section">
      <BingoGrid 
        :cells="cells" 
        @cell-click="handleCellClick"
        @cell-edit="handleCellEdit"
      />
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue';
import { useStore } from 'vuex';
import BingoGrid from '@/components/app/BingoGrid.vue';

export default defineComponent({
  name: 'BingoWidget',
  components: {
    BingoGrid
  },
  props: {
    score: {
      type: Number,
      default: 0
    }
  },
  emits: ['score-updated'],
  setup() {
    const store = useStore();

    // Load initial data
    store.dispatch('bingo/loadUserCard');

    const cells = computed(() => store.getters['bingo/getCurrentPageCells']);

    const handleCellClick = (index) => {
      store.commit('bingo/TOGGLE_CELL', { index });
      store.dispatch('bingo/saveCardState');
    };

    const handleCellEdit = (index) => {
      // We'll implement this in the next step
      console.log('Edit cell:', index);
    };

    return {
      cells,
      handleCellClick,
      handleCellEdit
    };
  }
});
</script>

<style>
@import '@/assets/styles/widgets/BingoWidget.css';
</style>
