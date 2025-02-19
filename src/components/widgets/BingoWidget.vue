<template>
  <div class="bingo-widget widget-content">
    <div class="bingo-section">
      <BingoGrid 
        :cells="cells" 
        @cell-click="handleCellClick"
        @cell-edit="handleCellEdit"
      />
    </div>
    <PremiumLock 
      v-if="showPremiumLock"
      @close="showPremiumLock = false"
    />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { mapState, mapActions, mapGetters, mapMutations } from 'vuex';
import BingoGrid from '@/components/little_components/BingoGrid.vue';
import PremiumLock from '@/components/little_components/PremiumLock.vue';

export default defineComponent({
  name: 'BingoWidget',
  
  components: {
    BingoGrid,
    PremiumLock,
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
    'editedName',
    'openEditModal'
  ],

  props: {
  },

  data() {
    return {
      isEditingName: false,
      editedName: '',
      originalName: '',
      showPremiumLock: false,
    };
  },

  computed: {
    ...mapGetters('user', ['isPaidUser', 'isConnected']),
    ...mapState('bingo', ['currentPageIndex', 'bingoPages']),
    ...mapGetters('bingo', ['getCurrentPage', 'getTotalScore']),
    
    isPremium() {
      return this.isPaidUser && this.isConnected;
    },

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
    }
  },

  methods: {
  ...mapActions('bingo', ['updatePage', 'saveCardState', 'DELETE_PAGE']), 
  ...mapMutations('bingo', ['TOGGLE_CELL', 'ADD_PAGE', 'SET_CURRENT_PAGE']),

    handleCellClick(cellIndex) {
      // Cell editing should work for all users
      this.TOGGLE_CELL({ index: cellIndex });
      this.saveCardState();
    },

    handleCellEdit(cellIndex) {
      // Cell editing should work for all users
      this.$emit('edit-cell', cellIndex);
      this.openEditModal(cellIndex);
    },

    openEditModal(cellIndex) {
      console.log('Opening edit modal for cell:', cellIndex);
      this.$emit('open-edit-modal', cellIndex);
    },

    nextPage() {
      if (!this.isPremium) {
        this.showPremiumLock = true;
        return;
      }
      console.log('nextPage called');
      console.log('Current index:', this.currentPageIndex);
      console.log('Total pages:', this.totalPages);
      if (this.currentPageIndex < this.totalPages - 1) {
        this.SET_CURRENT_PAGE(this.currentPageIndex + 1);
      } else {
        console.log('Adding new page');
        this.ADD_PAGE();
        this.SET_CURRENT_PAGE(this.bingoPages.length - 1);
      }
      this.saveCardState();
    },

    previousPage() {
      if (!this.isPremium) {
        this.showPremiumLock = true;
        return;
      }
      console.log('previousPage called');
      console.log('Current index:', this.currentPageIndex);
      if (this.currentPageIndex > 0) {
        this.SET_CURRENT_PAGE(this.currentPageIndex - 1);
        console.log('New index:', this.currentPageIndex - 1);
      }
    },

    startNameEdit() {
      if (!this.isPremium) {
        this.showPremiumLock = true;
        return;
      }
      this.isEditingName = true;
      this.editedName = this.currentPageName;
      this.originalName = this.currentPageName;
    },

    saveBoardName() {
      if (this.editedName.trim() !== this.originalName) {
        this.updatePage({
          index: this.currentPageIndex,
          name: this.editedName.trim()
        });
      }
      this.isEditingName = false;
    },

    cancelNameEdit() {
      this.editedName = this.originalName;
      this.isEditingName = false;
    },

    deletePage() {
      if (!this.isPremium) {
        this.showPremiumLock = true;
        return;
      }
      if (this.totalPages <= 1) {
        return;
      }
      if (confirm('Are you sure you want to delete this board?')) {
        this.DELETE_PAGE(this.currentPageIndex);
        this.saveCardState();
      }
    },

    exportBoard() {
      if (!this.isPremium) {
        this.showPremiumLock = true;
        return;
      }
      // Export functionality here
    },
  },

  watch: {
    getTotalScore: {
      handler(newScore) {
        console.log('Score updated:', newScore);
        this.$emit('update:score', newScore);
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
});
</script>

<style>
@import '@/assets/styles/widgets/common.css';
@import '@/assets/styles/widgets/BingoWidget.css';
</style>
