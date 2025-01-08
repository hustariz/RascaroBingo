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
          <div class="section-container">
            <div class="section-header widget-title">
              <h2>
                <template v-if="element.component === 'RiskRewardSection'">
                  Points&nbsp;Bingo:<br/>Risk/Reward
                </template>
                <template v-else>
                  {{ element.title }}
                </template>
              </h2>
              <div v-if="element.component === 'BingoGrid'" class="bingo-controls">
                <div class="page-controls">
                  <input 
                    v-model="currentPageName" 
                    placeholder="Page Name" 
                    class="page-name-input"
                    @focus="checkPremiumAccess"
                    @input="handlePageNameUpdate($event.target.value)"
                  >
                  <div class="page-navigation">
                    <button 
                      @click="previousPage" 
                      class="nav-button"
                    >←</button>
                    <span>Page {{ getCurrentPageIndex + 1 }}</span>
                    <button 
                      @click="nextPage" 
                      class="nav-button"
                    >→</button>
                    <button 
                      v-if="getAllPages.length > 1" 
                      @click="deletePage" 
                      class="delete-button"
                      title="Delete current board"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
              <div class="widget-handle">⋮⋮</div>
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
                @cell-click="handleCellClick" 
                @cell-edit="openEditModal"
                @update:modelValue="updateWidgetData(element.id, $event)"
              />
              <PremiumLock 
                v-if="element.component === 'BingoGrid'"
                :show="showPremiumLock" 
                :message="!isAuthenticated 
                  ? 'Sign in to save your Bingo progress and access premium features' 
                  : 'Upgrade to Premium to access multiple Bingo pages and custom page names'"
                @upgradePremium="handleUpgradePremium"
                @close="closePremiumLock"
              />
            </div>
          </div>
        </div>
      </template>
      </draggable>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal modal-edit">
      <div class="modal-content modal-content-edit">
        <h3>Edit Bingo Cell</h3>
        <div class="modal-form modal-form-edit">
          <div class="form-group form-group-edit">
            <label>Title:</label>
            <input v-model="editingCell.title" type="text" placeholder="Enter title">
          </div>
          <div class="form-group form-group-edit">
            <label>Points:</label>
            <input v-model.number="editingCell.points" type="number" min="0">
          </div>
          <div class="modal-buttons modal-buttons-edit">
            <button @click="saveEditedCell" class="save-button save-button-edit">Save</button>
            <button @click="closeEditModal" class="cancel-button cancel-button-edit">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, defineComponent, computed, watch, onMounted } from 'vue';
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex';
import draggable from 'vuedraggable';
import BingoGrid from '@/components/BingoGrid.vue';
import RiskManagementSidebar from '@/components/RiskManagementSidebar.vue';
import RiskRewardSection from '@/components/RiskRewardSection.vue';
import TradeIdeaSection from '@/components/TradeIdeaSection.vue';
import TradeDetailsSection from '@/components/TradeDetailsSection.vue';
import PremiumLock from '@/components/PremiumLock.vue';
import { useAuth } from '@/composables/useAuth';
import { useStore } from 'vuex';

export default defineComponent({
  name: 'BingoPage',
  
  components: {
    draggable,
    BingoGrid,
    RiskManagementSidebar,
    RiskRewardSection,
    TradeIdeaSection,
    TradeDetailsSection,
    PremiumLock
  },

  setup() {
    const auth = useAuth();
    const store = useStore();
    
    // Get premium status directly from store
    const isPremiumUser = computed(() => {
      const status = store.getters['user/isPaidUser'];
      return status;
    });

    // Create computed property for isAuthenticated
    const isAuthenticated = computed(() => {
      const status = auth.isAuthenticated.value;
      return status;
    });

    // Watch for authentication changes
    watch(() => auth.isAuthenticated.value, async (newValue, oldValue) => {
      console.log(' Auth status changed:', { 
        newValue, 
        oldValue,
        token: localStorage.getItem('token')
      });
      
      if (newValue && localStorage.getItem('token')) {
        // Wait a bit to ensure token is set
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // User just logged in, get their data and load their card
        try {
          console.log(' Fetching user data...');
          await store.dispatch('user/getCurrentUser');
          console.log(' Loading bingo card...');
          await store.dispatch('bingo/loadUserCard');
        } catch (error) {
          if (error.response?.status === 401) {
            console.log(' Not authenticated, using local state');
          } else {
            console.error(' Error loading user data:', error);
          }
        }
      } else {
        // User logged out or token expired, load from localStorage
        console.log(' Loading bingo card from localStorage...');
        await store.dispatch('bingo/loadUserCard');
      }
    }, { immediate: true });

    // Ensure bingo card is loaded on component mount
    onMounted(async () => {
      console.log(' BingoPage component mounted');
      console.log(' Initializing BingoPage...');
      await store.dispatch('bingo/loadUserCard');
    });

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
      auth,
      isPremiumUser,
      isAuthenticated,
      widgets
    };
  },

  data() {
    return {
      showEditModal: false,
      editingCell: null,
      editingCellIndex: null,
      showPremiumLock: false,
      isSidebarCollapsed: false,
      currentTradeIdea: null,
      currentSymbol: 'XRPusd',
      rrChecks: {
        riskReward: 0,
        stopLoss: false,
        entryPrice: false,
        takeProfit: false
      },
      localBingoCells: Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        title: '',
        points: 0,
        selected: false
      })),
      localTotalScore: 0,
      currentPageIndex: 0,
      localPages: [{
        id: 1,
        name: 'Default Board',
        bingoCells: Array.from({ length: 25 }, (_, i) => ({
          id: i + 1,
          title: '',
          points: 0,
          selected: false
        }))
      }],
      initialized: false,
    };
  },

  computed: {
    ...mapState('bingo', ['loading']),
    ...mapGetters('bingo', [
      'getCurrentPage',
      'getCurrentPageCells',
      'getCurrentPageIndex',
      'getAllPages'
    ]),
    ...mapGetters('user', ['isPaidUser']),
    
    activeCells() {
      return this.getCurrentPage?.bingoCells || [];
    },

    activeScore() {
      return this.activeCells.reduce((total, cell) => total + (cell.selected ? cell.points || 0 : 0), 0);
    },

    currentPageName: {
      get() {
        const page = this.getCurrentPage;
        return page ? page.name : 'Default Board';
      },
      set(newName) {
        if (!this.isAuthenticated) {
          this.showPremiumLock = true;
          return;
        }
        if (!this.isPremiumUser) {
          this.showPremiumLock = true;
          return;
        }
        this.handlePageNameUpdate(newName);
      }
    }
  },

  methods: {
    ...mapMutations('bingo', [
      'UPDATE_CELL',
      'SET_PAGES',
      'SET_CURRENT_PAGE',
      'ADD_PAGE',
      'DELETE_PAGE'
    ]),
    ...mapActions('bingo', [
      'loadUserCard',
      'saveCardState'
    ]),
    
    closePremiumLock() {
      this.showPremiumLock = false;
    },

    handleUpgradePremium() {
      if (!this.isAuthenticated) {
        // Redirect to login page with return URL
        const returnUrl = encodeURIComponent(window.location.pathname);
        this.$router.push(`/login?returnUrl=${returnUrl}`);
      } else {
        // Redirect to premium upgrade page
        this.$router.push('/premium');
      }
      this.showPremiumLock = false;
    },

    checkPremiumAccess() {
      const isPaidUser = this.$store.getters['user/isPaidUser'];
      const authStatus = this.isAuthenticated;
      
      if (authStatus) {
        console.log(' Premium Access Check:', {
          isPaidUser,
          isAuthenticated: authStatus,
          storeState: this.$store.state.user
        });
      }

      // Check if user has premium access
      const hasPremiumAccess = authStatus && isPaidUser;
      
      if (!hasPremiumAccess) {
        this.showPremiumLock = true;
      }
    },

    async initialize() {
      console.log(' Initializing BingoPage...');
      if (!this.initialized) {
        try {
          if (this.isAuthenticated) {
            await this.loadUserCard();
          } else {
            // Load from localStorage for non-authenticated users
            const savedState = localStorage.getItem('bingoState');
            if (savedState) {
              const parsedState = JSON.parse(savedState);
              this.$store.commit('bingo/SET_PAGES', parsedState.pages || []);
              this.$store.commit('bingo/SET_CURRENT_PAGE', parsedState.currentPageIndex || 0);
            }
          }
          this.initialized = true;
        } catch (error) {
          console.error('Error initializing BingoPage:', error);
        }
      }
    },

    handleSidebarToggle() {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    },

    handleSaveSettings(settings) {
      // Handle saving risk management settings
      console.log('Saving settings:', settings);
    },

    handleTradeStatusUpdate(status) {
      this.rrChecks = { ...status };
    },

    updateTradeIdea(idea) {
      this.currentTradeIdea = idea;
    },

    updateTradingSymbol(symbol) {
      this.currentSymbol = symbol;
    },

    async nextPage() {
      if (!this.isAuthenticated || !this.isPremiumUser) {
        this.showPremiumLock = true;
        return;
      }

      if (this.getCurrentPageIndex < this.getAllPages.length - 1) {
        this.SET_CURRENT_PAGE(this.getCurrentPageIndex + 1);
      } else {
        // Create new page
        this.ADD_PAGE({
          id: Date.now(),
          name: `Board ${this.getAllPages.length + 1}`,
          bingoCells: Array.from({ length: 25 }, (_, i) => ({
            id: i + 1,
            title: '',
            points: 0,
            selected: false
          }))
        });
        this.SET_CURRENT_PAGE(this.getAllPages.length - 1);
      }
      await this.saveCardState();
    },

    async previousPage() {
      if (!this.isAuthenticated || !this.isPremiumUser) {
        this.showPremiumLock = true;
        return;
      }

      if (this.getCurrentPageIndex > 0) {
        this.SET_CURRENT_PAGE(this.getCurrentPageIndex - 1);
        await this.saveCardState();
      }
    },

    async deletePage() {
      if (!this.isAuthenticated || !this.isPremiumUser) {
        this.showPremiumLock = true;
        return;
      }

      if (confirm('Are you sure you want to delete this board? This action cannot be undone.')) {
        this.DELETE_PAGE(this.getCurrentPageIndex);
        await this.saveCardState();
      }
    },

    handlePageNameUpdate(newName) {
      if (!this.isAuthenticated || !this.isPremiumUser) {
        this.showPremiumLock = true;
        return;
      }
      
      this.$store.commit('bingo/UPDATE_PAGE_NAME', { 
        pageIndex: this.getCurrentPageIndex, 
        name: newName 
      });
      this.saveCardState();
    },
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
    openEditModal(cellIndex) {
      const currentPage = this.getCurrentPage;
      if (!currentPage || !currentPage.bingoCells) return;

      this.editingCellIndex = cellIndex;
      this.editingCell = { ...currentPage.bingoCells[cellIndex] };
      this.showEditModal = true;
    },

    closeEditModal() {
      this.showEditModal = false;
      this.editingCell = null;
      this.editingCellIndex = null;
    },

    async saveEditedCell() {
      if (!this.editingCell || this.editingCellIndex === null) return;

      try {
        await this.editCell(this.editingCellIndex, this.editingCell);
        this.closeEditModal();
      } catch (error) {
        console.error('Error saving edited cell:', error);
      }
    },

    async handleCellClick(cellIndex) {
      // Always allow cell interaction for non-authenticated users
      if (!this.isAuthenticated || !this.isPremiumUser) {
        const cells = this.getCurrentPageCells;
        if (cells && cells[cellIndex]) {
          const cell = cells[cellIndex];
          this.$store.commit('bingo/UPDATE_CELL', {
            pageIndex: this.currentPageIndex,
            cellIndex,
            cell: { ...cell, selected: !cell.selected }
          });
          await this.$store.dispatch('bingo/saveCardState');
        } else {
          console.warn('Invalid cell index or cells not loaded:', { cellIndex, cells });
        }
      } else {
        // Premium user flow...
        this.checkPremiumAccess();
      }
    },

    async editCell(cellIndex, newData) {
      // Check if trying to edit cell content (title or points)
      const isEditingContent = newData.title !== undefined || newData.points !== undefined;
      
      // Only require premium if:
      // 1. User is editing content (title/points) AND
      // 2. User is not on the first board (getCurrentPageIndex > 0) AND
      // 3. User is not authenticated or not premium
      if (isEditingContent && this.getCurrentPageIndex > 0 && (!this.isAuthenticated || !this.isPremiumUser)) {
        this.showPremiumLock = true;
        return;
      }

      try {
        const currentPage = this.getCurrentPage;
        if (!currentPage || !currentPage.bingoCells) {
          console.error('Invalid page structure:', currentPage);
          return;
        }

        const cell = { ...currentPage.bingoCells[cellIndex], ...newData };

        this.UPDATE_CELL({
          pageIndex: this.getCurrentPageIndex,
          cellIndex,
          cell
        });

        if (this.isAuthenticated) {
          await this.saveCardState();
        } else {
          // Save to localStorage for non-authenticated users
          const bingoState = JSON.stringify(this.$store.state.bingo);
          localStorage.setItem('bingoState', bingoState);
        }
      } catch (error) {
        console.error('Error updating cell:', error);
      }
    },

    async toggleCell(cellIndex) {
      const currentPage = this.getCurrentPage;
      if (!currentPage || !currentPage.bingoCells) return;

      const cell = currentPage.bingoCells[cellIndex];
      await this.editCell(cellIndex, { selected: !cell.selected });
    },
  },
  async created() {
    console.log(' BingoPage component created');
    await this.initialize();
  },
  async mounted() {
    console.log(' BingoPage component mounted');
    if (!this.initialized) {
      await this.initialize();
    }
  }
});
</script>

<style>
@import '../assets/styles/BingoPage.css';
</style>