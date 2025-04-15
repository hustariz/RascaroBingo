/**
 * GridDimensionsManager.js
 * 
 * A utility class to handle grid dimension calculations for responsive layouts.
 * This helps separate the dimension calculation logic from the main component.
 */

export default class GridDimensionsManager {
  /**
   * Calculate grid dimensions based on window size and layout
   * 
   * @param {Object} options - Configuration options
   * @param {Boolean} options.isSidebarCollapsed - Whether the sidebar is collapsed
   * @param {Array} options.layout - The current grid layout
   * @param {Number} options.rowHeight - The height of each row in the grid
   * @returns {Object} The calculated dimensions { gridWidth, gridHeight }
   */
  static calculateDimensions({ isSidebarCollapsed, layout, rowHeight }) {
    const sidebarWidth = isSidebarCollapsed ? 60 : 300;
    const horizontalPadding = 40;
    const verticalPadding = 150;

    // Calculate width based on window and sidebar
    let gridWidth = window.innerWidth - sidebarWidth - horizontalPadding;
    
    // Calculate the required height based on widget positions
    let maxBottom = 0;
    if (Array.isArray(layout)) {
      layout.forEach(item => {
        const bottom = (item.y + item.h) * rowHeight;
        if (bottom > maxBottom) {
          maxBottom = bottom;
        }
      });
    }
    
    // Set a minimum height based on viewport
    const viewportHeight = window.innerHeight;
    const minHeight = viewportHeight - verticalPadding;
    
    // Use the larger of calculated height or minimum height
    let gridHeight = Math.max(maxBottom + 100, minHeight);
    
    // Ensure minimum dimensions
    gridWidth = Math.max(gridWidth, 300);
    gridHeight = Math.max(gridHeight, 300);
    
    return { gridWidth, gridHeight };
  }

  /**
   * Update DOM elements with the calculated dimensions
   * 
   * @param {Object} dimensions - The calculated dimensions { gridWidth, gridHeight }
   */
  static applyDimensions(dimensions) {
    // Update the dashboard layout height
    const dashboardLayout = document.querySelector('.dashboard-layout');
    if (dashboardLayout) {
      dashboardLayout.style.minHeight = `${dimensions.gridHeight}px`;
      
      // Ensure the main content can scroll if needed
      const mainContent = document.querySelector('.main-content');
      if (mainContent) {
        mainContent.style.overflow = 'auto';
      }
    }
  }
}
