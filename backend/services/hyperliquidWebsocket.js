/**
 * Hyperliquid WebSocket Service
 * 
 * This service manages WebSocket connections to the Hyperliquid API
 * for real-time market data and account updates.
 */

const WebSocket = require('ws');
const EventEmitter = require('events');

// Hyperliquid WebSocket URL
const HYPERLIQUID_WS_URL = 'wss://api.hyperliquid.xyz/ws';

class HyperliquidWebsocketService extends EventEmitter {
  constructor() {
    super();
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second delay
    this.subscriptions = new Set();
    this.pingInterval = null;
    this.lastPongTime = Date.now();
  }

  /**
   * Connect to the Hyperliquid WebSocket API
   */
  connect() {
    if (this.ws) {
      console.log('WebSocket connection already exists');
      return;
    }

    console.log('Connecting to Hyperliquid WebSocket...');
    
    this.ws = new WebSocket(HYPERLIQUID_WS_URL);

    this.ws.on('open', () => {
      console.log('Connected to Hyperliquid WebSocket');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.emit('connected');
      
      // Resubscribe to all active subscriptions
      this.resubscribe();
      
      // Set up ping interval to keep connection alive
      this.setupPingPong();
    });

    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        
        // Handle different message types
        if (message.channel) {
          // Handle subscription data
          this.emit('message', message);
          this.emit(message.channel, message);
        } else if (message.type === 'pong') {
          // Handle pong response
          this.lastPongTime = Date.now();
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    this.ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });

    this.ws.on('close', (code, reason) => {
      console.log(`WebSocket closed: ${code} - ${reason}`);
      this.isConnected = false;
      this.clearPingInterval();
      this.emit('disconnected', { code, reason });
      
      // Attempt to reconnect
      this.attemptReconnect();
    });
  }

  /**
   * Set up ping-pong to keep the connection alive
   */
  setupPingPong() {
    this.clearPingInterval();
    
    this.pingInterval = setInterval(() => {
      if (this.ws && this.isConnected) {
        // Check if we've received a pong recently
        const now = Date.now();
        if (now - this.lastPongTime > 30000) {
          // No pong received for 30 seconds, reconnect
          console.warn('No pong received for 30 seconds, reconnecting...');
          this.reconnect();
          return;
        }
        
        // Send ping
        try {
          this.ws.send(JSON.stringify({ type: 'ping' }));
        } catch (error) {
          console.error('Error sending ping:', error);
          this.reconnect();
        }
      }
    }, 15000); // Send ping every 15 seconds
  }

  /**
   * Clear the ping interval
   */
  clearPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached, giving up');
      this.emit('reconnect_failed');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(30000, this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1));
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.reconnect();
    }, delay);
  }

  /**
   * Force reconnection
   */
  reconnect() {
    this.disconnect();
    this.connect();
  }

  /**
   * Disconnect from the WebSocket
   */
  disconnect() {
    this.clearPingInterval();
    
    if (this.ws) {
      this.ws.terminate();
      this.ws = null;
    }
    
    this.isConnected = false;
  }

  /**
   * Resubscribe to all active subscriptions
   */
  resubscribe() {
    if (!this.isConnected || !this.ws) return;
    
    for (const subscription of this.subscriptions) {
      try {
        this.ws.send(JSON.stringify(subscription));
      } catch (error) {
        console.error('Error resubscribing:', error);
      }
    }
  }

  /**
   * Subscribe to a channel
   * 
   * @param {Object} subscription - Subscription request
   */
  subscribe(subscription) {
    if (!subscription) return;
    
    // Add to subscriptions set
    this.subscriptions.add(subscription);
    
    // Send subscription request if connected
    if (this.isConnected && this.ws) {
      try {
        this.ws.send(JSON.stringify(subscription));
      } catch (error) {
        console.error('Error subscribing:', error);
      }
    }
  }

  /**
   * Unsubscribe from a channel
   * 
   * @param {Object} subscription - Subscription to remove
   */
  unsubscribe(subscription) {
    if (!subscription) return;
    
    // Remove from subscriptions set
    this.subscriptions.delete(subscription);
    
    // Send unsubscribe request if connected
    if (this.isConnected && this.ws) {
      try {
        const unsubscribeRequest = {
          ...subscription,
          unsubscribe: true
        };
        this.ws.send(JSON.stringify(unsubscribeRequest));
      } catch (error) {
        console.error('Error unsubscribing:', error);
      }
    }
  }

  /**
   * Subscribe to ticker updates for a specific coin
   * 
   * @param {string} coin - Coin symbol (e.g., 'BTC')
   */
  subscribeTicker(coin) {
    const subscription = {
      method: "subscribe",
      subscription: {
        type: "ticker",
        coin
      }
    };
    
    this.subscribe(subscription);
    return subscription;
  }

  /**
   * Subscribe to orderbook updates for a specific coin
   * 
   * @param {string} coin - Coin symbol (e.g., 'BTC')
   */
  subscribeOrderbook(coin) {
    const subscription = {
      method: "subscribe",
      subscription: {
        type: "l2Book",
        coin
      }
    };
    
    this.subscribe(subscription);
    return subscription;
  }

  /**
   * Subscribe to trade updates for a specific coin
   * 
   * @param {string} coin - Coin symbol (e.g., 'BTC')
   */
  subscribeTrades(coin) {
    const subscription = {
      method: "subscribe",
      subscription: {
        type: "trades",
        coin
      }
    };
    
    this.subscribe(subscription);
    return subscription;
  }

  /**
   * Subscribe to user updates (requires authentication)
   * 
   * @param {string} walletAddress - User's wallet address
   */
  subscribeUserUpdates(walletAddress) {
    if (!walletAddress) {
      console.error('Wallet address is required for user updates subscription');
      return null;
    }
    
    const subscription = {
      method: "subscribe",
      subscription: {
        type: "user",
        user: walletAddress
      }
    };
    
    this.subscribe(subscription);
    return subscription;
  }
}

// Create a singleton instance
const hyperliquidWebsocket = new HyperliquidWebsocketService();

module.exports = hyperliquidWebsocket;
