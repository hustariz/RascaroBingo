/**
 * LayoutStorageManager.js
 * 
 * A utility class to handle layout storage and persistence using localStorage.
 * This helps separate the storage logic from the main component.
 */

export default class LayoutStorageManager {
  /**
   * Storage key for active widgets in localStorage
   */
  static ACTIVE_WIDGETS_KEY = 'activeWidgets';

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
    
    return activeWidgets;
  }
}
