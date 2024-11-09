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
              <div v-for="(cell, index) in activeCells" 
                  :key="index" 
                  class="bingo-cell"
                  :class="{ 'selected': cell.selected }">
                <!-- Info zone (top) -->
                <div class="cell-info-zone" 
                    @mouseenter="tooltipVisible = true"
                    @mouseleave="tooltipVisible = false"
                    @click="tooltipVisible = false">
                  <div class="tooltip" v-show="tooltipVisible">
                    <strong>{{ cell.title || 'Not set' }}</strong>
                    <br>
                    Points: {{ cell.points || '0' }}
                  </div>
                </div>
                
                <!-- Content zone (middle) -->
                <div class="cell-content" @click="toggleCell(index)">
                  {{ index + 1 }}
                </div>
                
                <!-- Edit zone (bottom) -->
                <div class="cell-edit-zone" @click.stop="editCell(index)"></div>
              </div>
            </div>

              <!-- Risk/Reward Section -->
              <div class="risk-reward-area">
                <h2>Points Bingo: Risk/Reward</h2>
                <div class="rr-checkboxes">
                  <label class="rr-checkbox">
                    <input type="checkbox" v-model="rrChecks.sixPoints" disabled>
                    <span class="checkbox-text">6/20 : 2R/R</span>
                  </label>
                  <label class="rr-checkbox">
                    <input type="checkbox" v-model="rrChecks.twelvePoints" disabled>
                    <span class="checkbox-text">12/20 : 3R/R</span>
                  </label>
                  <label class="rr-checkbox">
                    <input type="checkbox" v-model="rrChecks.eighteenPoints" disabled>
                    <span class="checkbox-text">18/20 : 4R/R</span>
                  </label>
                </div>
                <div class="score-display">
                  <h3>Total Score: <span class="score-value">{{ activeScore }}</span></h3>
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
import { mapState, mapActions } from 'vuex';
import { useAuth } from '@/composables/useAuth';
import '../assets/styles/BingoPage.css';
import RiskManagementSidebar from '@/components/RiskManagementSidebar.vue'

export default {
  name: 'BingoPage',
  components: { RiskManagementSidebar },
  
  setup() {
    console.log('🔧 BingoPage setup initialized');
    const auth = useAuth();
    return { auth };
  },

  computed: {
    ...mapState('bingo', ['bingoCells', 'totalScore']),
    
    activeCells() {
      console.log('📊 Computing active cells, auth state:', this.auth.isAuthenticated.value);
      return this.auth.isAuthenticated.value ? this.bingoCells : this.localBingoCells;
    },
    
    activeScore() {
      console.log('🎯 Computing active score, auth state:', this.auth.isAuthenticated.value);
      return this.auth.isAuthenticated.value ? this.totalScore : this.localTotalScore;
    }
  },

  data() {
    return {
      isSidebarCollapsed: false,
      tradeIdea: '',
      stoploss: null,
      entry: null,
      target: null,
      tooltipVisible: false,
      rrChecks: {
        sixPoints: false,
        twelvePoints: false,
        eighteenPoints: false
      },
      showEditModal: false,
      editingCell: null,
      editingIndex: null,
      localBingoCells: Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        title: '',
        points: 0,
        selected: false
      })),
      localTotalScore: 0
    }
  },

  watch: {
    activeScore: {
      handler(newScore) {
        console.log('📈 Score changed:', newScore);
        this.updateRRChecks(newScore);
      },
      immediate: true
    }
  },

  methods: {
    ...mapActions('bingo', ['loadUserCard', 'saveCardState']),

    handleSaveSettings(settings) {
      console.log('⚙️ Settings saved:', settings);
    },

    handleSidebarToggle(isCollapsed) {
      console.log('📑 Sidebar toggled:', isCollapsed);
      this.isSidebarCollapsed = isCollapsed;
    },

    saveTrade() {
      console.log('💾 Saving trade:', {
        stoploss: this.stoploss,
        entry: this.entry,
        target: this.target,
        idea: this.tradeIdea,
        riskRewardChecks: this.rrChecks
      });
    },

    updateRRChecks(newScore) {
      console.log('🎲 Updating RR checks for score:', newScore);
      this.rrChecks.sixPoints = false;
      this.rrChecks.twelvePoints = false;
      this.rrChecks.eighteenPoints = false;

      if (newScore >= 18) {
        this.rrChecks.eighteenPoints = true;
      } else if (newScore >= 12) {
        this.rrChecks.twelvePoints = true;
      } else if (newScore >= 6) {
        this.rrChecks.sixPoints = true;
      }
      
      console.log('✅ New RR state:', this.rrChecks);
    },

    async toggleCell(index) {
      console.log('🎯 Toggling cell:', index);
      try {
        if (this.auth.isAuthenticated.value) {
          console.log('👤 User is authenticated, updating store');
          const cell = { ...this.bingoCells[index] };
          cell.selected = !cell.selected;
          this.$store.commit('bingo/UPDATE_CELL', { index, cell });
          await this.saveCardState();
          console.log('✅ Cell toggled and saved');
        } else {
          console.log('👥 User is not authenticated, updating local state');
          const cell = this.localBingoCells[index];
          cell.selected = !cell.selected;
          this.localTotalScore += cell.selected ? (cell.points || 0) : -(cell.points || 0);
          this.updateRRChecks(this.localTotalScore);
          console.log('✅ Local cell toggled');
        }
      } catch (error) {
        console.error('❌ Error toggling cell:', error);
      }
    },

    editCell(index) {
      console.log('📝 Editing cell:', index);
      this.editingIndex = index;
      this.editingCell = { ...this.activeCells[index] };
      this.showEditModal = true;
    },

    async saveCell() {
      console.log('💾 Saving cell changes');
      try {
        if (this.editingIndex !== null) {
          if (this.auth.isAuthenticated.value) {
            console.log('👤 Saving to store');
            this.$store.commit('bingo/UPDATE_CELL', {
              index: this.editingIndex,
              cell: { ...this.editingCell }
            });
            await this.saveCardState();
          } else {
            console.log('👥 Saving to local state');
            const oldCell = this.localBingoCells[this.editingIndex];
            if (oldCell.selected) {
              this.localTotalScore -= oldCell.points || 0;
            }
            this.localBingoCells[this.editingIndex] = { ...this.editingCell };
            if (this.editingCell.selected) {
              this.localTotalScore += this.editingCell.points || 0;
            }
            this.updateRRChecks(this.localTotalScore);
          }
        }
        this.showEditModal = false;
        this.editingCell = null;
        this.editingIndex = null;
        console.log('✅ Cell saved successfully');
      } catch (error) {
        console.error('❌ Error saving cell:', error);
      }
    }
  },

  async created() {
    console.log('🎮 BingoPage created');
    console.log('🔑 Auth state:', {
      isAuthenticated: this.auth.isAuthenticated.value,
      hasUser: !!this.auth.user.value
    });
    
    try {
      if (this.auth.isAuthenticated.value) {
        console.log('👤 Loading authenticated user card');
        await this.loadUserCard();
        console.log('✅ Card loaded successfully');
      } else {
        console.log('👥 Using default state for non-authenticated user');
      }
    } catch (error) {
      console.error('❌ Error loading bingo card:', error);
    }
  }
}
</script>