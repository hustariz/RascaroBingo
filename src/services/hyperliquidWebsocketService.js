/**
 * Hyperliquid WebSocket Service
 * 
 * This service manages WebSocket connections to the Hyperliquid API
 * through our backend proxy for real-time market data.
 */

import axios from 'axios';
import { API_URL } from '@/config';

class HyperliquidWebsocketService {
  constructor() {
    this.subscriptions = new Map();
    this.listeners = new Map();
    this.pollingIntervals = new Map();
  }

  /**
   * Subscribe to a specific data feed
   * 
   * @param {string} type - Subscription type (ticker, orderbook, trades, user)
   * @param {string} coin - Coin symbol (e.g., 'BTC')
   * @param {Function} callback - Callback function for data updates
   * @returns {string} Subscription ID
   */
  async subscribe(type, coin, callback) {
    try {
      // Create a unique subscription ID
      const subscriptionId = `${type}_${coin}_${Date.now()}`;
      
      // Register the callback
      this.listeners.set(subscriptionId, callback);
      
      // Make API request to subscribe
      const response = await axios.post(`${API_URL}/hyperliquid-ws/subscribe`, {
        type,
        coin
      });
      
      if (response.data.success) {
        // Store the subscription details
        this.subscriptions.set(subscriptionId, {
          type,
          coin,
          subscription: response.data.subscription
        });
        
        // Set up polling for this subscription
        this.setupPolling(subscriptionId, type, coin);
        
        return subscriptionId;
      } else {
        console.error('Failed to subscribe:', response.data.message);
        return null;
      }
    } catch (error) {
      console.error('Error subscribing to WebSocket feed:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from a data feed
   * 
   * @param {string} subscriptionId - Subscription ID to unsubscribe
   * @returns {boolean} Success status
   */
  async unsubscribe(subscriptionId) {
    try {
      // Check if subscription exists
      if (!this.subscriptions.has(subscriptionId)) {
        console.warn(`Subscription ${subscriptionId} not found`);
        return false;
      }
      
      const subscription = this.subscriptions.get(subscriptionId);
      
      // Make API request to unsubscribe
      await axios.post(`${API_URL}/hyperliquid-ws/unsubscribe`, {
        subscription: subscription.subscription
      });
      
      // Clean up polling interval
      this.clearPolling(subscriptionId);
      
      // Remove subscription and listener
      this.subscriptions.delete(subscriptionId);
      this.listeners.delete(subscriptionId);
      
      return true;
    } catch (error) {
      console.error('Error unsubscribing from WebSocket feed:', error);
      return false;
    }
  }

  /**
   * Set up polling for a subscription
   * 
   * @param {string} subscriptionId - Subscription ID
   * @param {string} type - Subscription type
   * @param {string} coin - Coin symbol
   */
  setupPolling(subscriptionId, type, coin) {
    // Clear any existing polling
    this.clearPolling(subscriptionId);
    
    // Determine polling endpoint and interval based on type
    let endpoint = '';
    let interval = 5000; // Default 5 seconds
    
    switch (type) {
      case 'ticker':
        endpoint = `${API_URL}/hyperliquid/markets?refresh=true`;
        interval = 5000; // 5 seconds
        break;
      case 'orderbook':
        endpoint = `${API_URL}/hyperliquid/markets?refresh=true`;
        interval = 3000; // 3 seconds
        break;
      case 'trades':
        endpoint = `${API_URL}/hyperliquid/markets?refresh=true`;
        interval = 2000; // 2 seconds
        break;
      case 'user':
        endpoint = `${API_URL}/hyperliquid/positions?refresh=true`;
        interval = 5000; // 5 seconds
        break;
      default:
        console.warn(`Unknown subscription type: ${type}`);
        return;
    }
    
    // Set up polling interval
    const pollingId = setInterval(async () => {
      try {
        const response = await axios.get(endpoint);
        
        // Process data based on subscription type
        let data = response.data;
        
        // Filter data if needed (e.g., for a specific coin)
        if (coin && type === 'ticker') {
          // Find the specific coin data in the response
          data = response.data.find(item => item.coin === coin) || response.data;
        }
        
        // Call the listener with the data
        const listener = this.listeners.get(subscriptionId);
        if (listener) {
          listener(data);
        }
      } catch (error) {
        console.error(`Error polling for ${type} data:`, error);
      }
    }, interval);
    
    // Store the interval ID
    this.pollingIntervals.set(subscriptionId, pollingId);
  }

  /**
   * Clear polling for a subscription
   * 
   * @param {string} subscriptionId - Subscription ID
   */
  clearPolling(subscriptionId) {
    if (this.pollingIntervals.has(subscriptionId)) {
      clearInterval(this.pollingIntervals.get(subscriptionId));
      this.pollingIntervals.delete(subscriptionId);
    }
  }

  /**
   * Check WebSocket connection status
   * 
   * @returns {Promise<boolean>} Connection status
   */
  async checkStatus() {
    try {
      const response = await axios.get(`${API_URL}/hyperliquid-ws/status`);
      return response.data.connected;
    } catch (error) {
      console.error('Error checking WebSocket status:', error);
      return false;
    }
  }

  /**
   * Reconnect WebSocket
   * 
   * @returns {Promise<boolean>} Success status
   */
  async reconnect() {
    try {
      const response = await axios.post(`${API_URL}/hyperliquid-ws/reconnect`);
      return response.data.success;
    } catch (error) {
      console.error('Error reconnecting WebSocket:', error);
      return false;
    }
  }
}

// Create a singleton instance
const hyperliquidWebsocketService = new HyperliquidWebsocketService();

export default hyperliquidWebsocketService;
