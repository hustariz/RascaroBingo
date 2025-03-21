/**
 * Hyperliquid order-related functions
 * Contains functions for placing and canceling orders
 */

import exchangeApi from '@/services/ccxtApi';

/**
 * Place an order on Hyperliquid
 * @param {Object} orderData Order data
 * @param {Object} callbacks Callback functions for different order states
 * @returns {Promise} Promise that resolves when the order is placed
 */
export async function placeOrder(orderData, callbacks = {}) {
  const {
    onStart = () => {},
    onSuccess = () => {},
    onError = () => {},
    onFinally = () => {}
  } = callbacks;
  
  // Validate order data
  if (!orderData.symbol || !orderData.side || !orderData.size) {
    const error = 'Symbol, side, and size are required';
    onError({ success: false, error });
    return { success: false, error };
  }
  
  if (orderData.orderType === 'limit' && !orderData.price) {
    const error = 'Price is required for limit orders';
    onError({ success: false, error });
    return { success: false, error };
  }
  
  // Signal that order placement has started
  onStart();
  
  try {
    // Format the symbol for Hyperliquid if needed
    const formattedSymbol = orderData.symbol.includes('-') ? 
      orderData.symbol : 
      `${orderData.symbol}-USD`;
    
    console.log(`Placing order for symbol: ${formattedSymbol}`);
    
    const processedOrderData = {
      symbol: formattedSymbol,
      side: orderData.side,
      size: parseFloat(orderData.size),
      price: orderData.price ? parseFloat(orderData.price) : undefined,
      orderType: orderData.orderType,
      reduceOnly: orderData.reduceOnly
    };
    
    console.log('Order data:', processedOrderData);
    
    // Place the order
    const response = await exchangeApi.placeOrder(processedOrderData);
    console.log('Order placement response:', response);
    
    // Handle success
    if (response.success) {
      const result = {
        success: true,
        data: response.data,
        message: 'Order placed successfully'
      };
      onSuccess(result);
      return result;
    } else {
      // Handle API error
      const error = {
        success: false,
        error: response.error || 'Failed to place order'
      };
      onError(error);
      return error;
    }
  } catch (error) {
    // Handle exception
    console.error('Order placement error:', error);
    const errorResult = {
      success: false,
      error: error.message || 'Failed to place order'
    };
    onError(errorResult);
    return errorResult;
  } finally {
    // Signal that order placement has completed
    onFinally();
  }
}

/**
 * Cancel an order on Hyperliquid
 * @param {String} orderId Order ID to cancel
 * @param {String|Number} assetId Asset ID of the order
 * @param {Object} callbacks Callback functions for different cancel states
 * @returns {Promise} Promise that resolves when the order is canceled
 */
export async function cancelOrder(orderId, assetId, callbacks = {}) {
  const {
    onStart = () => {},
    onSuccess = () => {},
    onError = () => {},
    onFinally = () => {}
  } = callbacks;
  
  // Validate parameters
  if (!orderId || !assetId) {
    const error = {
      success: false,
      message: 'Order ID and asset ID are required',
      details: { orderId, assetId }
    };
    onError(error);
    return error;
  }
  
  // Signal that cancel has started
  onStart(orderId);
  
  try {
    console.log(`Cancelling order: ${orderId}, asset ID: ${assetId}`);
    
    // Make sure assetId is a number for Hyperliquid if needed
    const numericAssetId = parseInt(assetId);
    const finalAssetId = isNaN(numericAssetId) ? assetId : numericAssetId;
    
    // Cancel the order
    const response = await exchangeApi.cancelOrder(orderId, finalAssetId);
    console.log('Cancel response:', response);
    
    // Handle success
    if (response.success) {
      const result = {
        success: true,
        message: 'Order cancelled successfully',
        data: response.data
      };
      onSuccess(result);
      return result;
    } else {
      // Handle API error
      const error = {
        success: false,
        message: response.error || 'Failed to cancel order'
      };
      onError(error);
      return error;
    }
  } catch (error) {
    // Handle exception
    console.error('Cancel error:', error);
    const errorResult = {
      success: false,
      message: error.message || 'An error occurred while cancelling the order',
      error
    };
    onError(errorResult);
    return errorResult;
  } finally {
    // Signal that cancel has completed
    onFinally();
  }
}

/**
 * Fetch the current market price for a symbol
 * @param {String} symbol Symbol to fetch price for
 * @param {Object} callbacks Callback functions for different fetch states
 * @returns {Promise} Promise that resolves with the market price
 */
export async function fetchMarketPrice(symbol, callbacks = {}) {
  const {
    onStart = () => {},
    onSuccess = () => {},
    onError = () => {},
    onFinally = () => {}
  } = callbacks;
  
  if (!symbol) {
    const error = { success: false, error: 'Symbol is required' };
    onError(error);
    return error;
  }
  
  // Signal that price fetching has started
  onStart();
  
  try {
    console.log(`Fetching market price for ${symbol}...`);
    
    // Fetch the market price
    const response = await exchangeApi.getMarketPrice(symbol);
    console.log('Market price response:', response);
    
    if (response.success && response.data && response.data.price) {
      const result = {
        success: true,
        symbol: response.data.symbol,
        price: response.data.price,
        timestamp: response.data.timestamp
      };
      onSuccess(result);
      return result;
    } else if (response.success && typeof response.data === 'number') {
      // Handle case where response.data is directly the price
      const result = {
        success: true,
        symbol: symbol,
        price: response.data,
        timestamp: Date.now()
      };
      onSuccess(result);
      return result;
    } else {
      const error = {
        success: false,
        error: response.error || `Could not fetch price for ${symbol}`
      };
      onError(error);
      return error;
    }
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    const errorResult = {
      success: false,
      error: error.message || `Failed to fetch price for ${symbol}`
    };
    onError(errorResult);
    return errorResult;
  } finally {
    // Signal that price fetching has completed
    onFinally();
  }
}
