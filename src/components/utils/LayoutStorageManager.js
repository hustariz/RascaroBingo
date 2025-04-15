/**
 * LayoutStorageManager.js
 * 
 * A utility class to handle layout storage and persistence using localStorage.
 * This helps separate the storage logic from the main component.
 */

export default class LayoutStorageManager {
  /**
   * Storage keys for localStorage
   */
  static ACTIVE_WIDGETS_KEY = 'activeWidgets';
  static WIDGET_CONFIGS_KEY = 'widgetConfigurations';
  static COMPLETE_LAYOUT_KEY = 'completeLayout';

  /**
   * Get active widgets from localStorage
   * 
   * @returns {Array} Array of active widget types
   */
  static getActiveWidgets() {
    const storedWidgets = localStorage.getItem(this.ACTIVE_WIDGETS_KEY);
    return storedWidgets ? JSON.parse(storedWidgets) : [];
  }

  /**
   * Save active widgets to localStorage
   * 
   * @param {Array} activeWidgets - Array of active widget types
   */
  static saveActiveWidgets(activeWidgets) {
    localStorage.setItem(this.ACTIVE_WIDGETS_KEY, JSON.stringify(activeWidgets));
    console.log('Active widgets saved to localStorage:', activeWidgets);
  }

  /**
   * Update active widgets in localStorage (add or remove)
   * 
   * @param {String} widgetType - Type of widget to add or remove
   * @param {String} action - Action to perform ('add' or 'remove')
   * @returns {Array} Updated array of active widgets
   */
  static updateActiveWidgets(widgetType, action) {
    // Get current active widgets from localStorage
    let activeWidgets = this.getActiveWidgets();
    
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
    this.saveActiveWidgets(activeWidgets);
    
    return activeWidgets;
  }

  /**
   * Sync active widgets with the current layout
   * 
   * @param {Array} layout - Current grid layout
   * @returns {Array} Updated array of active widgets
   */
  static syncActiveWidgetsWithLayout(layout) {
    const activeWidgets = [];
    
    console.log('Syncing active widgets with layout:', layout);
    
    // Check for each widget type in the layout
    if (layout.some(item => item.i.startsWith('bingo'))) {
      activeWidgets.push('bingo');
    }
    
    // Special case for risk-reward widget - check for both formats of ID
    const hasRiskWidget = layout.some(item => 
      item.i.startsWith('risk-reward-') || // New format
      item.i.startsWith('risk-') || // Old format
      item.i === 'risk' // Mobile format
    );
    
    if (hasRiskWidget) {
      activeWidgets.push('risk-reward');
    }
    
    if (layout.some(item => item.i.startsWith('trade-details'))) {
      activeWidgets.push('trade-details');
    }
    
    if (layout.some(item => item.i.startsWith('trade-idea'))) {
      activeWidgets.push('trade-idea');
    }
    
    console.log('Active widgets after sync:', activeWidgets);
    
    // Save to localStorage
    this.saveActiveWidgets(activeWidgets);
    
    // Also save the current widget configurations
    this.saveWidgetConfigurations(layout);
    
    return activeWidgets;
  }

  /**
   * Get saved widget configurations from localStorage
   * 
   * @returns {Object} Object with widget types as keys and their configurations as values
   */
  static getWidgetConfigurations() {
    const storedConfigs = localStorage.getItem(this.WIDGET_CONFIGS_KEY);
    return storedConfigs ? JSON.parse(storedConfigs) : {};
  }

  /**
   * Save widget configurations to localStorage
   * 
   * @param {Array} layout - Current grid layout
   */
  static saveWidgetConfigurations(layout) {
    const widgetConfigs = {};
    
    console.log('Saving widget configurations from layout:', layout);
    
    // Process each widget in the layout
    layout.forEach(widget => {
      // Extract the widget type from the ID
      let widgetType = null;
      
      if (widget.i.startsWith('bingo')) {
        widgetType = 'bingo';
      } else if (widget.i.startsWith('risk-reward') || widget.i.startsWith('risk-') || widget.i === 'risk') {
        widgetType = 'risk-reward';
      } else if (widget.i.startsWith('trade-details')) {
        widgetType = 'trade-details';
      } else if (widget.i.startsWith('trade-idea')) {
        widgetType = 'trade-idea';
      }
      
      if (widgetType) {
        // Save the configuration for this widget type
        // We're saving the most recent configuration for each widget type
        widgetConfigs[widgetType] = {
          x: parseInt(widget.x),
          y: parseInt(widget.y),
          w: parseInt(widget.w),
          h: parseInt(widget.h),
          i: widget.i,
          props: widget.props || {}
        };
        
        console.log(`Saved configuration for ${widgetType}:`, widgetConfigs[widgetType]);
      }
    });
    
    console.log('All widget configurations to save:', widgetConfigs);
    localStorage.setItem(this.WIDGET_CONFIGS_KEY, JSON.stringify(widgetConfigs));
  }

  /**
   * Get the saved configuration for a specific widget type
   * 
   * @param {String} widgetType - Type of widget to get configuration for
   * @returns {Object|null} Widget configuration or null if not found
   */
  static getWidgetConfiguration(widgetType) {
    const configs = this.getWidgetConfigurations();
    const config = configs[widgetType] || null;
    
    console.log(`Retrieved configuration for ${widgetType}:`, config);
    
    return config;
  }

  /**
   * Save the complete layout to localStorage
   * 
   * @param {Array} layout - Current grid layout
   */
  static saveCompleteLayout(layout) {
    // Create a deep copy of the layout without the component references
    // Components can't be serialized to JSON
    const layoutToSave = layout.map(widget => {
      // Extract the widget type from the ID
      let widgetType = '';
      
      if (widget.i.startsWith('bingo')) {
        widgetType = 'bingo';
      } else if (widget.i.startsWith('risk-reward') || widget.i.startsWith('risk-') || widget.i === 'risk') {
        widgetType = 'risk-reward';
      } else if (widget.i.startsWith('trade-details')) {
        widgetType = 'trade-details';
      } else if (widget.i.startsWith('trade-idea')) {
        widgetType = 'trade-idea';
      }
      
      // Save all properties except the component reference
      const widgetCopy = {};
      
      // Copy all properties from the widget
      for (const key in widget) {
        // Skip the component property as it can't be serialized
        if (key !== 'component') {
          widgetCopy[key] = widget[key];
        }
      }
      
      // Ensure we have the correct type information
      widgetCopy.widgetType = widgetType;
      
      // Ensure numeric properties are stored as numbers
      widgetCopy.x = parseInt(widget.x);
      widgetCopy.y = parseInt(widget.y);
      widgetCopy.w = parseInt(widget.w);
      widgetCopy.h = parseInt(widget.h);
      
      return widgetCopy;
    });
    
    console.log('Saving complete layout:', layoutToSave);
    localStorage.setItem(this.COMPLETE_LAYOUT_KEY, JSON.stringify(layoutToSave));
  }

  /**
   * Get the complete layout from localStorage
   * 
   * @returns {Array} Complete layout array or empty array if not found
   */
  static getCompleteLayout() {
    const storedLayout = localStorage.getItem(this.COMPLETE_LAYOUT_KEY);
    return storedLayout ? JSON.parse(storedLayout) : [];
  }

  /**
   * Get the saved layout for a specific widget type
   * 
   * @param {String} widgetType - Type of widget to get layout for
   * @returns {Object|null} Widget layout or null if not found
   */
  static getWidgetLayout(widgetType) {
    const completeLayout = this.getCompleteLayout();
    
    // Find the widget in the saved layout
    const widget = completeLayout.find(item => {
      if (widgetType === 'risk-reward') {
        return item.i.startsWith('risk-reward-') || item.i.startsWith('risk-') || item.i === 'risk';
      }
      return item.i.startsWith(widgetType);
    });
    
    // If we found a widget, make sure we preserve its original ID
    if (widget) {
      console.log(`Retrieved layout for ${widgetType} with ID ${widget.i}:`, widget);
    } else {
      console.log(`No saved layout found for ${widgetType}`);
    }
    
    return widget || null;
  }
}
