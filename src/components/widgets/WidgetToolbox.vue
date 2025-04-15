<template>
  <div class="widget-toolbox-container">
    <h1 class="toolbox-title">Widget Toolbox</h1>
    <p class="toolbox-description">Drag and drop widgets to customize your dashboard</p>
    
    <div class="widget-categories">
      <div class="widget-category">
        <h2 class="category-title">Trading Widgets</h2>
        <div class="widgets-grid">
          <div 
            v-for="widget in tradingWidgets" 
            :key="widget.id"
            class="widget-item"
            draggable="true"
            @dragstart="onDragStart($event, widget)"
          >
            <div class="widget-icon">
              <font-awesome-icon :icon="widget.icon" />
            </div>
            <div class="widget-info">
              <h3 class="widget-name">{{ widget.name }}</h3>
              <p class="widget-description">{{ widget.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="widget-category">
        <h2 class="category-title">Analytics Widgets</h2>
        <div class="widgets-grid">
          <div 
            v-for="widget in analyticsWidgets" 
            :key="widget.id"
            class="widget-item"
            draggable="true"
            @dragstart="onDragStart($event, widget)"
          >
            <div class="widget-icon">
              <font-awesome-icon :icon="widget.icon" />
            </div>
            <div class="widget-info">
              <h3 class="widget-name">{{ widget.name }}</h3>
              <p class="widget-description">{{ widget.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WidgetToolbox',
  data() {
    return {
      tradingWidgets: [
        {
          id: 'bingo',
          name: 'Bingo Grid',
          description: 'Track your trading decisions with a bingo grid',
          icon: 'dice',
          component: 'BingoWidget'
        },
        {
          id: 'trade-journal',
          name: 'Trade Journal',
          description: 'Log your trades and track performance',
          icon: 'edit',
          component: 'TradeJournalWidget'
        },
        {
          id: 'risk-calculator',
          name: 'Risk Calculator',
          description: 'Calculate position size and risk',
          icon: 'calculator',
          component: 'RiskCalculatorWidget'
        }
      ],
      analyticsWidgets: [
        {
          id: 'performance-chart',
          name: 'Performance Chart',
          description: 'Visualize your trading performance',
          icon: 'chart-line',
          component: 'PerformanceChartWidget'
        },
        {
          id: 'win-rate',
          name: 'Win Rate',
          description: 'Track your win/loss ratio',
          icon: 'chart-pie',
          component: 'WinRateWidget'
        },
        {
          id: 'trade-history',
          name: 'Trade History',
          description: 'View your recent trades',
          icon: 'history',
          component: 'TradeHistoryWidget'
        }
      ]
    };
  },
  methods: {
    onDragStart(event, widget) {
      // Set the data to be transferred during drag
      event.dataTransfer.setData('widget', JSON.stringify(widget));
      // Add a custom class to style the element being dragged
      event.target.classList.add('dragging');
      
      // Emit event for parent components to handle
      this.$emit('widget-drag-start', widget);
    }
  }
};
</script>

<style>
.widget-toolbox-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  margin-top: 2rem;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 10px;
  border: 1px solid rgba(238, 175, 17, 0.5);
}

.toolbox-title {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: rgb(238, 175, 17);
  text-align: center;
  font-family: 'Legendarie', sans-serif;
}

.toolbox-description {
  text-align: center;
  margin-bottom: 2rem;
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.8);
}

.widget-categories {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.category-title {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: rgb(238, 175, 17);
  border-bottom: 1px solid rgba(238, 175, 17, 0.3);
  padding-bottom: 0.5rem;
}

.widgets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.widget-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(145deg, rgba(43, 24, 16, 1), rgba(25, 16, 5, 1));
  border: 1px solid rgba(238, 175, 17, 0.3);
  border-radius: 8px;
  cursor: grab;
  transition: all 0.3s ease;
}

.widget-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(238, 175, 17, 0.2);
  border-color: rgba(238, 175, 17, 0.6);
}

.widget-item.dragging {
  opacity: 0.5;
}

.widget-icon {
  font-size: 2rem;
  color: rgb(238, 175, 17);
  margin-right: 1rem;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(238, 175, 17, 0.1);
  border-radius: 50%;
}

.widget-info {
  flex: 1;
}

.widget-name {
  font-size: 1.2rem;
  margin-bottom: 0.3rem;
  color: #fff;
}

.widget-description {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .widget-toolbox-container {
    padding: 1rem;
  }
  
  .widgets-grid {
    grid-template-columns: 1fr;
  }
  
  .toolbox-title {
    font-size: 2rem;
  }
}
</style>
