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
import LayoutStorageManager from './LayoutStorageManager';

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
    // First, check if we have a saved layout for this widget type
    const savedLayout = LayoutStorageManager.getWidgetLayout(widgetType);
    
    // If we have a saved layout, use it as a base but update some properties
    if (savedLayout) {
      console.log(`Using saved layout for ${widgetType}:`, savedLayout);
      
      // Create a new widget with the saved position and size
      let component;
      
      // Set component based on widget type
      switch (widgetType) {
        case 'bingo':
          component = markRaw(BingoWidget);
          break;
          
        case 'risk-reward':
          component = markRaw(RiskRewardWidget);
          break;
          
        case 'trade-details':
          component = markRaw(TradeDetailsWidget);
          break;
          
        case 'trade-idea':
          component = markRaw(TradeIdeaWidget);
          break;
      }
      
      // Create a new widget by copying all properties from the saved layout
      const newWidget = { ...savedLayout };
      
      // Update the component reference but KEEP the original ID to maintain connections
      newWidget.component = component;
      
      // Only generate a new ID if the original one doesn't exist
      if (!newWidget.i) {
        newWidget.i = `${widgetType}-${Date.now()}`;
      }
      
      // Ensure numeric properties are stored as numbers
      newWidget.x = parseInt(savedLayout.x);
      newWidget.y = parseInt(savedLayout.y);
      newWidget.w = parseInt(savedLayout.w);
      newWidget.h = parseInt(savedLayout.h);
      
      console.log(`Created widget from saved layout:`, newWidget);
      return newWidget;
    }
    
    // If no saved layout, check if we have a saved configuration
    const savedConfig = LayoutStorageManager.getWidgetConfiguration(widgetType);
    
    // If we have a saved configuration, use it as a base
    if (savedConfig) {
      console.log(`Using saved configuration for ${widgetType}:`, savedConfig);
      
      // Create a new widget with the saved position and size
      let component;
      let title;
      let minW, minH, maxW, maxH;
      
      // Set component and constraints based on widget type
      switch (widgetType) {
        case 'bingo':
          component = markRaw(BingoWidget);
          title = "Bingo Grid";
          minW = 5;
          minH = 9;
          maxW = 12;
          maxH = 12;
          break;
          
        case 'risk-reward':
          component = markRaw(RiskRewardWidget);
          title = "Score: Risk/Reward";
          minW = 2;
          minH = 9;
          maxW = 12;
          maxH = 12;
          break;
          
        case 'trade-details':
          component = markRaw(TradeDetailsWidget);
          title = "Trade Details";
          minW = 3;
          minH = 8;
          maxW = 12;
          maxH = 12;
          break;
          
        case 'trade-idea':
          component = markRaw(TradeIdeaWidget);
          title = "Trade's Idea";
          minW = 3;
          minH = 6;
          maxW = 12;
          maxH = 12;
          break;
      }
      
      // Parse saved values to ensure they're numbers
      const x = parseInt(savedConfig.x);
      const y = parseInt(savedConfig.y);
      const w = parseInt(savedConfig.w);
      const h = parseInt(savedConfig.h);
      
      console.log(`Parsed saved configuration: x=${x}, y=${y}, w=${w}, h=${h}`);
      
      // Create a new widget with saved position and size, but new ID and component
      return {
        x: x,
        y: y,
        w: w,
        h: h,
        i: `${widgetType}-${Date.now()}`,
        title: title,
        component: component,
        minW: minW,
        minH: minH,
        maxW: maxW,
        maxH: maxH,
        props: savedConfig.props || {}
      };
    }
    
    // If no saved configuration, create a default one
    let newWidget = null;

    switch (widgetType) {
      case 'bingo':
        newWidget = {
          x: 0,
          y: maxY,
          w: 5,
          h: 9,
          i: "bingo", // Use consistent ID for bingo widget
          title: "Bingo Grid",
          workflowNumber: 2,  // Add workflow number for bingo grid
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
          i: "risk", // Use consistent ID for risk-reward widget
          title: "Score: Risk/Reward",
          workflowNumber: 3,  // Add workflow number for risk-reward
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
          i: "trade-details", // Use consistent ID for trade-details widget
          title: "Trade Details",
          workflowNumber: 4,  // Add workflow number for trade-details
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
          i: "trade-idea", // Use consistent ID for trade-idea widget
          title: "Trade's Idea",
          workflowNumber: 5,  // Add workflow number for trade-idea
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
