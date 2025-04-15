<template>
  <div>
    <!-- Dashboard container for proper structure -->
    <div class="dashboard-container">
      <!-- Dashboard layout with styling -->
      <div class="dashboard-layout" :style="{ overflow: 'visible' }">
        <!-- Decorative border element -->
        <div class="grid-border-decoration"></div>
        
        <GridLayoutManager
          :layout="layout"
          :isSidebarCollapsed="isSidebarCollapsed"
          @layout-updated="onLayoutUpdated"
          @drag-start="onDragStart"
          @drag-end="onDragEnd"
          @update-score="handleScoreUpdate"
          @open-trade-history="$emit('open-trade-history')"
          @show-export-tooltip="showExportTooltip"
          @hide-export-tooltip="hideExportTooltip"
        >
          <!-- Bingo widget navigation slot -->
          <template #bingo-navigation>
            <button 
              class="page-nav-button"
              @click="handlePreviousPage"
              :disabled="(Array.isArray(bingoWidgetRef) ? bingoWidgetRef[0]?.currentPageIndex : bingoWidgetRef?.currentPageIndex) === 0"
            >
              ←
            </button>

            <div class="board-name-container">
              <template v-if="Array.isArray(bingoWidgetRef) ? bingoWidgetRef[0]?.isEditingName : bingoWidgetRef?.isEditingName">
                <input
                  ref="nameInput"
                  v-model="(Array.isArray(bingoWidgetRef) ? bingoWidgetRef[0] : bingoWidgetRef).editedName"
                  class="board-name-input"
                  @blur="handleSaveBoardName"
                  @keyup.enter="handleSaveBoardName"
                  @keyup.esc="handleCancelNameEdit"
                  placeholder="Default Board"
                />
              </template>
              <template v-else>
                <div 
                  class="board-name"
                  @click="handleStartNameEdit"
                >
                  {{ (Array.isArray(bingoWidgetRef) ? bingoWidgetRef[0] : bingoWidgetRef)?.currentPageName || 'Default Board' }}
                </div>
              </template>
            </div>

            <button 
              class="page-nav-button"
              @click="handleNextPage"
              :disabled="false"
            >
              →
            </button>

            <button 
              class="page-nav-button delete-button"
              @click="handleDeletePage"
              :disabled="(Array.isArray(bingoWidgetRef) ? bingoWidgetRef[0]?.currentPageIndex : bingoWidgetRef?.currentPageIndex) === 0"
              title="Delete current board"
            >
              🗑
            </button>

            <button 
              class="page-nav-button export-button"
              @click="handleExportBoard"
              title="Export current board"
            >
              ↓
            </button>
          </template>
          
          <!-- Bingo widget content slot -->
          <template #bingo-content>
            <BingoWidget 
              ref="bingoWidget"
              :score="currentScore"
              @update:score="handleScoreUpdate"
              @mounted="bingoWidgetRef = $refs.bingoWidget"
              @cell-click="handleCellClick"
              @open-edit-modal="openEditModal"
            />
          </template>
        </GridLayoutManager>
      </div>
    </div>



    <!-- Edit Modal -->
    <div v-if="editModalVisible" class="modal">
      <div class="modal-content">
        <h3>Edit Bingo Cell</h3>
        <div class="modal-form">
          <div class="form-group">
            <label>Title:</label>
            <input v-model="editedCell.title" type="text" placeholder="Enter title">
          </div>
          <div class="form-group">
            <label>Points:</label>
            <input v-model.number="editedCell.points" type="number" min="0">
          </div>
          <div class="modal-buttons">
            <button @click="saveEditedCell" class="save-button">Save</button>
            <button @click="closeEditModal" class="cancel-button">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { mapState, mapGetters } from 'vuex';
import BingoWidget from '@/components/widgets/BingoWidget.vue';
import { markRaw } from 'vue';
import RiskRewardWidget from '@/components/widgets/RiskRewardWidget.vue';
import TradeIdeaWidget from '@/components/widgets/TradeIdeaWidget.vue';
import TradeDetailsWidget from '@/components/widgets/TradeDetailsWidget.vue';

import GridLayoutManager from '@/components/layout/GridLayoutManager.vue';

export default defineComponent({  
  props: {
    isSidebarCollapsed: {
      type: Boolean,
      default: false
    }
  },
  
  emits: ['open-premium-lock', 'open-trade-history'],
  name: 'BingoPage',
  
  components: {
    BingoWidget,
    GridLayoutManager
  },

  data() {
    return {
      currentScore: 0,
      layout: [
        {
          x: 0,
          y: 0,
          w: 4,
          h: 9,
          i: "bingo",
          title: "Bingo Grid",
          workflowNumber: 2,
          component: markRaw(BingoWidget),
          minW: 4,
          minH: 9,
          maxW: 12,
          maxH: 12,
          props: {
            score: 0
          }
        },
        {
          x: 4,
          y: 0,
          w: 2,
          h: 9,
          i: "risk",
          title: "Score: Risk/Reward",
          workflowNumber: 3,
          component: markRaw(RiskRewardWidget),
          minW: 2,
          minH: 9,
          maxW: 12,
          maxH: 12,
          props: {
            score: 0
          }
        },
        {
          x: 0,
          y: 9,
          w: 3,
          h: 6,
          i: "trade-idea",
          title: "Trade's Idea",
          workflowNumber: 1,
          component: markRaw(TradeIdeaWidget),
          minW: 3,
          minH: 6,
          maxW: 12,
          maxH: 12
        },
        {
          x: 3,
          y: 9,
          w: 4,
          h: 6,
          i: "trade-details",
          title: "Trade's Details",
          workflowNumber: 4,
          component: markRaw(TradeDetailsWidget),
          minW: 4,
          minH: 6,
          maxW: 12,
          maxH: 12,
          props: {
            score: 0
          }
        }
      ],
      workflowTooltipVisible: false,
      workflowTooltipNumber: null,
      workflowTooltipX: 0,
      workflowTooltipY: 0,
      editModalVisible: false,
      editedCell: {
        title: '',
        points: 0,
        selected: false
      },
      editingCellIndex: null,

      bingoWidgetRef: null,
      exportTooltipVisible: false,
      exportTooltipX: 0,
      exportTooltipY: 0
    };
  },

  computed: {
    ...mapState('bingo', ['loading']),
    ...mapGetters('bingo', [
      'getCurrentPage',
      'getCurrentPageIndex',
      'getAllPages'
    ]),
    ...mapGetters('user', ['isPaidUser']),
    
    isPremium() {
      return this.isPaidUser;
    },
    activeCells() {
      return this.getCurrentPage?.bingoCells || [];
    },

    activeScore() {
      return this.activeCells.reduce((total, cell) => {
        return total + (cell.selected ? (cell.points || 0) : 0);
      }, 0);
    },

    rrChecks() {
      const score = this.activeScore;
      return {
        sixPoints: score >= 6 && score < 11,      // 2R/R
        elevenPoints: score >= 11 && score < 16,  // 3R/R
        sixteenPoints: score >= 16 && score < 20, // 4R/R
        twentyPoints: score >= 20                 // 5R/R (Hidden Bingo)
      };
    },

    currentPageName: {
      get() {
        return this.getCurrentPage?.name || 'Board 1';
      },
      set(newName) {
        if (!this.isPremium) {
          this.showPremiumLock = true;
          return;
        }
        this.handlePageNameUpdate(newName);
      }
    },


  },

  watch: {
    // Watch the layout for changes and update localStorage
    layout: {
      handler() {
        this.syncActiveWidgetsWithLayout();
      },
      deep: true
    },
    '$route.query.addWidget': {
      immediate: true,
      handler(widgetType) {
        if (widgetType) {
          this.addWidgetFromToolbox(widgetType);
          
          // Clear the query parameter after processing
          this.$router.replace({ query: {} });
        }
      }
    },
    '$route.query.removeWidget': {
      immediate: true,
      handler(widgetType) {
        if (widgetType) {
          this.removeWidgetFromToolbox(widgetType);
          
          // Clear the query parameter after processing
          this.$router.replace({ query: {} });
        }
      }
    },
    bingoWidgetRef: {
      handler(newRef) {
        console.log('BingoWidget ref updated:', newRef);
        const widget = Array.isArray(newRef) ? newRef[0] : newRef;
        if (widget) {
          // Initialize any necessary state
          console.log('BingoWidget methods:', {
            startNameEdit: typeof widget.startNameEdit,
            saveBoardName: typeof widget.saveBoardName,
            previousPage: typeof widget.previousPage,
            nextPage: typeof widget.nextPage,
            deletePage: typeof widget.deletePage
          });
        }
      },
      immediate: true
    }
  },

  methods: {
    removeWidgetFromToolbox(widgetType) {
      console.log(`Removing widget: ${widgetType}`);
      
      // Find widgets of the specified type and remove them from the layout
      let widgetsRemoved = false;
      const updatedLayout = this.layout.filter(item => {
        // Special case for risk-reward widget which can use different prefixes
        if (widgetType === 'risk-reward' && (item.i.startsWith('risk-reward-') || item.i.startsWith('risk-') || item.i === 'risk')) {
          console.log(`Found risk-reward widget to remove: ${item.i}`);
          widgetsRemoved = true;
          return false;
        }
        // For other widgets, check if the ID starts with the widgetType
        const shouldRemove = item.i.startsWith(widgetType);
        if (shouldRemove) {
          console.log(`Found widget to remove: ${item.i}`);
          widgetsRemoved = true;
        }
        return !shouldRemove;
      });
      
      console.log(`Widgets removed: ${widgetsRemoved}`);
      console.log(`Updated layout length: ${updatedLayout.length}, Original layout length: ${this.layout.length}`);
      
      // Update the layout with the filtered widgets
      this.layout = updatedLayout;
      
      // Update localStorage to remove the widget from active widgets
      this.updateActiveWidgetsInLocalStorage(widgetType, 'remove');
      
      // Update the grid dimensions
      this.$nextTick(() => {
        this.updateGridDimensions();
      });
    },
    openEditModal(cellIndex) {
      console.log('Opening edit modal for cell:', cellIndex);
      const currentCell = this.getCurrentPage?.bingoCells[cellIndex];
      if (currentCell) {
        this.editingCellIndex = cellIndex;
        this.editedCell = {
          title: currentCell.title || '',
          points: currentCell.points || 0,
          selected: currentCell.selected || false
        };
        this.editModalVisible = true;
      }
    },

    closeEditModal() {
      this.editModalVisible = false;
      this.editingCellIndex = null;
      this.editedCell = {
        title: '',
        points: 0,
        selected: false
      };
    },

    saveEditedCell() {
      if (this.editingCellIndex !== null) {
        const currentCell = this.getCurrentPage?.bingoCells[this.editingCellIndex];
        if (currentCell) {
          this.editCell(this.editingCellIndex, {
            ...currentCell,
            title: this.editedCell.title,
            points: this.editedCell.points
          });
        }
      }
      this.closeEditModal();
    },
    handleCellClick(cellIndex) {
      console.log('Cell clicked:', cellIndex);
      const bingoWidget = Array.isArray(this.bingoWidgetRef) ? this.bingoWidgetRef[0] : this.bingoWidgetRef;
      if (bingoWidget?.handleCellClick) {
        bingoWidget.handleCellClick(cellIndex);
      }
    },

    editCell(cellIndex, newData) {
      console.log('Editing cell:', cellIndex, newData);
      const currentPage = this.getCurrentPage;
      if (currentPage && currentPage.bingoCells[cellIndex]) {
        this.$store.commit('bingo/UPDATE_CELL', {
          pageIndex: this.$store.state.bingo.currentPageIndex,
          cellIndex,
          cell: {
            ...currentPage.bingoCells[cellIndex],
            ...newData
          }
        });
        this.$store.dispatch('bingo/saveCardState');
      }
    },

    showExportTooltip(event) {
      const exportButton = event.target;
      const rect = exportButton.getBoundingClientRect();
      
      this.exportTooltipX = rect.left;
      this.exportTooltipY = rect.bottom;
      this.exportTooltipVisible = true;
    },
    hideExportTooltip() {
      this.exportTooltipVisible = false;
    },
    handleScoreUpdate(score) {
      console.log('Score update received:', score);
      this.currentScore = score;
      
      // Update score in all relevant widgets
      const bingoWidget = this.layout.find(item => item.i === 'bingo');
      const riskWidget = this.layout.find(item => item.i === 'risk');
      const tradeDetailsWidget = this.layout.find(item => item.i === 'trade-details');
      
      if (bingoWidget) {
        bingoWidget.props = { ...bingoWidget.props, score };
      }
      if (riskWidget) {
        riskWidget.props = { ...riskWidget.props, score };
      }
      if (tradeDetailsWidget) {
        tradeDetailsWidget.props = { ...tradeDetailsWidget.props, score };
      }
    },
    updateWidgetNavigation(widgetId, { navigation }) {
      this.layout = this.layout.map(item => {
        if (item.i === widgetId) {
          return {
            ...item,
            navigation: {
              ...item.navigation,
              ...navigation
            }
          };
        }
        return item;
      });
    },
    onDragStart() {
      console.log('Drag started');
    },
    
    onDragEnd() {
      console.log('Drag ended');
    },
    
    onLayoutUpdated(newLayout) {
      console.log('Layout updated');
      // Update the layout in the component
      this.layout = newLayout;
    },
    handleStartNameEdit() {
      console.log('Board name clicked');
      if (!this.isPremium) {
        this.$emit('open-premium-lock');
        return;
      }
      const bingoWidget = Array.isArray(this.bingoWidgetRef) ? this.bingoWidgetRef[0] : this.bingoWidgetRef;
      console.log('BingoWidget ref:', bingoWidget);
      if (bingoWidget?.startNameEdit) {
        bingoWidget.startNameEdit();
      } else {
        console.warn('startNameEdit method not found on bingoWidget');
      }
    },

    handleNextPage() {
      if (!this.isPremium) {
        this.$emit('open-premium-lock');
        return;
      }
      const bingoWidget = Array.isArray(this.bingoWidgetRef) ? this.bingoWidgetRef[0] : this.bingoWidgetRef;
      console.log('BingoWidget ref:', bingoWidget);
      if (bingoWidget?.nextPage) {
        bingoWidget.nextPage();
      } else {
        console.warn('nextPage method not found on bingoWidget');
      }
    },

    handlePreviousPage() {
      if (!this.isPremium) {
        this.$emit('open-premium-lock');
        return;
      }
      const bingoWidget = Array.isArray(this.bingoWidgetRef) ? this.bingoWidgetRef[0] : this.bingoWidgetRef;
      console.log('BingoWidget ref:', bingoWidget);
      if (bingoWidget?.previousPage) {
        bingoWidget.previousPage();
      } else {
        console.warn('previousPage method not found on bingoWidget');
      }
    },

    handleSaveBoardName() {
      console.log('Save board name');
      const bingoWidget = Array.isArray(this.bingoWidgetRef) ? this.bingoWidgetRef[0] : this.bingoWidgetRef;
      if (bingoWidget?.saveBoardName) {
        bingoWidget.saveBoardName();
      } else {
        console.warn('saveBoardName method not found on bingoWidget');
      }
    },

    handleCancelNameEdit() {
      console.log('Cancel name edit');
      const bingoWidget = Array.isArray(this.bingoWidgetRef) ? this.bingoWidgetRef[0] : this.bingoWidgetRef;
      if (bingoWidget?.cancelNameEdit) {
        bingoWidget.cancelNameEdit();
      } else {
        console.warn('cancelNameEdit method not found on bingoWidget');
      }
    },

    handleDeletePage() {
      if (!this.isPremium) {
        this.$emit('open-premium-lock');
        return;
      }
      const bingoWidget = Array.isArray(this.bingoWidgetRef) ? this.bingoWidgetRef[0] : this.bingoWidgetRef;
      console.log('BingoWidget ref:', bingoWidget);
      if (bingoWidget?.deletePage) {
        bingoWidget.deletePage();
      } else {
        console.warn('deletePage method not found on bingoWidget');
      }
    },
    handleExportBoard() {
      console.log('Export button clicked');
      const bingoWidget = Array.isArray(this.bingoWidgetRef) ? this.bingoWidgetRef[0] : this.bingoWidgetRef;
      if (bingoWidget?.exportBoard) {
        bingoWidget.exportBoard();
      } else {
        console.warn('exportBoard method not found on bingoWidget');
      }
    },

    
    addWidgetFromToolbox(widgetType) {
      console.log(`Adding widget: ${widgetType}`);
      
      // Check if widget already exists in the layout
      let widgetExists = false;
      if (widgetType === 'risk-reward') {
        // Special case for risk-reward widget - check for both formats of ID
        widgetExists = this.layout.some(item => 
          item.i.startsWith('risk-reward-') || // New format
          item.i.startsWith('risk-') || // Old format
          item.i === 'risk' // Mobile format
        );
      } else {
        widgetExists = this.layout.some(item => item.i.startsWith(widgetType));
      }
      
      if (widgetExists) {
        console.log(`Widget ${widgetType} already exists in layout, not adding again`);
        return;
      }

      // Find the maximum y-coordinate in the current layout
      let maxY = 0;
      this.layout.forEach(item => {
        const itemBottom = item.y + item.h;
        if (itemBottom > maxY) {
          maxY = itemBottom;
        }
      });

      // Create a new widget based on the type
      let newWidget = null;

      switch (widgetType) {
        case 'bingo':
          newWidget = {
            x: 0,
            y: maxY,
            w: 4,
            h: 9,
            i: "bingo-" + Date.now(),
            title: "Bingo Grid",
            component: markRaw(BingoWidget),
            minW: 4,
            minH: 9,
            maxW: 12,
            maxH: 12,
            props: {
              score: 0
            }
          };
          break;
          
        case 'risk-reward':
          newWidget = {
            x: 0,
            y: maxY,
            w: 2,
            h: 9,
            i: "risk-reward-" + Date.now(),
            title: "Score: Risk/Reward",
            component: markRaw(RiskRewardWidget),
            minW: 2,
            minH: 9,
            maxW: 12,
            maxH: 12,
            props: {
              score: 0
            }
          };
          break;
          
        case 'trade-details':
          newWidget = {
            x: 0,
            y: maxY,
            w: 6,
            h: 8,
            i: "trade-details-" + Date.now(),
            title: "Trade Details",
            component: markRaw(TradeDetailsWidget),
            minW: 3,
            minH: 8,
            maxW: 12,
            maxH: 12
          };
          break;
          
        case 'trade-idea':
          newWidget = {
            x: 0,
            y: maxY,
            w: 3,
            h: 6,
            i: "trade-idea-" + Date.now(),
            title: "Trade's Idea",
            component: markRaw(TradeIdeaWidget),
            minW: 3,
            minH: 6,
            maxW: 12,
            maxH: 12
          };
          break;
      }
      
      if (newWidget) {
        console.log(`Adding new widget to layout:`, newWidget);
        this.layout.push(newWidget);
        
        // Update localStorage to add the widget to active widgets
        this.updateActiveWidgetsInLocalStorage(widgetType, 'add');
        
        // Update the grid dimensions
        this.$nextTick(() => {
          this.updateGridDimensions();
          
          // Force a sync of active widgets with layout
          this.syncActiveWidgetsWithLayout();
          console.log('Active widgets after adding:', JSON.parse(localStorage.getItem('activeWidgets')));
        });
      }
    },


    
    updateActiveWidgetsInLocalStorage(widgetType, action) {
      // Get current active widgets from localStorage
      const storedWidgets = localStorage.getItem('activeWidgets');
      let activeWidgets = storedWidgets ? JSON.parse(storedWidgets) : [];
      
      if (action === 'add' && !activeWidgets.includes(widgetType)) {
        // Add the widget to active widgets
        activeWidgets.push(widgetType);
        console.log(`Added ${widgetType} to active widgets in localStorage`);
      } else if (action === 'remove') {
        // Remove the widget from active widgets
        activeWidgets = activeWidgets.filter(type => type !== widgetType);
        console.log(`Removed ${widgetType} from active widgets in localStorage`);
      }
      
      // Save updated active widgets to localStorage
      localStorage.setItem('activeWidgets', JSON.stringify(activeWidgets));
      console.log('Active widgets in localStorage:', activeWidgets);
    },
    
    // Sync the active widgets in localStorage with the current layout
    syncActiveWidgetsWithLayout() {
      const activeWidgets = [];
      
      console.log('Syncing active widgets with layout:', this.layout);
      
      // Check for each widget type in the layout
      if (this.layout.some(item => item.i.startsWith('bingo'))) {
        activeWidgets.push('bingo');
      }
      
      // Special case for risk-reward widget - check for both formats of ID
      const hasRiskWidget = this.layout.some(item => 
        item.i.startsWith('risk-reward-') || // New format
        item.i.startsWith('risk-') || // Old format
        item.i === 'risk' // Mobile format
      );
      console.log('Has risk widget?', hasRiskWidget);
      if (hasRiskWidget) {
        activeWidgets.push('risk-reward');
      }
      
      if (this.layout.some(item => item.i.startsWith('trade-details'))) {
        activeWidgets.push('trade-details');
      }
      
      if (this.layout.some(item => item.i.startsWith('trade-idea'))) {
        activeWidgets.push('trade-idea');
      }
      
      console.log('Active widgets after sync:', activeWidgets);
      
      // Save to localStorage
      localStorage.setItem('activeWidgets', JSON.stringify(activeWidgets));
    },
    

  },

  mounted() {
    console.log('BingoPage mounted');
    this.$store.dispatch('bingo/loadUserCard');
    
    // Initial sync of active widgets with layout
    this.$nextTick(() => {
      this.syncActiveWidgetsWithLayout();
    });
    
    this.$nextTick(() => {
      console.log('BingoPage nextTick');
      this.bingoWidgetRef = this.$refs.bingoWidget;
      console.log('BingoWidget ref in mounted:', this.bingoWidgetRef);
    });
  },
});
</script>

<style>
@import '@/assets/styles/BingoPage.css';
</style>