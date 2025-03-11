/**
 * Exchange API Service (CCXT Implementation)
 * 
 * This service handles all interactions with cryptocurrency exchanges through our backend
 * which uses CCXT for a unified trading API experience
 */

import axios from 'axios';

const API_BASE_URL = '/api/hyperliquid';

const exchangeApi = {
  /**
   * Get account information
   * @returns {Promise} Account information
   */
  getAccountInfo: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/account`);
      return response.data;
    } catch (error) {
      console.error('Error fetching account info:', error);
      throw error;
    }
  },

  /**
   * Get positions
   * @returns {Promise} Positions data
   */
  getPositions: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/positions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching positions:', error);
      throw error;
    }
  },

  /**
   * Get open orders
   * @param {String} symbol Optional symbol to filter orders
   * @returns {Promise} Open orders data
   */
  getOpenOrders: async (symbol) => {
    try {
      const url = symbol ? `${API_BASE_URL}/open-orders/${symbol}` : `${API_BASE_URL}/open-orders`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching open orders:', error);
      throw error;
    }
  },

  /**
   * Place an order
   * @param {Object} orderData Order details
   * @param {String} orderData.symbol Symbol to trade
   * @param {String} orderData.side 'buy' or 'sell'
   * @param {Number} orderData.size Order size
   * @param {Number} orderData.price Price (for limit orders)
   * @param {String} orderData.orderType 'limit' or 'market'
   * @param {Boolean} orderData.reduceOnly Whether this is a reduce-only order
   * @returns {Promise} Order result
   */
  placeOrder: async (orderData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/place-order`, orderData);
      return response.data;
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  },

  /**
   * Cancel an order
   * @param {String} orderId Order ID to cancel
   * @param {String} symbol Symbol of the order
   * @returns {Promise} Cancel order result
   */
  cancelOrder: async (orderId, symbol) => {
    try {
      console.log(`Sending cancel request for order ID: ${orderId}, symbol: ${symbol}`);
      const response = await axios.post(`${API_BASE_URL}/cancel-order`, { orderId, symbol });
      console.log('Cancel order response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error cancelling order:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }
};

export default exchangeApi;
