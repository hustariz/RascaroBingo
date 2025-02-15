<template>
  <div class="page-container" @open-trade-history="$emit('open-trade-history')" style="overflow: visible !important;">
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
    
    <div class="main-content" :class="{ 'expanded': isSidebarCollapsed }" style="overflow: visible !important;">
      <GridLayout
        v-model:layout="layout"
        :col-num="12"
        :row-height="50"
        :is-draggable="true"
        :is-resizable="true"
        :vertical-compact="false"
        :margin="[5, 5]"
        :use-css-transforms="true"
        :width="gridWidth"
        :height="gridHeight"
        :auto-size="true"
        :prevent-collision="false"
        :resizable-handle="'.vue-resizable-handle'"
        class="dashboard-layout"
      >
        <GridItem
          v-for="item in layout"
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
                <div class="widget-title-area">
                  <span class="widget-title">{{ item.title }}</span>
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
            <div class="widget-content no-drag">
              <component 
                :is="item.component" 
                v-if="item.component" 
                v-bind="item.props" 
                @open-trade-history="$emit('open-trade-history')"
                @edit-cell="openEditModal"
                @score-updated="handleScoreUpdate"
              ></component>
              <div v-else>Widget {{ item.i }}</div>
            </div>
            <div class="vue-resizable-handle"></div>
          </div>
        </GridItem>
      </GridLayout>
    </div>

    <!-- Workflow Tooltip -->
    <div class="workflow-tooltip" v-show="workflowTooltipVisible" :style="workflowTooltipStyle">
      <div v-if="workflowTooltipNumber === 1">First check your trading pair and write your trade idea 💭</div>
      <div v-if="workflowTooltipNumber === 2">Attribute points to your trading practices and check the bingo cases to increase your score! 🎯</div>
      <div v-if="workflowTooltipNumber === 3">The more points you earn, the more risk you can allocate to your trade, which can be a further target / stoploss or more size for the trade! 📈</div>
      <div v-if="workflowTooltipNumber === 4">Now enter the stoploss of your trade first (where your idea is wrong), then your entry and we will calculate a proposal of target based of the points you earned previously! 🎯💰</div>
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
import { defineComponent, computed } from 'vue';
import { mapState, mapGetters, useStore } from 'vuex';
import { markRaw } from 'vue';
import BingoWidget from '@/components/widgets/BingoWidget.vue';
import RiskRewardWidget from '@/components/widgets/RiskRewardWidget.vue';
import TradeIdeaWidget from '@/components/widgets/TradeIdeaWidget.vue';
import TradeDetailsWidget from '@/components/widgets/TradeDetailsWidget.vue';
import RiskManagementSidebar from '@/components/app/RiskManagementSidebar.vue';
import PremiumLock from '@/components/app/PremiumLock.vue';
import { GridLayout, GridItem } from 'vue3-grid-layout';

export default defineComponent({
  name: 'BingoPage',
  
  components: {
    RiskManagementSidebar,
    PremiumLock,
    GridLayout,
    GridItem,
    BingoWidget,
    RiskRewardWidget,
    TradeIdeaWidget,
    TradeDetailsWidget
  },

  setup() {
    const store = useStore();
    
    // Get premium status directly from store
    const isPremiumUser = computed(() => {
      const status = store.getters['user/isPaidUser'];
      return status;
    });

    return {
      isPremiumUser,
    };
  },

  data() {
    return {
      workflowTooltipVisible: false,
      workflowTooltipNumber: null,
      workflowTooltipX: 0,
      workflowTooltipY: 0,
      showEditModal: false,
      editingCell: null,
      editingCellIndex: null,
      showPremiumLock: false,
      isSidebarCollapsed: false,
      gridWidth: 1200,
      gridHeight: 800,
      currentScore: 0,
      layout: [
        {
          x: 0,  // Bingo Grid starts first
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
          props: {}
        },
        {
          x: 4,  // Risk/Reward next to Bingo Grid
          y: 0,
          w: 2,
          h: 9,  // Match Bingo Grid height
          i: "risk-reward",
          title: "Score: Risk/Reward",
          workflowNumber: 3,
          component: markRaw(RiskRewardWidget),
          props: {
            score: 0
          },
          minW: 2,
          minH: 9,  // Match Bingo Grid min height
          maxW: 12,
          maxH: 12
        },
        {
          x: 0,  // Trade's Idea on second row
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
          x: 3,  // Trade's Details next to Trade's Idea
          y: 9,
          w: 4,  /* Set to match minW */
          h: 6,
          i: "trade-details",
          title: "Trade's Details",
          workflowNumber: 4,
          component: markRaw(TradeDetailsWidget),
          props: {
            score: 0
          },
          minW: 4,
          minH: 6,
          maxW: 12,
          maxH: 12
        }
      ],
      isDragging: false
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
        if (!this.isPremiumUser) {
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
        // Handle error
      }
    },

    async handleCellClick(cellIndex) {
      const currentPage = this.getCurrentPage;
      if (currentPage && currentPage.bingoCells && currentPage.bingoCells[cellIndex]) {
        const cell = currentPage.bingoCells[cellIndex];
        this.$store.commit('bingo/UPDATE_CELL', {
          pageIndex: this.currentPageIndex,
          cellIndex,
          cell: { ...cell, selected: !cell.selected }
        });
      } else {
        // Handle invalid cell index or cells not loaded
      }
    },

    async editCell(cellIndex, newData) {
      try {
        const currentPage = this.getCurrentPage;
        if (!currentPage || !currentPage.bingoCells) {
          // Handle invalid page structure
          return;
        }

        const cell = { ...currentPage.bingoCells[cellIndex], ...newData };

        this.$store.commit('bingo/UPDATE_CELL', {
          pageIndex: this.getCurrentPageIndex,
          cellIndex,
          cell
        });
      } catch (error) {
        // Handle error
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
    handleScoreUpdate(score) {
      this.currentScore = score;
      // Update RiskRewardWidget props
      const riskRewardWidget = this.layout.find(item => item.i === 'risk-reward');
      if (riskRewardWidget) {
        riskRewardWidget.props.score = score;
      }
      // Update TradeDetailsWidget props
      const tradeDetailsWidget = this.layout.find(item => item.i === 'trade-details');
      if (tradeDetailsWidget) {
        tradeDetailsWidget.props.score = score;
      }
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
    }
  },
});
</script>

<style>
@import '@/assets/styles/BingoPage.css';
</style>