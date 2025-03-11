/**
 * Hyperliquid Exchange API Service (CCXT Implementation)
 * 
 * This service handles all interactions with Hyperliquid exchange through our backend
 * which uses CCXT for a unified trading API experience
 */

import axios from 'axios';

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
      const response = await axios.get(`${API_BASE_URL}/account`);
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
      const response = await axios.get(`${API_BASE_URL}/positions`);
      return handleResponse(response);
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
      const response = await axios.get(`${API_BASE_URL}/orders`);
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
      const response = await axios.post(`${API_BASE_URL}/order`, orderData);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Cancel an order on Hyperliquid
   * @param {String} orderId Order ID to cancel
   * @param {String} symbol Symbol of the order
   * @returns {Promise} Cancel order result
   */
  async cancelOrder(orderId, symbol) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/order/${orderId}?symbol=${symbol}`);
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
      const response = await axios.post(`${API_BASE_URL}/leverage`, { leverage, symbol });
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
      const response = await axios.get(`${API_BASE_URL}/orderbook/${symbol}?limit=${limit}`);
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
      const response = await axios.get(`${API_BASE_URL}/ticker/${symbol}`);
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
      const response = await axios.get(`${API_BASE_URL}/tickers`);
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
      const response = await axios.get(`${API_BASE_URL}/markets`);
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
      const response = await axios.get(`${API_BASE_URL}/ohlcv/${symbol}?timeframe=${timeframe}&limit=${limit}`);
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
      const response = await axios.get(`${API_BASE_URL}/trades/${symbol}?limit=${limit}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }
};

export default exchangeApi;
