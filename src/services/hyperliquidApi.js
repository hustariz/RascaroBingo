/**
 * Hyperliquid API Service
 * 
 * This service handles all interactions with the Hyperliquid API through our backend
 */

import axios from 'axios';

const API_BASE_URL = '/api/hyperliquid';

const hyperliquidApi = {
  /**
   * Test connection to the Hyperliquid API
   * @returns {Promise} Connection test result
   */
  testConnection: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/connection-test`);
      return response.data;
    } catch (error) {
      console.error('Error testing connection:', error);
      throw error;
    }
  },

  /**
   * Get account information
   * @param {boolean} refresh - Whether to bypass cache and refresh data
   * @returns {Promise} Account information
   */
  getAccountInfo: async (refresh = false) => {
    try {
      const url = refresh ? `${API_BASE_URL}/account?refresh=true` : `${API_BASE_URL}/account`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching account info:', error);
      throw error;
    }
  },

  /**
   * Get market data
   * @returns {Promise} Market data
   */
  getMarkets: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/markets`);
      return response.data;
    } catch (error) {
      console.error('Error fetching market data:', error);
      throw error;
    }
  },

  /**
   * Get positions
   * @param {boolean} refresh - Whether to bypass cache and refresh data
   * @returns {Promise} Positions data
   */
  getPositions: async (refresh = false) => {
    try {
      const url = refresh ? `${API_BASE_URL}/positions?refresh=true` : `${API_BASE_URL}/positions`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching positions:', error);
      throw error;
    }
  },

  /**
   * Place an order
   * @param {Object} orderData Order details
   * @returns {Promise} Order result
   */
  placeOrder: async (orderData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/order`, orderData);
      return response.data;
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  },

  /**
   * Get open orders
   * @param {boolean} refresh - Whether to bypass cache and refresh data
   * @returns {Promise} Open orders data
   */
  getOpenOrders: async (refresh = false) => {
    try {
      const url = refresh ? `${API_BASE_URL}/open-orders?refresh=true` : `${API_BASE_URL}/open-orders`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching open orders:', error);
      throw error;
    }
  },

  /**
   * Cancel an order
   * @param {String} orderId Order ID to cancel
   * @param {Number} assetId Asset ID (default: 0 for BTC)
   * @returns {Promise} Cancel order result
   */
  cancelOrder: async (orderId, assetId = 0) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/cancel-order`, { orderId, assetId });
      return response.data;
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  },

  /**
   * Cancel all orders
   * @returns {Promise} Cancel all orders result
   */
  cancelAllOrders: async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/cancel-all-orders`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling all orders:', error);
      throw error;
    }
  },

  /**
   * Check environment variables
   * @returns {Promise} Environment variables status
   */
  checkEnvironmentVariables: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/env-check`);
      return response.data;
    } catch (error) {
      console.error('Error checking environment variables:', error);
      throw error;
    }
  }
};

export default hyperliquidApi;
