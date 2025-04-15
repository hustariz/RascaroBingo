<template>
  <div class="page-container" @open-trade-history="$emit('open-trade-history')" :style="{ overflow: 'auto' }">
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
    
    <div class="main-content" :class="{ 'expanded': isSidebarCollapsed }" :style="{ overflow: 'auto' }">
        <!-- Dashboard container for proper structure -->
        <div class="dashboard-container">
          <!-- Dashboard layout with styling -->
          <div class="dashboard-layout" :style="{ overflow: 'visible' }">
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
            :auto-size="true"
            @layout-created="onLayoutCreated"
            @layout-before-mount="onLayoutBeforeMount"
            @layout-mounted="onLayoutMounted"
            @layout-ready="onLayoutReady"
            @layout-updated="onLayoutUpdated"
            @drag-start="onDragStart"
            @drag-end="onDragEnd"
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
                    <div class="widget-navigation">
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

                      <ExportTooltip @export="handleExportBoard" />
                    </div>
                  </template>
                  <template v-else-if="item.navigation">
                    <BoardNavigation
                      :current-page-index="item.navigation.currentPageIndex"
                      :current-page-name="item.navigation.currentPageName"
                      :is-editing-name="item.navigation.isEditingName"
                      :edited-name="item.navigation.editedName"
                      :is-premium="isPremium"
                      :total-pages="item.navigation.totalPages || 1"
                      @previous="item.navigation.onPrevious"
                      @next="item.navigation.onNext"
                      @delete="item.navigation.onDelete"
                      @export="item.navigation.onExport"
                      @start-edit="item.navigation.onStartEdit"
                      @save-name="item.navigation.onSave"
                      @cancel-edit="item.navigation.onCancel"
                      @premium-required="showPremiumLock = true"
                      @update:edited-name="(value) => { item.navigation.editedName = value; }"
                    />
                  </template>
                  <WorkflowTooltip 
                    v-if="item.workflowNumber" 
                    :number="item.workflowNumber"
                    :key="'workflow-' + item.i"
                  />
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
            <!-- Removed duplicate resize handle -->
          </div>
        </GridItem>
            </GridLayout>
          </div>
        </div>
      
      <!-- Bottom spacer to ensure margin -->
      <div style="position: fixed; bottom: 0; left: 0; right: 0; height: 3rem; z-index: -1;"></div>
    </div>



    <!-- Edit Modal -->
    <EditCellModal
      v-model:visible="editModalVisible"
      :cell="editedCell"
      @save="handleSaveEditedCell"
      @close="closeEditModal"
    />
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
import WorkflowTooltip from '@/components/little_components/WorkflowTooltip.vue';
import ExportTooltip from '@/components/little_components/ExportTooltip.vue';
import BoardNavigation from '@/components/little_components/BoardNavigation.vue';
import GridDimensionsManager from '@/components/utils/GridDimensionsManager';
import EditCellModal from '@/components/modals/EditCellModal.vue';
import { GridLayout, GridItem } from 'vue3-grid-layout';

export default defineComponent({
  name: 'BingoPage',
  
  components: {
    GridLayout,
    GridItem,
    BingoWidget,
    RiskRewardWidget,
    TradeDetailsWidget,
    RiskManagementSidebar,
    PremiumLock,
    WorkflowTooltip,
    ExportTooltip,
    EditCellModal,
    BoardNavigation
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

    handleSaveEditedCell(updatedCell) {
      if (this.editingCellIndex !== null) {
        const currentCell = this.getCurrentPage?.bingoCells[this.editingCellIndex];
        if (currentCell) {
          this.editCell(this.editingCellIndex, {
            ...currentCell,
            title: updatedCell.title,
            points: updatedCell.points
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
    onDragStart() {
      // Set the dragging state to true
      this.isDragging = true;
      
      // Force scrollbars to appear on the html and body
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
      
      // Force scrollbars to appear on the page container
      const pageContainer = document.querySelector('.page-container');
      if (pageContainer) {
        pageContainer.style.overflowY = 'auto';
      }
      
      // Make the main content have overflow auto
      const mainContent = document.querySelector('.main-content');
      if (mainContent) {
        mainContent.style.overflow = 'auto';
      }
      
      // Make the dashboard layout have overflow visible
      const dashboardLayout = document.querySelector('.dashboard-layout');
      if (dashboardLayout) {
        dashboardLayout.style.overflow = 'visible';
      }
      
      // Update grid dimensions to ensure enough space
      this.updateGridDimensions();
    },
    
    onDragEnd() {
      // Calculate the maximum height needed based on widgets
      this.$nextTick(() => {
        // Update grid dimensions to ensure enough space
        this.updateGridDimensions();
        
        // Keep scrollbars visible for a moment
        setTimeout(() => {
          this.isDragging = false;
          
          // Keep scrollbars visible on html and body
          document.documentElement.style.overflow = 'auto';
          document.body.style.overflow = 'auto';
          
          // Keep scrollbars visible on the page container
          const pageContainer = document.querySelector('.page-container');
          if (pageContainer) {
            pageContainer.style.overflowY = 'auto';
          }
          
          // Keep the dashboard layout overflow visible
          const dashboardLayout = document.querySelector('.dashboard-layout');
          if (dashboardLayout) {
            dashboardLayout.style.overflow = 'visible';
          }
        }, 500);
      });
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

    updateGridDimensions() {
      // Use the GridDimensionsManager utility to calculate dimensions
      const dimensions = GridDimensionsManager.calculateDimensions({
        isSidebarCollapsed: this.isSidebarCollapsed,
        layout: this.responsiveLayout,
        rowHeight: this.rowHeight
      });
      
      // Update component data with calculated dimensions
      this.gridWidth = dimensions.gridWidth;
      this.gridHeight = dimensions.gridHeight;
      
      // Apply the dimensions to the DOM
      this.$nextTick(() => {
        GridDimensionsManager.applyDimensions(dimensions);
      });
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
    
    // Update grid dimensions based on viewport size
    this.updateGridDimensions();
    
    // Add resize event listener
    window.addEventListener('resize', this.handleResize);
    
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
  
  beforeUnmount() {
    // Remove resize event listener when component is destroyed
    window.removeEventListener('resize', this.handleResize);
  },
});
</script>

<style>
@import '@/assets/styles/BingoPage.css';
</style>