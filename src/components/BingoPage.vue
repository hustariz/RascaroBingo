<template>
  <div class="page-container">
    <RiskManagementSidebar 
      @save-settings="handleSaveSettings"
      @sidebar-toggle="handleSidebarToggle"
    />
    <div class="main-content" :class="{ 'expanded': isSidebarCollapsed }">
      <h2 class="page-title">RascaroBingo V1.0</h2>
      
      <div class="two-column-layout">
        <!-- Left Column: Trade Sections -->
        <div class="left-column">
          <!-- Trade's Idea Section -->
          <div class="section-container">
            <div class="section-header">
              <h2>Trade's Idea</h2>
            </div>
            <div class="section-content">
              <textarea 
                v-model="tradeIdea" 
                placeholder="Enter your trade ideas here..." 
                rows="4"
                class="trade-idea-input"
              ></textarea>
            </div>
          </div>

          <!-- Trade Details Section -->
          <div class="section-container">
            <div class="section-header">
              <h2>Trade's Details</h2>
            </div>
            <div class="section-content">
              <div class="price-inputs">
                <div class="price-input-group">
                  <label class="price-label">Stoploss:</label>
                  <div class="input-with-prefix">
                    <span class="prefix">$</span>
                    <input 
                      type="number" 
                      v-model="stoploss" 
                      step="1" 
                      placeholder="0"
                    >
                  </div>
                </div>
                <div class="price-input-group">
                  <label class="price-label">Entry:</label>
                  <div class="input-with-prefix">
                    <span class="prefix">$</span>
                    <input 
                      type="number" 
                      v-model="entry" 
                      step="1" 
                      placeholder="0"
                    >
                  </div>
                </div>
                <div class="price-input-group">
                  <label class="price-label">Target:</label>
                  <div class="input-with-prefix">
                    <span class="prefix">$</span>
                    <input 
                      type="number" 
                      v-model="target" 
                      step="1" 
                      placeholder="0"
                    >
                  </div>
                </div>
                <button class="save-button" @click="saveTrade">Save</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Bingo Sections -->
        <div class="right-column">
          <div class="section-container">
            <div class="section-header">
              <h2>Bingo Section</h2>
            </div>
            <div class="section-content">
            <!-- Bingo Grid -->
            <div class="bingo-grid">
              <div v-for="(cell, index) in bingoCells" 
                  :key="index" 
                  class="bingo-cell"
                  :class="{ 'selected': cell.selected }"
                  @click="toggleCell(index)">
                  <div class="cell-content">
                    {{  index + 1 }}
                  </div>
                <button class="icon-button edit" @click.stop="editCell(index)">
                  <i class="fas fa-pen"></i>
                </button>
                <button class="icon-button info">
                  <i class="fas fa-question-circle"></i>
                  <div class="tooltip">
                    <strong>{{ cell.title || 'Not set' }}</strong>
                    <br>
                    Points: {{ cell.points || '0' }}
                  </div>
                </button>
              </div>
            </div>

              <!-- Risk/Reward Section -->
              <div class="risk-reward-area">
                <h2>Points Bingo: Risk/Reward</h2>
                <div class="rr-checkboxes">
                  <label class="rr-checkbox">
                    <input type="checkbox" v-model="rrChecks.threeToTen">
                    <span class="checkbox-text">6/20 : 2R/R</span>
                  </label>
                  <label class="rr-checkbox">
                    <input type="checkbox" v-model="rrChecks.fiveToTen">
                    <span class="checkbox-text">12/20 : 3R/R</span>
                  </label>
                  <label class="rr-checkbox">
                    <input type="checkbox" v-model="rrChecks.sevenToTen">
                    <span class="checkbox-text">18/20 : 4R/R</span>
                  </label>
                </div>
                <div class="score-display">
                  <h3>Total Score: <span class="score-value">{{ totalScore }}</span></h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
        <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal">
      <div class="modal-content">
        <h3>Edit Bingo Cell</h3>
        <div class="modal-form">
          <div class="form-group">
            <label>Title:</label>
            <input v-model="editingCell.title" type="text" placeholder="Enter title">
          </div>
          <div class="form-group">
            <label>Points:</label>
            <input v-model="editingCell.points" type="number" min="0">
          </div>
          <div class="modal-buttons">
            <button @click="saveCell" class="save-button">Save</button>
            <button @click="showEditModal = false" class="cancel-button">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import '../assets/styles/BingoPage.css';
import RiskManagementSidebar from '@/components/RiskManagementSidebar.vue'

export default {
  name: 'BingoPage',
  components: {
    RiskManagementSidebar
  },
  data() {
    return {
      isSidebarCollapsed: false,
      tradeIdea: '',
      stoploss: null,
      entry: null,
      target: null,
      totalScore: 0,
      rrChecks: {
        threeToTen: false,
        fiveToTen: false,
        sevenToTen: false
      },
      bingoCells: Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        title: '',
        points: 0,
        selected: false
      })),
      showEditModal: false,
      editingCell: null,
      editingIndex: null
    }
  },
  methods: {
    handleSaveSettings(settings) {
      console.log('Settings saved:', settings);
    },
    handleSidebarToggle(isCollapsed) {
      this.isSidebarCollapsed = isCollapsed;
    },
    saveTrade() {
      console.log('Trade details:', {
        stoploss: this.stoploss,
        entry: this.entry,
        target: this.target,
        idea: this.tradeIdea,
        riskRewardChecks: this.rrChecks
      });
    },
    toggleCell(index) {
      this.bingoCells[index].selected = !this.bingoCells[index].selected;
      if (this.bingoCells[index].selected) {
        this.totalScore += this.bingoCells[index].points || 0;
      } else {
        this.totalScore -= this.bingoCells[index].points || 0;
      }
    },
    editCell(index) {
      this.editingIndex = index;
      this.editingCell = { ...this.bingoCells[index] };
      this.showEditModal = true;
    },
    saveCell() {
      // If the cell was previously selected, subtract its old points
      if (this.bingoCells[this.editingIndex].selected) {
        this.totalScore -= this.bingoCells[this.editingIndex].points || 0;
      }
      
      this.bingoCells[this.editingIndex] = { ...this.editingCell };
      
      // If the cell is selected, add the new points
      if (this.bingoCells[this.editingIndex].selected) {
        this.totalScore += this.bingoCells[this.editingIndex].points || 0;
      }
      
      this.showEditModal = false;
      this.editingCell = null;
      this.editingIndex = null;
    }
  }
}
</script>