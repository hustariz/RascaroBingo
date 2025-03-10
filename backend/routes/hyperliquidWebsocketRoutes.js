/**
 * Hyperliquid WebSocket Routes
 * 
 * This file contains routes for managing WebSocket connections to the Hyperliquid API
 */

const express = require('express');
const router = express.Router();
const hyperliquidWebsocket = require('../services/hyperliquidWebsocket');

// Environment variables
const HYPERLIQUID_WALLET_ADDRESS = process.env.HYPERLIQUID_WALLET_ADDRESS;

// Initialize WebSocket connection
// Comment out the auto-connect to prevent connection attempts since we're using mock data
// hyperliquidWebsocket.connect();

// Listen for WebSocket events
hyperliquidWebsocket.on('connected', () => {
  console.log('Hyperliquid WebSocket connected');
});

hyperliquidWebsocket.on('disconnected', (data) => {
  console.log('Hyperliquid WebSocket disconnected:', data);
});

hyperliquidWebsocket.on('error', (error) => {
  console.error('Hyperliquid WebSocket error:', error);
});

// POST start a subscription
router.post('/subscribe', (req, res) => {
  const { type, coin } = req.body;
  
  if (!type) {
    return res.status(400).json({
      success: false,
      message: 'Subscription type is required',
      code: 'MISSING_PARAMETERS'
    });
  }
  
  let subscription = null;
  
  switch (type.toLowerCase()) {
    case 'ticker':
      if (!coin) {
        return res.status(400).json({
          success: false,
          message: 'Coin is required for ticker subscription',
          code: 'MISSING_PARAMETERS'
        });
      }
      subscription = hyperliquidWebsocket.subscribeTicker(coin);
      break;
      
    case 'orderbook':
      if (!coin) {
        return res.status(400).json({
          success: false,
          message: 'Coin is required for orderbook subscription',
          code: 'MISSING_PARAMETERS'
        });
      }
      subscription = hyperliquidWebsocket.subscribeOrderbook(coin);
      break;
      
    case 'trades':
      if (!coin) {
        return res.status(400).json({
          success: false,
          message: 'Coin is required for trades subscription',
          code: 'MISSING_PARAMETERS'
        });
      }
      subscription = hyperliquidWebsocket.subscribeTrades(coin);
      break;
      
    case 'user':
      if (!HYPERLIQUID_WALLET_ADDRESS) {
        return res.status(400).json({
          success: false,
          message: 'Wallet address is not configured',
          code: 'CONFIGURATION_ERROR'
        });
      }
      subscription = hyperliquidWebsocket.subscribeUserUpdates(HYPERLIQUID_WALLET_ADDRESS);
      break;
      
    default:
      return res.status(400).json({
        success: false,
        message: `Unknown subscription type: ${type}`,
        code: 'INVALID_PARAMETERS'
      });
  }
  
  if (subscription) {
    res.json({
      success: true,
      message: `Successfully subscribed to ${type} ${coin ? `for ${coin}` : ''}`,
      subscription
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription',
      code: 'SUBSCRIPTION_ERROR'
    });
  }
});

// POST unsubscribe from a feed
router.post('/unsubscribe', (req, res) => {
  const { subscription } = req.body;
  
  if (!subscription) {
    return res.status(400).json({
      success: false,
      message: 'Subscription object is required',
      code: 'MISSING_PARAMETERS'
    });
  }
  
  hyperliquidWebsocket.unsubscribe(subscription);
  
  res.json({
    success: true,
    message: 'Successfully unsubscribed'
  });
});

// GET check WebSocket connection status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    connected: hyperliquidWebsocket.isConnected,
    reconnectAttempts: hyperliquidWebsocket.reconnectAttempts
  });
});

// POST reconnect WebSocket
router.post('/reconnect', (req, res) => {
  hyperliquidWebsocket.reconnect();
  
  res.json({
    success: true,
    message: 'Reconnection initiated'
  });
});

module.exports = router;
