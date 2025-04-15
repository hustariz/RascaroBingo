<template>
  <div v-if="visible" class="modal">
    <div class="modal-content">
      <h3>Edit Bingo Cell</h3>
      <div class="modal-form">
        <div class="form-group">
          <label>Title:</label>
          <input v-model="localCell.title" type="text" placeholder="Enter title">
        </div>
        <div class="form-group">
          <label>Points:</label>
          <input v-model.number="localCell.points" type="number" min="0">
        </div>
        <div class="modal-buttons">
          <button @click="saveCell" class="save-button">Save</button>
          <button @click="closeModal" class="cancel-button">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'EditCellModal',
  
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    cell: {
      type: Object,
      default: () => ({
        title: '',
        points: 0,
        selected: false
      })
    }
  },
  
  emits: ['update:visible', 'save', 'close'],
  
  data() {
    return {
      localCell: {
        title: '',
        points: 0,
        selected: false
      }
    };
  },
  
  watch: {
    cell: {
      handler(newCell) {
        this.localCell = { ...newCell };
      },
      immediate: true,
      deep: true
    },
    visible(newVisible) {
      if (newVisible) {
        this.localCell = { ...this.cell };
      }
    }
  },
  
  methods: {
    saveCell() {
      this.$emit('save', { ...this.localCell });
      this.$emit('update:visible', false);
    },
    
    closeModal() {
      this.$emit('close');
      this.$emit('update:visible', false);
    }
  }
});
</script>

<style>
/* Modal styles are imported from shared/modals.css */
</style>
