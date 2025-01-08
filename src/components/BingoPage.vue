<template>
  <div class="page-container">
    <RiskManagementSidebar 
      ref="riskSidebar"
      @save-settings="handleSaveSettings" 
      @sidebar-toggle="handleSidebarToggle" 
    />
    
    <div class="main-content" :class="{ 'expanded': isSidebarCollapsed }">
      <h1 class="page-title">Here we cooking</h1>
      
      <draggable 
        v-model="widgets" 
        :animation="300"
        class="dashboard-layout"
        handle=".widget-handle"
        item-key="id"
      >
      <template #item="{ element }">
        <div class="widget-container" :class="element.size">
          <div class="widget-handle">⋮⋮</div>
          <div class="section-container">
            <div class="section-header widget-title">
              <h2>{{ element.title }}</h2>
              <div v-if="element.component === 'BingoGrid'" class="bingo-controls">
                <div class="page-controls">
                  <input 
                    v-model="currentBingoPage.name" 
                    placeholder="Page Name" 
                    class="page-name-input"
                    @focus="checkPremiumAccess"
                  >
                  <div class="page-navigation">
                    <button @click="previousPage" class="nav-button">←</button>
                    <span>Page {{ currentPageIndex + 1 }}</span>
                    <button @click="nextPage" class="nav-button">→</button>
                  </div>
                </div>
              </div>
            </div>
            <div class="component-wrapper" :class="{ 'has-premium-feature': element.component === 'BingoGrid' }">
              <component 
                :is="element.component" 
                :cells="element.component === 'BingoGrid' ? activeCells : undefined"
                :score="element.component === 'RiskRewardSection' ? activeScore : undefined"
                :rrChecks="element.component === 'TradeDetailsSection' ? rrChecks : undefined"
                :tradeIdea="element.component === 'TradeDetailsSection' ? currentTradeIdea : undefined"
                :tradingSymbol="element.component === 'TradeDetailsSection' ? currentSymbol : undefined"
                :isSidebarCollapsed="isSidebarCollapsed"
                @trade-status-update="handleTradeStatusUpdate"
                @trade-idea-update="updateTradeIdea"
                @symbol-update="updateTradingSymbol"
                @cell-click="toggleCell" 
                @cell-edit="editCell"
                @update:modelValue="updateWidgetData(element.id, $event)"
              />
              <PremiumLock 
                v-if="element.component === 'BingoGrid'"
                :show="showPremiumLock" 
                :message="'Upgrade to Premium to access multiple Bingo pages and custom page names'"
                @upgradePremium="handleUpgradePremium"
                @close="showPremiumLock = false"
              />
            </div>
          </div>
        </div>
      </template>
      </draggable>
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
            <input v-model.number="editingCell.points" type="number" min="0">
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
import { ref, defineComponent } from 'vue';
import { mapState, mapActions } from 'vuex';
import draggable from 'vuedraggable';
import { useAuth } from '@/composables/useAuth';
import { usePremiumCheck } from '@/composables/usePremiumCheck';
import '../assets/styles/BingoPage.css';
import RiskManagementSidebar from '@/components/RiskManagementSidebar.vue';
import BingoGrid from '@/components/BingoGrid.vue';
import RiskRewardSection from '@/components/RiskRewardSection.vue';
import TradeIdeaSection from '@/components/TradeIdeaSection.vue';
import TradeDetailsSection from '@/components/TradeDetailsSection.vue';
import PremiumLock from '@/components/PremiumLock.vue';

export default defineComponent({
  name: 'BingoPage',
  
  components: {
    RiskManagementSidebar,
    BingoGrid,
    RiskRewardSection,
    TradeIdeaSection,    
    TradeDetailsSection, 
    draggable,
    PremiumLock
  },

  setup() {
    const auth = useAuth();
    const { checkPremiumFeature, handleUpgradePremium } = usePremiumCheck();
    
    const widgets = ref([
      {
        id: 1,
        title: 'Bingo Section',
        component: 'BingoGrid',
        size: 'extra-large',
        props: {
          cells: []
        }
      },
      {
        id: 2,
        title: 'Points Bingo: Risk/Reward',
        component: 'RiskRewardSection',
        size: 'small',
        props: {
          score: 0
        }
      },
      {
        id: 3,
        title: "Trade's Idea",
        component: 'TradeIdeaSection',
        size: 'medium'
      },
      {
        id: 4,
        title: "Trade's Details",
        component: 'TradeDetailsSection',
        size: 'large'
      }
    ]);

    return {
      widgets,
      auth,
      checkPremiumFeature,
      handleUpgradePremium
    };
  },

  data() {
    return {
      isSidebarCollapsed: false,
      tooltipVisible: false,
      showEditModal: false,
      editingCell: null,
      editingIndex: null,
      localBingoCells: Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        title: '',
        points: 0,
        selected: false
      })),
      localTotalScore: 0,
      rrChecks: {
        sixPoints: false,
        elevenPoints: false,
        sixteenPoints: false,
        twentyPoints: false
      },
      currentTradeIdea: '',
      currentSymbol: '',
      currentPageIndex: 0,
      currentBingoPage: {
        name: '',
        cells: []
      },
      showPremiumLock: false,
      localPages: [{
        name: 'Default Board',
        cells: Array.from({ length: 25 }, (_, i) => ({
          id: i + 1,
          title: '',
          points: 0,
          selected: false
        }))
      }]
    };
  },

  computed: {
    ...mapState('bingo', ['bingoCells', 'totalScore']),
    activeCells() {
      if (this.auth.isAuthenticated.value) {
        return this.bingoCells;
      } else {
        return this.localPages[this.currentPageIndex]?.cells || this.localBingoCells;
      }
    },
    activeScore() {
      if (this.auth.isAuthenticated.value) {
        return this.totalScore;
      } else {
        const currentPage = this.localPages[this.currentPageIndex];
        if (currentPage) {
          return currentPage.cells.reduce((total, cell) => {
            return total + (cell.selected ? (cell.points || 0) : 0);
          }, 0);
        }
        return this.localTotalScore;
      }
    }
  },

  watch: {
    activeScore: {
      handler(newScore) {
        this.updateRRChecks(newScore);
        this.updateWidgetData(2, { score: newScore });
      },
      immediate: true
    },
    activeCells: {
      handler(newCells) {
        this.updateWidgetData(1, { cells: newCells });
      },
      deep: true,
      immediate: true
    }
  },

  methods: {
    ...mapActions('bingo', ['loadUserCard', 'saveCardState']),
    
    updateWidgetData(widgetId, ) {
      const widget = this.widgets.find(w => w.id === widgetId);
      if (widget) {
        if (widget.component === 'BingoGrid') {
          widget.props = { ...widget.props, cells: this.activeCells };
        } else if (widget.component === 'RiskRewardSection') {
          widget.props = { ...widget.props, score: this.activeScore };
        } else if (widget.component === 'TradeDetailsSection') {
          widget.props = { ...widget.props,
            tradeIdea: this.currentTradeIdea,
            tradingSymbol: this.currentSymbol
          };
        }
      }
    },
    updateTradeIdea(idea) {
      console.log('Updating trade idea:', idea); 
      this.currentTradeIdea = idea;
      const tradeDetailsWidget = this.widgets.find(w => w.component === 'TradeDetailsSection');
      if (tradeDetailsWidget) {
        this.updateWidgetData(tradeDetailsWidget.id, { tradeIdea: idea });
      }
    },
    updateTradingSymbol(symbol) {
      console.log('Updating trading symbol:', symbol);
      this.currentSymbol = symbol;
      const tradeDetailsWidget = this.widgets.find(w => w.component === 'TradeDetailsSection');
      if (tradeDetailsWidget) {
        this.updateWidgetData(tradeDetailsWidget.id, { tradingSymbol: symbol });
      }
    },

    handleTradeStatusUpdate({ status, profitLoss }) {
      console.log('Trade status update received:', { status, profitLoss });
      const sidebar = this.$refs.riskSidebar;
      if (sidebar) {
        sidebar.updateFromTradeResult({ status, profitLoss });
      }
    },

    handleSaveSettings(settings) {
      console.log('Settings saved:', settings);
    },

    handleSidebarToggle(isCollapsed) {
      this.isSidebarCollapsed = isCollapsed;
    },

    updateRRChecks(newScore) {
      this.rrChecks = {
        sixPoints: newScore >= 6 && newScore < 11,
        elevenPoints: newScore >= 11 && newScore < 16,
        sixteenPoints: newScore >= 16 && newScore < 20,
        twentyPoints: newScore >= 20
      };
    },
    

    async toggleCell(index) {
      try {
        if (this.auth.isAuthenticated.value) {
          const cell = { ...this.bingoCells[index] };
          cell.selected = !cell.selected;
          this.$store.commit('bingo/UPDATE_CELL', { 
            index, 
            cell: {
              ...cell,
              title: cell.title || '',
              points: Number(cell.points) || 0,
              selected: cell.selected
            }
          });
          await this.$store.dispatch('bingo/saveCardState');
        } else {
          const currentPage = this.localPages[this.currentPageIndex];
          if (currentPage) {
            const cell = currentPage.cells[index];
            cell.selected = !cell.selected;
            this.localTotalScore = currentPage.cells.reduce((total, cell) => {
              return total + (cell.selected ? (cell.points || 0) : 0);
            }, 0);
            this.updateRRChecks(this.localTotalScore);
          }
        }
        this.updateWidgetData(1, { cells: this.activeCells });
        this.updateWidgetData(2, { score: this.activeScore });
      } catch (error) {
        console.error('Error toggling cell:', error);
      }
    },

    editCell(index) {
      this.editingIndex = index;
      this.editingCell = { ...this.activeCells[index] };
      this.showEditModal = true;
    },

    async saveCell() {
      try {
        if (this.editingIndex !== null) {
          if (this.auth.isAuthenticated.value) {
            this.$store.commit('bingo/UPDATE_CELL', {
              index: this.editingIndex,
              cell: { ...this.editingCell }
            });
            await this.$store.dispatch('bingo/saveCardState');
          } else {
            const currentPage = this.localPages[this.currentPageIndex];
            if (currentPage) {
              const oldCell = currentPage.cells[this.editingIndex];
              if (oldCell.selected) {
                this.localTotalScore -= oldCell.points || 0;
              }
              currentPage.cells[this.editingIndex] = { ...this.editingCell };
              if (this.editingCell.selected) {
                this.localTotalScore += this.editingCell.points || 0;
              }
              this.updateRRChecks(this.localTotalScore);
            }
          }
        }
        this.showEditModal = false;
        this.editingCell = null;
        this.editingIndex = null;
      } catch (error) {
        console.error('Error saving cell:', error);
      }
    },

    previousPage() {
      const { allowed } = this.checkPremiumFeature('multiple bingo pages');
      if (!allowed) {
        this.showPremiumLock = true;
        return;
      }
      if (this.currentPageIndex > 0) {
        this.currentPageIndex--;
      }
    },

    nextPage() {
      const { allowed } = this.checkPremiumFeature('multiple bingo pages');
      if (!allowed) {
        this.showPremiumLock = true;
        return;
      }
      this.currentPageIndex++;
    },

    checkPremiumAccess() {
      const { allowed } = this.checkPremiumFeature('multiple bingo pages');
      if (!allowed) {
        this.showPremiumLock = true;
      }
    }
  },

  async created() {
    if (this.auth.isAuthenticated.value) {
      try {
        await this.loadUserCard();
      } catch (error) {
        console.error('Error loading bingo card:', error);
      }
    } else {
      // Initialize local storage if not authenticated
      if (!localStorage.getItem('localBingoData')) {
        localStorage.setItem('localBingoData', JSON.stringify(this.localPages));
      } else {
        this.localPages = JSON.parse(localStorage.getItem('localBingoData'));
      }
    }
  }
});
</script>

<style scoped>
.component-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.component-wrapper.has-premium-feature {
  min-height: 400px;
}
</style>