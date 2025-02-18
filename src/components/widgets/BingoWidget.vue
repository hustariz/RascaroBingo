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
import { defineComponent } from 'vue';
import { mapState, mapActions, mapGetters, mapMutations } from 'vuex';
import BingoGrid from '@/components/little_components/BingoGrid.vue';

export default defineComponent({
  name: 'BingoWidget',
  
  components: {
    BingoGrid,
  },

  data() {
    return {
      isEditingName: false,
      editedName: '',
      originalName: '',
    };
  },

  computed: {
    ...mapState('bingo', ['currentPageIndex', 'bingoPages']),
    ...mapGetters('bingo', ['getCurrentPage', 'getTotalScore']),
    
    totalPages() {
      return this.bingoPages.length;
    },

    cells() {
      const cells = this.getCurrentPage?.bingoCells || [];
      console.log('Bingo cells:', cells);
      return cells;
    },

    currentPageName() {
      return this.getCurrentPage?.name || 'Default Board';
    },

    score() {
      return this.getTotalScore;
    }
  },

  methods: {
  ...mapActions('bingo', ['updatePage', 'setCurrentPageIndex', 'saveCardState']), 
  ...mapMutations('bingo', ['TOGGLE_CELL', 'ADD_PAGE']),

    handleCellClick(cellIndex) {
      this.TOGGLE_CELL({ index: cellIndex });
      this.saveCardState();
    },

    handleCellEdit(cellIndex) {
      this.$emit('edit-cell', cellIndex);
    },

    previousPage() {
      if (this.currentPageIndex > 0) {
        this.setCurrentPageIndex(this.currentPageIndex - 1);
      }
    },

    nextPage() {
      if (this.currentPageIndex < this.totalPages - 1) {
        this.setCurrentPageIndex(this.currentPageIndex + 1);
      } else {
        this.ADD_PAGE(); // Now using ADD_PAGE as mutation
        this.setCurrentPageIndex(this.bingoPages.length - 1);
      }
      this.saveCardState();
    },

    startNameEdit() {
      this.originalName = this.currentPageName;
      this.editedName = this.currentPageName;
      this.isEditingName = true;
      this.$nextTick(() => {
        this.$refs.nameInput?.focus();
      });
    },

    saveBoardName() {
      if (this.editedName.trim()) {
        const updatedPage = {
          ...this.getCurrentPage,
          name: this.editedName.trim()
        };
        this.updatePage({ pageIndex: this.currentPageIndex, page: updatedPage });
      }
      this.isEditingName = false;
    },

    cancelNameEdit() {
      this.editedName = this.originalName;
      this.isEditingName = false;
    },

    deletePage() {
      // TO DO: implement delete page functionality
    },

    exportBoard() {
      // TO DO: implement export functionality
      console.log('Exporting board:', this.currentPageName);
    },
  },

  mounted() {
    // Emit an event to update the widget title area with navigation
    this.$emit('update-title-area', {
      navigation: {
        currentPageIndex: this.currentPageIndex,
        totalPages: this.totalPages,
        currentPageName: this.currentPageName,
        isEditingName: this.isEditingName,
        editedName: this.editedName,
        onPrevious: this.previousPage,
        onNext: this.nextPage,
        onStartEdit: this.startNameEdit,
        onSave: this.saveBoardName,
        onCancel: this.cancelNameEdit,
        onDelete: this.deletePage,
        onExport: this.exportBoard
      }
    });
  },

  watch: {
    score: {
      handler(newScore) {
        console.log('Score updated:', newScore);
        this.$emit('score-updated', newScore);
      },
      immediate: true
    },

    currentPageIndex() {
      this.$emit('update-title-area', {
        navigation: {
          currentPageIndex: this.currentPageIndex,
          totalPages: this.totalPages,
          currentPageName: this.currentPageName,
          isEditingName: this.isEditingName,
          editedName: this.editedName,
          onPrevious: this.previousPage,
          onNext: this.nextPage,
          onStartEdit: this.startNameEdit,
          onSave: this.saveBoardName,
          onCancel: this.cancelNameEdit,
          onDelete: this.deletePage,
          onExport: this.exportBoard
        }
      });
    },

    isEditingName() {
      this.$emit('update-title-area', {
        navigation: {
          currentPageIndex: this.currentPageIndex,
          totalPages: this.totalPages,
          currentPageName: this.currentPageName,
          isEditingName: this.isEditingName,
          editedName: this.editedName,
          onPrevious: this.previousPage,
          onNext: this.nextPage,
          onStartEdit: this.startNameEdit,
          onSave: this.saveBoardName,
          onCancel: this.cancelNameEdit,
          onDelete: this.deletePage,
          onExport: this.exportBoard
        }
      });
    }
  }
});
</script>

<style>
@import '@/assets/styles/widgets/common.css';
@import '@/assets/styles/widgets/BingoWidget.css';
</style>
