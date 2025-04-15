<template>
  <div class="widget-navigation">
    <!-- Previous Page Button -->
    <button 
      class="page-nav-button"
      @click="handlePrevious"
      :disabled="currentPageIndex === 0"
    >
      ←
    </button>

    <!-- Board Name Container -->
    <div class="board-name-container">
      <template v-if="isEditingName">
        <input
          ref="nameInput"
          :value="editedName"
          @input="$emit('update:editedName', $event.target.value)"
          class="board-name-input"
          @blur="handleSaveName"
          @keyup.enter="handleSaveName"
          @keyup.esc="handleCancelEdit"
          placeholder="Default Board"
        />
      </template>
      <template v-else>
        <div 
          class="board-name"
          @click="handleStartEdit"
        >
          {{ currentPageName || 'Default Board' }}
        </div>
      </template>
    </div>

    <!-- Next Page Button -->
    <button 
      class="page-nav-button"
      @click="handleNext"
      :disabled="nextDisabled"
    >
      →
    </button>

    <!-- Delete Button -->
    <button 
      class="page-nav-button delete-button"
      @click="handleDelete"
      :disabled="currentPageIndex === 0"
      title="Delete current board"
    >
      🗑
    </button>

    <!-- Export Button -->
    <ExportTooltip @export="handleExport" />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import ExportTooltip from '@/components/little_components/ExportTooltip.vue';

export default defineComponent({
  name: 'BoardNavigation',
  
  components: {
    ExportTooltip
  },
  
  props: {
    currentPageIndex: {
      type: Number,
      default: 0
    },
    currentPageName: {
      type: String,
      default: 'Default Board'
    },
    isEditingName: {
      type: Boolean,
      default: false
    },
    editedName: {
      type: String,
      default: ''
    },
    isPremium: {
      type: Boolean,
      default: false
    },
    totalPages: {
      type: Number,
      default: 1
    }
  },
  
  emits: [
    'previous', 
    'next', 
    'delete', 
    'export', 
    'start-edit', 
    'save-name', 
    'cancel-edit',
    'premium-required',
    'update:editedName'
  ],
  
  computed: {
    nextDisabled() {
      return this.currentPageIndex >= this.totalPages - 1;
    }
  },
  
  methods: {
    handlePrevious() {
      this.$emit('previous');
    },
    
    handleNext() {
      this.$emit('next');
    },
    
    handleDelete() {
      this.$emit('delete');
    },
    
    handleExport() {
      this.$emit('export');
    },
    
    handleStartEdit() {
      this.$emit('start-edit');
    },
    
    handleSaveName() {
      this.$emit('save-name');
    },
    
    handleCancelEdit() {
      this.$emit('cancel-edit');
    }
  },
  
  mounted() {
    // Focus the input field when editing starts
    this.$watch('isEditingName', (newVal) => {
      if (newVal && this.$refs.nameInput) {
        this.$nextTick(() => {
          this.$refs.nameInput.focus();
        });
      }
    });
  }
});
</script>

<style>
.widget-navigation {
  display: flex;
  align-items: center;
  margin-left: 0.5rem;
}

.page-nav-button {
  background: none;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 2px 8px;
  margin: 0 2px;
  cursor: pointer;
  font-size: 14px;
}

.page-nav-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.delete-button {
  color: #ff4d4f;
}

.board-name-container {
  margin: 0 8px;
  min-width: 120px;
}

.board-name {
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
}

.board-name:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.board-name-input {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 2px 4px;
  width: 100%;
}
</style>
