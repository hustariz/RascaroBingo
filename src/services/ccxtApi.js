/**
 * Hyperliquid Exchange API Service (CCXT Implementation)
 * 
 * This service handles all interactions with Hyperliquid exchange through our backend
 * which uses CCXT for a unified trading API experience
 */

import axios from 'axios';
import authService from './authService';

const API_BASE_URL = '/api/ccxt';

// Helper function to handle API responses
const handleResponse = (response) => {
  if (response.data) {
    return response.data;
  }
  return { success: false, error: 'Invalid response format' };
};

// Helper function to handle API errors
const handleError = (error) => {
  console.error('Hyperliquid API Error:', error);
  
  if (error.response && error.response.data) {
    return { success: false, error: error.response.data.error || 'API request failed' };
  }
  
  return { success: false, error: error.message || 'Unknown error occurred' };
};

const exchangeApi = {
  /**
   * Get account information from Hyperliquid
   * @returns {Promise} Account information
   */
  async getAccountInfo() {
    try {
      const response = await axios.get(`${API_BASE_URL}/account`, authService.getAuthHeaders());
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Get positions from Hyperliquid
   * @returns {Promise} Positions data
   */
  async getPositions() {
    try {
      console.log('Calling API endpoint for positions...');
      const response = await axios.get(`${API_BASE_URL}/positions`, authService.getAuthHeaders());
      console.log('Raw positions API response:', response.data);
      
      // Process the response to ensure we have the correct structure
      let processedResponse = handleResponse(response);
      
      // If we have a successful response but no positions data in the expected format,
      // check if there are positions in a different format
      if (processedResponse.success && 
          (!processedResponse.data || 
           (Array.isArray(processedResponse.data) && processedResponse.data.length === 0))) {
        
        // Check for positions in different response structures
        if (response.data && response.data.positions) {
          processedResponse.data = response.data.positions;
        } else if (response.data && response.data.data && response.data.data.positions) {
          processedResponse.data = response.data.data.positions;
        }
      }
      
      return processedResponse;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Get open orders from Hyperliquid
   * @returns {Promise} Open orders data
   */
  async getOpenOrders() {
    try {
      const response = await axios.get(`${API_BASE_URL}/orders`, authService.getAuthHeaders());
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Place an order on Hyperliquid
   * @param {Object} orderData Order details
   * @param {String} orderData.symbol Symbol to trade (e.g., "BTC-USDT")
   * @param {String} orderData.side 'buy' or 'sell'
   * @param {Number} orderData.size Order size
   * @param {Number} orderData.price Price (for limit orders)
   * @param {String} orderData.orderType 'limit' or 'market'
   * @param {Boolean} orderData.reduceOnly Whether this is a reduce-only order
   * @param {Number} orderData.leverage Leverage to use (e.g., 10 for 10x)
   * @returns {Promise} Order result
   */
  async placeOrder(orderData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/order`, orderData, authService.getAuthHeaders());
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Cancel an order on Hyperliquid
   * @param {String} orderId Order ID to cancel
   * @param {String|Number} assetId Asset ID of the order (numeric for Hyperliquid)
   * @returns {Promise} Cancel order result
   */
  async cancelOrder(orderId, assetId) {
    try {
      console.log(`API: Cancelling order ${orderId} with asset ID ${assetId}`);
      const response = await axios.delete(`${API_BASE_URL}/order/${orderId}?symbol=${assetId}`, authService.getAuthHeaders());
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Set leverage for a symbol on Hyperliquid
   * @param {Number} leverage Leverage value (e.g., 10 for 10x)
   * @param {String} symbol Symbol to set leverage for
   * @returns {Promise} Leverage setting result
   */
  async setLeverage(leverage, symbol) {
    try {
      const response = await axios.post(`${API_BASE_URL}/leverage`, { leverage, symbol }, authService.getAuthHeaders());
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Get order book from Hyperliquid
   * @param {String} symbol Symbol to get order book for
   * @param {Number} limit Number of orders to return (default: 20)
   * @returns {Promise} Order book data
   */
  async getOrderBook(symbol, limit = 20) {
    try {
      const response = await axios.get(`${API_BASE_URL}/orderbook/${symbol}?limit=${limit}`, authService.getAuthHeaders());
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Get ticker from Hyperliquid
   * @param {String} symbol Symbol to get ticker for
   * @returns {Promise} Ticker data
   */
  async getTicker(symbol) {
    try {
      const response = await axios.get(`${API_BASE_URL}/ticker/${symbol}`, authService.getAuthHeaders());
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Get current market price for a symbol
   * @param {String} symbol Symbol to get price for (e.g., "XRP" or "XRP/USDC:USDC")
   * @returns {Promise} Market price data
   */
  async getMarketPrice(symbol) {
    try {
      // Handle different symbol formats
      let formattedSymbol = symbol;
      
      // If it's a complex symbol like "XRP/USDC:USDC", extract just the base symbol
      if (symbol.includes('/') || symbol.includes(':')) {
        // Extract the base symbol (e.g., "XRP" from "XRP/USDC:USDC")
        formattedSymbol = symbol.split('/')[0];
      }
      
      // Format the symbol for the API endpoint
      formattedSymbol = formattedSymbol.includes('-') ? formattedSymbol : `${formattedSymbol}-USD`;
      
      console.log(`Fetching market price for formatted symbol: ${formattedSymbol}`);
      const response = await axios.get(`${API_BASE_URL}/price/${formattedSymbol}`, authService.getAuthHeaders());
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Get all tickers from Hyperliquid
   * @returns {Promise} All tickers data
   */
  async getAllTickers() {
    try {
      const response = await axios.get(`${API_BASE_URL}/tickers`, authService.getAuthHeaders());
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Get markets from Hyperliquid
   * @returns {Promise} Markets data
   */
  async getMarkets() {
    try {
      const response = await axios.get(`${API_BASE_URL}/markets`, authService.getAuthHeaders());
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Get OHLCV (Candlestick) data from Hyperliquid
   * @param {String} symbol Symbol to get OHLCV data for
   * @param {String} timeframe Timeframe (default: '1h')
   * @param {Number} limit Number of candles to return (default: 100)
   * @returns {Promise} OHLCV data
   */
  async getOHLCV(symbol, timeframe = '1h', limit = 100) {
    try {
      const response = await axios.get(`${API_BASE_URL}/ohlcv/${symbol}?timeframe=${timeframe}&limit=${limit}`, authService.getAuthHeaders());
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Get recent trades from Hyperliquid
   * @param {String} symbol Symbol to get recent trades for
   * @param {Number} limit Number of trades to return (default: 50)
   * @returns {Promise} Recent trades data
   */
  async getTrades(symbol, limit = 50) {
    try {
      const response = await axios.get(`${API_BASE_URL}/trades/${symbol}?limit=${limit}`, authService.getAuthHeaders());
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Get trade history from Hyperliquid
   * @param {Object} params Optional parameters (symbol, limit, since, etc.)
   * @returns {Promise} Trade history data
   */
  async getTradeHistory(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add optional parameters to query string
      if (params.symbol) queryParams.append('symbol', params.symbol);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.since) queryParams.append('since', params.since);
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await axios.get(`${API_BASE_URL}/myTrades${queryString}`, authService.getAuthHeaders());
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Get order history from Hyperliquid
   * @param {Object} params Optional parameters (symbol, limit, since, etc.)
   * @returns {Promise} Order history data
   */
  async getOrderHistory(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add optional parameters to query string
      if (params.symbol) queryParams.append('symbol', params.symbol);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.since) queryParams.append('since', params.since);
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await axios.get(`${API_BASE_URL}/orders/history${queryString}`, authService.getAuthHeaders());
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }
};

export default exchangeApi;
