<template>
  <div class="page-container" @open-trade-history="$emit('open-trade-history')">
    <PremiumLock 
      :show="showPremiumLock" 
      :message="'Upgrade to Premium to access multiple Bingo pages and custom page names'"
      @upgradePremium="handleUpgradePremium"
      @close="closePremiumLock"
    />

    <RiskManagementSidebar 
      ref="riskSidebar"
      @save-settings="handleSaveSettings" 
      @sidebar-toggle="handleSidebarToggle" 
    />
    
    <div class="main-content" :class="{ 'expanded': isSidebarCollapsed }">
      <!-- Container with bottom margin and border styling -->
      <div class="grid-container-with-margin" style="position: relative;">
        <!-- Decorative border element -->
        <div class="grid-border-decoration"></div>
        <GridLayout
          v-model:layout="responsiveLayout"
          :col-num="isMobile ? 4 : 12"
          :row-height="rowHeight"
          :margin="[10, 10]"
          :use-css-transforms="true"
          :vertical-compact="isMobile"
          :prevent-collision="false"
          :is-draggable="true"
          :is-resizable="true"
          :responsive="true"
          :compact-type="null"
          :width="gridWidth"
          :height="gridHeight"
          :auto-size="true"
          class="dashboard-layout"
          @layout-created="onLayoutCreated"
          @layout-before-mount="onLayoutBeforeMount"
          @layout-mounted="onLayoutMounted"
          @layout-ready="onLayoutReady"
          @layout-updated="onLayoutUpdated"
        >
        <GridItem
          v-for="item in responsiveLayout"
          :key="item.i"
          :x="item.x"
          :y="item.y"
          :w="item.w"
          :h="item.h"
          :i="item.i"
          :min-w="item.minW"
          :min-h="item.minH"
          drag-allow-from=".vue-draggable-handle"
          drag-ignore-from=".no-drag"
          class="grid-item-wrapper"
        >
          <div class="grid-item">
            <div class="widget-header">
              <div class="vue-draggable-handle">
                <div class="widget-title-area" style="display: flex; align-items: center;">
                  <div class="widget-title">{{ item.title }}</div>
                  <template v-if="item.i === 'bingo'">
                    <div class="widget-navigation" style="margin-left: 0.5rem;">
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
                    </div>
                  </template>
                  <template v-else-if="item.navigation">
                    <div class="widget-navigation" style="margin-left: 0.5rem;">
                      <button 
                        class="page-nav-button"
                        @click="item.navigation.onPrevious"
                        :disabled="item.navigation.currentPageIndex === 0"
                      >
                        ←
                      </button>

                      <div class="board-name-container">
                        <template v-if="item.navigation.isEditingName">
                          <input
                            ref="nameInput"
                            v-model="item.navigation.editedName"
                            class="board-name-input"
                            @blur="item.navigation.onSave"
                            @keyup.enter="item.navigation.onSave"
                            @keyup.esc="item.navigation.onCancel"
                            placeholder="Default Board"
                          />
                        </template>
                        <template v-else>
                          <div 
                            class="board-name"
                            @click="item.navigation.onStartEdit"
                          >
                            {{ item.navigation.currentPageName || 'Default Board' }}
                          </div>
                        </template>
                      </div>

                      <button 
                        class="page-nav-button"
                        @click="item.navigation.onNext"
                        :disabled="item.navigation.currentPageIndex >= item.navigation.totalPages - 1"
                      >
                        →
                      </button>

                      <button 
                        class="page-nav-button delete-button"
                        @click="item.navigation.onDelete"
                        :disabled="item.navigation.currentPageIndex === 0"
                      >
                        🗑
                      </button>

                      <button 
                        class="page-nav-button export-button"
                        @click="item.navigation.onExport"
                        @mouseover="showExportTooltip($event)"
                        @mouseleave="hideExportTooltip"
                      >
                        ↓
                      </button>
                      <teleport to="body" v-if="exportTooltipVisible">
                        <div class="workflow-tooltip" :style="{
                          left: exportTooltipX + 'px',
                          top: exportTooltipY + 'px',
                          visibility: 'visible'
                        }">
                          Export to Excel
                        </div>
                      </teleport>
                    </div>
                  </template>
                  <div 
                    class="workflow-number" 
                    v-if="item.workflowNumber"
                    :key="'workflow-' + item.i"
                    @mouseenter="showWorkflowTooltip($event, item.workflowNumber)"
                    @mouseleave="hideWorkflowTooltip"
                  >
                    {{ item.workflowNumber }}
                  </div>
                </div>
                <div class="drag-icon"></div>
              </div>
            </div>
            <div class="widget-content">
              <component 
                :is="item.component"
                v-if="item.i !== 'bingo'"
                v-bind="item.props"
                @update:score="handleScoreUpdate"
                @open-trade-history="$emit('open-trade-history')"
              />
              <BingoWidget 
                v-else-if="item.i === 'bingo'"
                ref="bingoWidget"
                :score="currentScore"
                @update:score="handleScoreUpdate"
                @mounted="bingoWidgetRef = $refs.bingoWidget"
                @cell-click="handleCellClick"
                @open-edit-modal="openEditModal"
              />
            </div>
            <div class="vue-resizable-handle"></div>
          </div>
        </GridItem>
      </GridLayout>
      </div>
      
      <!-- Bottom spacer to ensure margin -->
      <div style="position: fixed; bottom: 0; left: 0; right: 0; height: 3rem; z-index: -1;"></div>
    </div>

    <!-- Workflow Tooltip -->
    <div class="workflow-tooltip" v-show="workflowTooltipVisible" :style="workflowTooltipStyle">
      <div v-if="workflowTooltipNumber === 1">First check your trading pair and write your trade idea 💭</div>
      <div v-if="workflowTooltipNumber === 2">Attribute points to your trading practices and check the bingo cases to increase your score! 🎯</div>
      <div v-if="workflowTooltipNumber === 3">The more points you earn, the more risk you can allocate to your trade, which can be a further target / stoploss or more size for the trade! 📈</div>
      <div v-if="workflowTooltipNumber === 4">Now enter the stoploss of your trade first (where your idea is wrong), then your entry and we will calculate a proposal of target based of the points you earned previously! 🎯💰</div>
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
import RiskManagementSidebar from '@/components/app/RiskManagementSidebar.vue';
import PremiumLock from '@/components/little_components/PremiumLock.vue';
import { GridLayout, GridItem } from 'vue3-grid-layout';

export default defineComponent({
  name: 'BingoPage',
  
  components: {
    BingoWidget,
    RiskManagementSidebar,
    PremiumLock,
    GridLayout,
    GridItem,
    RiskRewardWidget,
    TradeIdeaWidget,
    TradeDetailsWidget
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
      showPremiumLock: false,
      isSidebarCollapsed: false,
      bingoWidgetRef: null,
      rowHeightValue: 45, // Base row height
      isDragging: false,
      exportTooltipVisible: false,
      exportTooltipX: 0,
      exportTooltipY: 0,
      currentLayout: [],
      gridWidth: 0,
      gridHeight: 0,
      resizeTimeout: null
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
    workflowTooltipStyle() {
      return {
        left: `${this.workflowTooltipX}px`,
        top: `${this.workflowTooltipY}px`,
        transform: 'translate(0, 20px)',
        opacity: this.workflowTooltipVisible ? 1 : 0,
        visibility: this.workflowTooltipVisible ? 'visible' : 'hidden'
      }
    },
    isMobile() {
      return window.innerWidth < 768;
    },
    
    rowHeight() {
      // Adjust row height based on viewport height
      const baseHeight = this.rowHeightValue;
      const viewportHeight = window.innerHeight;
      
      if (viewportHeight > 1200) {
        return baseHeight * 1.2; // Larger screens
      } else if (viewportHeight < 800) {
        return baseHeight * 0.8; // Smaller screens
      }
      
      return baseHeight;
    },
    
    responsiveLayout: {
      get() {
        if (!this.isMobile) {
          return this.layout;
        }

        const mobileConfig = {
          bingo: {
            x: 0, y: 0, w: 4, h: 8,
            minW: 4, minH: 8
          },
          risk: {
            x: 0, y: 8, w: 4, h: 7,
            minW: 4, minH: 7
          },
          'trade-idea': {
            x: 0, y: 15, w: 4, h: 6,
            minW: 4, minH: 6
          },
          'trade-details': {
            x: 0, y: 21, w: 4, h: 8,
            minW: 4, minH: 8
          }
        };

        return this.layout.map(item => {
          if (mobileConfig[item.i]) {
            return {
              ...item,
              ...mobileConfig[item.i]
            };
          }
          return item;
        });
      },
      set(newLayout) {
        this.currentLayout = newLayout;
      }
    }
  },

  watch: {
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
    closePremiumLock() {
      this.showPremiumLock = false;
    },

    handleUpgradePremium() {
      this.$router.push('/premium');
      this.showPremiumLock = false;
    },

    handleSidebarToggle() {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    },

    handleSaveSettings() {
      // Handle saving risk management settings
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
    showWorkflowTooltip(event, number) {
      event.stopPropagation();  // Prevent event bubbling
      
      // Only show if not already visible with same number
      if (this.workflowTooltipVisible && this.workflowTooltipNumber === number) {
        return;
      }
      
      const workflowNumber = event.target;
      const rect = workflowNumber.getBoundingClientRect();
      
      this.workflowTooltipX = rect.left;
      this.workflowTooltipY = rect.bottom;
      this.workflowTooltipNumber = number;
      this.workflowTooltipVisible = true;
    },

    hideWorkflowTooltip(event) {
      if (event) {
        event.stopPropagation();  // Prevent event bubbling
      }
      this.workflowTooltipVisible = false;
      this.workflowTooltipNumber = null;
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
    onLayoutCreated() {
      console.log('Layout created');
    },
    onLayoutBeforeMount() {
      console.log('Layout before mount');
    },
    onLayoutMounted() {
      console.log('Layout mounted');
    },
    onLayoutReady() {
      console.log('Layout ready');
    },
    onLayoutUpdated(newLayout) {
      console.log('Layout updated');
      
      // Find the maximum y + h position to determine the required height
      let maxBottom = 0;
      
      if (Array.isArray(newLayout)) {
        newLayout.forEach(item => {
          const bottom = item.y + item.h;
          if (bottom > maxBottom) {
            maxBottom = bottom;
          }
        });
      }
      
      // If we have widgets that extend beyond our current grid height,
      // adjust the grid height to accommodate them
      if (maxBottom > 0) {
        const requiredHeight = maxBottom * this.rowHeight + 50; // Add some padding
        
        // Only expand, don't shrink
        if (requiredHeight > this.gridHeight) {
          this.gridHeight = requiredHeight;
          
          // Also update the CSS for dashboard-layout to allow scrolling when needed
          const dashboardLayout = document.querySelector('.dashboard-layout');
          if (dashboardLayout) {
            dashboardLayout.style.overflowY = 'auto';
          }
        }
      }
      
      // Store the current layout
      this.currentLayout = newLayout;
    },
    handleStartNameEdit() {
      console.log('Board name clicked');
      if (!this.isPremium) {
        this.showPremiumLock = true;
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
        this.showPremiumLock = true;
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
        this.showPremiumLock = true;
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
        this.showPremiumLock = true;
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
    handleResize() {
      // Debounce the resize event to avoid performance issues
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }
      
      this.resizeTimeout = setTimeout(() => {
        this.updateGridDimensions();
      }, 200);
    },
    
    updateGridDimensions() {
      // Calculate grid width based on viewport and sidebar
      const sidebarWidth = this.isSidebarCollapsed ? 60 : 300;
      const horizontalPadding = 40; // Account for horizontal margins and padding
      const verticalPadding = 150; // Increased padding to ensure bottom margin
      
      // Calculate grid width and height with a reduction to prevent scrollbars
      this.gridWidth = window.innerWidth - sidebarWidth - horizontalPadding;
      
      // Calculate height with a significant bottom margin
      const viewportHeight = window.innerHeight;
      this.gridHeight = viewportHeight - verticalPadding;
      
      // Ensure dimensions are never negative
      this.gridWidth = Math.max(this.gridWidth, 300);
      this.gridHeight = Math.max(this.gridHeight, 300);
      
      console.log('Grid dimensions updated:', this.gridWidth, this.gridHeight, 'Viewport height:', viewportHeight);
    },
  },

  mounted() {
    console.log('BingoPage mounted');
    this.$store.dispatch('bingo/loadUserCard');
    
    // Update grid dimensions based on viewport size
    this.updateGridDimensions();
    
    // Add resize event listener
    window.addEventListener('resize', this.handleResize);
    
    this.$nextTick(() => {
      console.log('BingoPage nextTick');
      this.bingoWidgetRef = this.$refs.bingoWidget;
      console.log('BingoWidget ref in mounted:', this.bingoWidgetRef);
    });
  },
  
  beforeUnmount() {
    // Remove resize event listener when component is destroyed
    window.removeEventListener('resize', this.handleResize);
  },
});
</script>

<style>
@import '@/assets/styles/BingoPage.css';
</style>