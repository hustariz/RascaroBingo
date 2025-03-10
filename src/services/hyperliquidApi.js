/**
 * Hyperliquid API Service
 * 
 * This service handles all interactions with the Hyperliquid API
 */

import axios from 'axios';

const API_BASE_URL = '/api/hyperliquid';

const hyperliquidApi = {
  /**
   * Get account information
   * @returns {Promise} Account information
   */
  getAccountInfo: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/account`);
      return response.data;
    } catch (error) {
      console.error('Error fetching account information:', error);
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
  }
};

export default hyperliquidApi;
