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

  expose: [
    'startNameEdit',
    'saveBoardName',
    'cancelNameEdit',
    'previousPage',
    'nextPage',
    'deletePage',
    'currentPageName',
    'currentPageIndex',
    'isEditingName',
    'editedName'
  ],

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
  ...mapActions('bingo', ['updatePage', 'setCurrentPageIndex', 'saveCardState', 'DELETE_PAGE']), 
  ...mapMutations('bingo', ['TOGGLE_CELL', 'ADD_PAGE']),

    handleCellClick(cellIndex) {
      this.TOGGLE_CELL({ index: cellIndex });
      this.saveCardState();
    },

    handleCellEdit(cellIndex) {
      this.$emit('edit-cell', cellIndex);
    },

    previousPage() {
      console.log('previousPage called');
      console.log('Current index:', this.currentPageIndex);
      if (this.currentPageIndex > 0) {
        this.setCurrentPageIndex(this.currentPageIndex - 1);
        console.log('New index:', this.currentPageIndex - 1);
      }
    },

    nextPage() {
      console.log('nextPage called');
      console.log('Current index:', this.currentPageIndex);
      console.log('Total pages:', this.totalPages);
      if (this.currentPageIndex < this.totalPages - 1) {
        this.setCurrentPageIndex(this.currentPageIndex + 1);
      } else {
        console.log('Adding new page');
        this.ADD_PAGE(); // Now using ADD_PAGE as mutation
        this.setCurrentPageIndex(this.bingoPages.length - 1);
      }
      this.saveCardState();
    },

    startNameEdit() {
      console.log('startNameEdit called');
      console.log('Current name:', this.currentPageName);
      this.originalName = this.currentPageName;
      this.editedName = this.currentPageName;
      this.isEditingName = true;
      this.$nextTick(() => {
        console.log('Focusing input');
        this.$refs.nameInput?.focus();
      });
    },

    saveBoardName() {
      console.log('saveBoardName called');
      console.log('Edited name:', this.editedName);
      if (this.editedName.trim()) {
        const updatedPage = {
          ...this.getCurrentPage,
          name: this.editedName.trim()
        };
        console.log('Updating page with:', updatedPage);
        this.updatePage({ pageIndex: this.currentPageIndex, page: updatedPage });
      }
      this.isEditingName = false;
      this.saveCardState();
    },

    cancelNameEdit() {
      console.log('cancelNameEdit called');
      this.editedName = this.originalName;
      this.isEditingName = false;
    },

    deletePage() {
      if (this.currentPageIndex === 0) {
        console.warn('Cannot delete the first board');
        return;
      }
      
      // Confirm before deleting
      if (!confirm('Are you sure you want to delete this board?')) {
        return;
      }
      
      // Store the current index before deletion
      const currentIndex = this.currentPageIndex;
      
      // Remove the current page
      this.$store.dispatch('bingo/deletePage', this.currentPageIndex);
      
      // Navigate to the previous page
      this.$store.dispatch('bingo/setCurrentPage', currentIndex - 1);
      
      // Save the updated state
      this.$store.dispatch('bingo/saveCardState');
    },

    exportBoard() {
      console.log('Export board functionality coming soon...');
    },
  },

  mounted() {
    console.log('BingoWidget mounted');
    this.$emit('mounted');
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
