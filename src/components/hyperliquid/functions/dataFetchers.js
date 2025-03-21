/**
 * Hyperliquid data fetching functions
 * Contains functions for fetching account data, positions, orders, etc.
 */

import exchangeApi from '@/services/ccxtApi';

/**
 * Fetch account data from Hyperliquid
 * @param {Object} callbacks Callback functions for different fetch states
 * @returns {Promise} Promise that resolves with account data
 */
export async function fetchAccountData(callbacks = {}) {
  const {
    onStart = () => {},
    onSuccess = () => {},
    onError = () => {},
    onFinally = () => {}
  } = callbacks;
  
  // Signal that fetch has started
  onStart();
  
  try {
    console.log('Fetching account data...');
    
    // Fetch account data
    const response = await exchangeApi.getAccountInfo();
    console.log('Account data response:', response);
    
    if (response.success) {
      onSuccess(response.data);
      return {
        success: true,
        data: response.data
      };
    } else {
      const error = {
        success: false,
        error: response.error || 'Failed to fetch account data'
      };
      onError(error);
      return error;
    }
  } catch (error) {
    console.error('Account data fetch error:', error);
    const errorResult = {
      success: false,
      error: error.message || 'An error occurred while fetching account data'
    };
    onError(errorResult);
    return errorResult;
  } finally {
    // Signal that fetch has completed
    onFinally();
  }
}

/**
 * Fetch positions from Hyperliquid
 * @param {Object} callbacks Callback functions for different fetch states
 * @returns {Promise} Promise that resolves with positions data
 */
export async function fetchPositions(callbacks = {}) {
  const {
    onStart = () => {},
    onSuccess = () => {},
    onError = () => {},
    onFinally = () => {}
  } = callbacks;
  
  // Signal that fetch has started
  onStart();
  
  try {
    console.log('Fetching positions...');
    
    // Fetch positions
    const response = await exchangeApi.getPositions();
    console.log('Positions response:', response);
    console.log('Full positions response structure:', JSON.stringify(response, null, 2));
    
    if (response.success) {
      // Ensure we have an array of positions, even if empty
      const positionsData = Array.isArray(response.data) ? response.data : [];
      
      // Check for positions in different response structures
      if (positionsData.length === 0) {
        // Try to find positions in different locations in the response
        if (response.data && response.data.data) {
          // Case 1: Nested data property
          const nestedData = Array.isArray(response.data.data) ? response.data.data : [];
          console.log('Found positions in nested data.data:', nestedData);
          onSuccess(nestedData);
          return {
            success: true,
            data: nestedData
          };
        } else if (response.data && response.data.positions) {
          // Case 2: Positions in a dedicated property
          const positionsInProperty = Array.isArray(response.data.positions) ? response.data.positions : [];
          console.log('Found positions in data.positions:', positionsInProperty);
          onSuccess(positionsInProperty);
          return {
            success: true,
            data: positionsInProperty
          };
        } else if (typeof response.data === 'object' && !Array.isArray(response.data)) {
          // Case 3: Response data is an object with position details
          console.log('Response data is an object, treating as a single position');
          const singlePosition = [response.data];
          onSuccess(singlePosition);
          return {
            success: true,
            data: singlePosition
          };
        }
      }
      
      console.log('Processed positions data:', positionsData);
      onSuccess(positionsData);
      return {
        success: true,
        data: positionsData
      };
    } else {
      const error = {
        success: false,
        error: response.error || 'Failed to fetch positions'
      };
      onError(error);
      return error;
    }
  } catch (error) {
    console.error('Positions fetch error:', error);
    const errorResult = {
      success: false,
      error: error.message || 'An error occurred while fetching positions'
    };
    onError(errorResult);
    return errorResult;
  } finally {
    // Signal that fetch has completed
    onFinally();
  }
}

/**
 * Fetch open orders from Hyperliquid
 * @param {Object} callbacks Callback functions for different fetch states
 * @returns {Promise} Promise that resolves with orders data
 */
export async function fetchOpenOrders(callbacks = {}) {
  const {
    onStart = () => {},
    onSuccess = () => {},
    onError = () => {},
    onFinally = () => {}
  } = callbacks;
  
  // Signal that fetch has started
  onStart();
  
  try {
    console.log('Fetching open orders...');
    
    // Fetch open orders
    const response = await exchangeApi.getOpenOrders();
    console.log('Open orders response:', response);
    
    if (response.success) {
      onSuccess(response.data);
      return {
        success: true,
        data: response.data
      };
    } else {
      const error = {
        success: false,
        error: response.error || 'Failed to fetch open orders'
      };
      onError(error);
      return error;
    }
  } catch (error) {
    console.error('Open orders fetch error:', error);
    const errorResult = {
      success: false,
      error: error.message || 'An error occurred while fetching open orders'
    };
    onError(errorResult);
    return errorResult;
  } finally {
    // Signal that fetch has completed
    onFinally();
  }
}

/**
 * Fetch market data for available symbols
 * @param {Object} callbacks Callback functions for different fetch states
 * @returns {Promise} Promise that resolves with market data
 */
export async function fetchMarkets(callbacks = {}) {
  const {
    onStart = () => {},
    onSuccess = () => {},
    onError = () => {},
    onFinally = () => {}
  } = callbacks;
  
  // Signal that fetch has started
  onStart();
  
  try {
    console.log('Fetching markets...');
    
    // Fetch markets
    const response = await exchangeApi.getMarkets();
    console.log('Markets response:', response);
    
    if (response.success) {
      // Extract available symbols
      const symbols = response.data.map(market => {
        // Extract base symbol (e.g., "BTC" from "BTC/USDT:USDT")
        if (market.symbol.includes('/')) {
          return market.symbol.split('/')[0];
        } else if (market.symbol.includes('-')) {
          return market.symbol.split('-')[0];
        }
        return market.symbol;
      });
      
      // Remove duplicates
      const uniqueSymbols = [...new Set(symbols)];
      
      onSuccess(uniqueSymbols);
      return {
        success: true,
        data: uniqueSymbols,
        rawMarkets: response.data
      };
    } else {
      const error = {
        success: false,
        error: response.error || 'Failed to fetch markets'
      };
      onError(error);
      return error;
    }
  } catch (error) {
    console.error('Markets fetch error:', error);
    const errorResult = {
      success: false,
      error: error.message || 'An error occurred while fetching markets'
    };
    onError(errorResult);
    return errorResult;
  } finally {
    // Signal that fetch has completed
    onFinally();
  }
}
