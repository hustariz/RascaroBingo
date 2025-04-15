<template>
  <div class="grid-layout-manager">
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
                <!-- Bingo widget navigation -->
                <div v-if="item.i === 'bingo'" class="widget-navigation" style="margin-left: 0.5rem;">
                  <slot name="bingo-navigation"></slot>
                </div>
                <!-- Other widget navigation -->
                <div v-else-if="item.navigation" class="widget-navigation" style="margin-left: 0.5rem;">
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
                    @mouseover="$emit('show-export-tooltip', $event)"
                    @mouseleave="$emit('hide-export-tooltip')"
                  >
                    ↓
                  </button>
                </div>
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
            <!-- Bingo widget content -->
            <template v-if="item.i === 'bingo'">
              <slot name="bingo-content"></slot>
            </template>
            <!-- Other widget content -->
            <component 
              v-else
              :is="item.component"
              v-bind="item.props || {}"
              @update:score="$emit('update-score', $event)"
              @open-trade-history="$emit('open-trade-history')"
            />
          </div>
          <div class="vue-resizable-handle"></div>
        </div>
      </GridItem>
    </GridLayout>
    
    <!-- Workflow Tooltip -->
    <div class="workflow-tooltip" v-show="workflowTooltipVisible" :style="workflowTooltipStyle">
      <div v-if="workflowTooltipNumber === 1">First check your trading pair and write your trade idea 💭</div>
      <div v-if="workflowTooltipNumber === 2">Attribute points to your trading practices and check the bingo cases to increase your score! 🎯</div>
      <div v-if="workflowTooltipNumber === 3">The more points you earn, the more risk you can allocate to your trade, which can be a further target / stoploss or more size for the trade! 📈</div>
      <div v-if="workflowTooltipNumber === 4">Now enter the stoploss of your trade first (where your idea is wrong), then your entry and we will calculate a proposal of target based of the points you earned previously! 🎯💰</div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { GridLayout, GridItem } from 'vue3-grid-layout';

export default defineComponent({
  name: 'GridLayoutManager',
  
  components: {
    GridLayout,
    GridItem
  },
  
  props: {
    layout: {
      type: Array,
      required: true
    },
    isSidebarCollapsed: {
      type: Boolean,
      default: false
    }
  },
  
  emits: ['layout-updated', 'drag-start', 'drag-end', 'update-score', 'open-trade-history', 'show-export-tooltip', 'hide-export-tooltip'],
  
  data() {
    return {
      currentLayout: [],
      gridWidth: 0,
      gridHeight: 0,
      rowHeightValue: 45, // Base row height
      isDragging: false,
      resizeTimeout: null,
      workflowTooltipVisible: false,
      workflowTooltipNumber: null,
      workflowTooltipX: 0,
      workflowTooltipY: 0
    };
  },
  
  computed: {
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
        this.$emit('layout-updated', newLayout);
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
      this.$emit('drag-start');
      
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
          this.$emit('drag-end');
          
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
      
      // Store the current layout and emit the update
      this.currentLayout = newLayout;
      this.$emit('layout-updated', newLayout);
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
      const sidebarWidth = this.isSidebarCollapsed ? 60 : 300;
      const horizontalPadding = 40;
      const verticalPadding = 150;

      this.gridWidth = window.innerWidth - sidebarWidth - horizontalPadding;
      
      // Calculate the required height based on widget positions
      let maxBottom = 0;
      if (Array.isArray(this.responsiveLayout)) {
        this.responsiveLayout.forEach(item => {
          const bottom = (item.y + item.h) * this.rowHeight;
          if (bottom > maxBottom) {
            maxBottom = bottom;
          }
        });
      }
      
      // Set a minimum height based on viewport
      const viewportHeight = window.innerHeight;
      const minHeight = viewportHeight - verticalPadding;
      
      // Use the larger of calculated height or minimum height
      this.gridHeight = Math.max(maxBottom + 100, minHeight);
      
      // Ensure minimum dimensions
      this.gridWidth = Math.max(this.gridWidth, 300);
      this.gridHeight = Math.max(this.gridHeight, 300);
      
      // Update the dashboard layout height
      this.$nextTick(() => {
        const dashboardLayout = document.querySelector('.dashboard-layout');
        if (dashboardLayout) {
          dashboardLayout.style.minHeight = `${this.gridHeight}px`;
          
          // Ensure the main content can scroll if needed
          const mainContent = document.querySelector('.main-content');
          if (mainContent) {
            mainContent.style.overflow = 'auto';
          }
        }
      });
    }
  },
  
  mounted() {
    // Update grid dimensions based on viewport size
    this.updateGridDimensions();
    
    // Add resize event listener
    window.addEventListener('resize', this.handleResize);
  },
  
  beforeUnmount() {
    // Remove resize event listener when component is destroyed
    window.removeEventListener('resize', this.handleResize);
  }
});
</script>

<style scoped>
.grid-layout-manager {
  position: relative;
  width: 100%;
  height: 100%;
}

.workflow-tooltip {
  position: fixed;
  z-index: 3000;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  pointer-events: none;
  transition: opacity 0.2s, visibility 0.2s;
  max-width: 300px;
}
</style>
