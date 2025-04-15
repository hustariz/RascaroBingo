/**
 * WidgetToolboxManager.js
 * 
 * A utility class to handle widget management functionality.
 * This helps separate the widget management logic from the UI components.
 */

// Import widget components
import BingoWidget from '@/components/widgets/BingoWidget.vue';
import RiskRewardWidget from '@/components/widgets/RiskRewardWidget.vue';
import TradeDetailsWidget from '@/components/widgets/TradeDetailsWidget.vue';
import TradeIdeaWidget from '@/components/widgets/TradeIdeaWidget.vue';
import { markRaw } from 'vue';

export default class WidgetToolboxManager {
  /**
   * Get available widget definitions
   * 
   * @returns {Object} Object containing widget categories and their widgets
   */
  static getAvailableWidgets() {
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
          id: 'risk-reward',
          name: 'Risk/Reward',
          description: 'Calculate and visualize risk/reward ratios',
          icon: 'balance-scale',
          component: 'RiskRewardWidget'
        },
        {
          id: 'trade-details',
          name: 'Trade Details',
          description: 'Log detailed information about your trades',
          icon: 'clipboard-list',
          component: 'TradeDetailsWidget'
        },
        {
          id: 'trade-idea',
          name: 'Trade Idea',
          description: 'Document your trading ideas and strategies',
          icon: 'lightbulb',
          component: 'TradeIdeaWidget'
        }
      ],
      analyticsWidgets: [
        // These can be added later as needed
      ]
    };
  }

  /**
   * Create a new widget configuration based on the widget type
   * 
   * @param {String} widgetType - Type of widget to create
   * @param {Number} maxY - Maximum Y coordinate in the current layout
   * @returns {Object|null} Widget configuration object or null if widget type is not supported
   */
  static createWidgetConfig(widgetType, maxY) {
    let newWidget = null;

    switch (widgetType) {
      case 'bingo':
        newWidget = {
          x: 0,
          y: maxY,
          w: 5,
          h: 9,
          i: "bingo-" + Date.now(),
          title: "Bingo Grid",
          component: markRaw(BingoWidget),
          minW: 5,
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
          x: 1,
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
    
    return newWidget;
  }

  /**
   * Find the maximum Y coordinate in the current layout
   * 
   * @param {Array} layout - Current grid layout
   * @returns {Number} Maximum Y coordinate
   */
  static findMaxY(layout) {
    let maxY = 0;
    layout.forEach(item => {
      const itemBottom = item.y + item.h;
      if (itemBottom > maxY) {
        maxY = itemBottom;
      }
    });
    return maxY;
  }

  /**
   * Check if a widget already exists in the layout
   * 
   * @param {Array} layout - Current grid layout
   * @param {String} widgetType - Type of widget to check
   * @returns {Boolean} True if widget exists, false otherwise
   */
  static widgetExists(layout, widgetType) {
    if (widgetType === 'risk-reward') {
      // Special case for risk-reward widget - check for both formats of ID
      return layout.some(item => 
        item.i.startsWith('risk-reward-') || // New format
        item.i.startsWith('risk-') || // Old format
        item.i === 'risk' // Mobile format
      );
    } else {
      return layout.some(item => item.i.startsWith(widgetType));
    }
  }

  /**
   * Remove widgets of a specific type from the layout
   * 
   * @param {Array} layout - Current grid layout
   * @param {String} widgetType - Type of widget to remove
   * @returns {Object} Object containing the updated layout and a flag indicating if widgets were removed
   */
  static removeWidgetsOfType(layout, widgetType) {
    let widgetsRemoved = false;
    
    const updatedLayout = layout.filter(item => {
      // Special case for risk-reward widget which can use different prefixes
      if (widgetType === 'risk-reward' && 
          (item.i.startsWith('risk-reward-') || item.i.startsWith('risk-') || item.i === 'risk')) {
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
    
    return { updatedLayout, widgetsRemoved };
  }
}
