/**
 * CCXT Exchange Integration Routes
 * 
 * This file provides a clean implementation for interacting with cryptocurrency exchanges
 * using the CCXT library, which provides a unified API for multiple exchanges.
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');
const ccxt = require('ccxt');

// Create router
const router = express.Router();

// Initialize cache for API responses
const apiCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

// Cache keys
const CACHE_KEYS = {
  MARKETS: 'markets',
  TICKERS: 'tickers',
  ORDERBOOK: 'orderbook',
  TRADES: 'trades',
  OPEN_ORDERS: 'open_orders',
  POSITIONS: 'positions',
  ACCOUNT: 'account'
};

// Environment variables
const API_KEY = process.env.HYPERLIQUID_API_KEY || '';
const API_SECRET = process.env.HYPERLIQUID_API_SECRET || '';
const WALLET_ADDRESS = process.env.HYPERLIQUID_WALLET_ADDRESS || '';

// Initialize CCXT exchange instance
// This can be easily changed to support other exchanges
const exchange = new ccxt.hyperliquid({
  apiKey: API_KEY,
  secret: API_SECRET,
  password: WALLET_ADDRESS,
  enableRateLimit: true,
});

// Apply rate limiting to all routes
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later' }
});

router.use(apiLimiter);

// Helper function to handle API errors
function handleApiError(error, res) {
  console.error('API error:', error.message);
  
  if (error.response) {
    console.error('API error details:', {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data
    });
  }
  
  return res.status(500).json({
    success: false,
    error: error.response?.data?.error || error.message || 'Failed to fetch data from exchange API'
  });
}

// Get account information
router.get('/account', async (req, res) => {
  try {
    // Check cache first
    const cachedData = apiCache.get(CACHE_KEYS.ACCOUNT);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // Fetch account information from CCXT
    const balance = await exchange.fetchBalance();
    
    // Format the response
    const formattedBalance = {
      totalEquity: balance.total.USD || 0,
      availableBalance: balance.free.USD || 0,
      usedBalance: balance.used.USD || 0,
      currencies: Object.keys(balance.total)
        .filter(key => key !== 'USD' && key !== 'info')
        .map(currency => ({
          currency,
          total: balance.total[currency] || 0,
          available: balance.free[currency] || 0,
          used: balance.used[currency] || 0
        }))
    };
    
    const response = {
      success: true,
      data: formattedBalance
    };
    
    // Cache the response (short TTL for account data)
    apiCache.set(CACHE_KEYS.ACCOUNT, response, 5); // 5 seconds TTL
    
    res.json(response);
  } catch (error) {
    handleApiError(error, res);
  }
});

// Get open positions
router.get('/positions', async (req, res) => {
  try {
    // Check cache first
    const cachedData = apiCache.get(CACHE_KEYS.POSITIONS);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // Fetch positions from CCXT
    const positions = await exchange.fetchPositions();
    
    // Format the response
    const formattedPositions = positions
      .filter(position => position.contracts > 0)
      .map(position => ({
        symbol: position.symbol.split('/')[0],
        size: position.contracts,
        notional: position.notional,
        side: position.side,
        entryPrice: position.entryPrice,
        markPrice: position.markPrice,
        liquidationPrice: position.liquidationPrice,
        margin: position.initialMargin,
        leverage: position.leverage,
        unrealizedPnl: position.unrealizedPnl,
        marginRatio: position.marginRatio,
        timestamp: position.timestamp
      }));
    
    const response = {
      success: true,
      data: formattedPositions
    };
    
    // Cache the response
    apiCache.set(CACHE_KEYS.POSITIONS, response, 5); // 5 seconds TTL
    
    res.json(response);
  } catch (error) {
    handleApiError(error, res);
  }
});

// Get open orders
router.get('/open-orders/:symbol?', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    // Check cache first
    const cacheKey = symbol ? `${CACHE_KEYS.OPEN_ORDERS}_${symbol}` : CACHE_KEYS.OPEN_ORDERS;
    const cachedData = apiCache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // Fetch open orders from CCXT
    let orders;
    if (symbol) {
      const ccxtSymbol = `${symbol}/USD`;
      orders = await exchange.fetchOpenOrders(ccxtSymbol);
    } else {
      orders = await exchange.fetchOpenOrders();
    }
    
    // Format the response
    const formattedOrders = orders.map(order => ({
      id: order.id,
      clientOrderId: order.clientOrderId,
      symbol: order.symbol.split('/')[0],
      type: order.type,
      side: order.side,
      price: order.price,
      amount: order.amount,
      filled: order.filled,
      remaining: order.remaining,
      status: order.status,
      timestamp: order.timestamp,
      datetime: order.datetime
    }));
    
    const response = {
      success: true,
      data: formattedOrders
    };
    
    // Cache the response
    apiCache.set(cacheKey, response, 5); // 5 seconds TTL
    
    res.json(response);
  } catch (error) {
    handleApiError(error, res);
  }
});

// Place a new order
router.post('/place-order', async (req, res) => {
  try {
    const { symbol, side, size, price, orderType, reduceOnly } = req.body;
    
    if (!symbol || !side || !size) {
      return res.status(400).json({
        success: false,
        error: 'Symbol, side, and size are required'
      });
    }
    
    if (orderType === 'Limit' && !price) {
      return res.status(400).json({
        success: false,
        error: 'Price is required for limit orders'
      });
    }
    
    // Convert to CCXT format
    const ccxtSymbol = `${symbol}/USD`;
    const ccxtSide = side.toLowerCase();
    const ccxtType = orderType.toLowerCase();
    const ccxtAmount = parseFloat(size);
    const ccxtPrice = price ? parseFloat(price) : undefined;
    
    // Prepare params
    const params = {
      reduceOnly: reduceOnly === true
    };
    
    // Place order using CCXT
    let order;
    if (ccxtType === 'limit') {
      order = await exchange.createOrder(ccxtSymbol, ccxtType, ccxtSide, ccxtAmount, ccxtPrice, params);
    } else {
      order = await exchange.createOrder(ccxtSymbol, ccxtType, ccxtSide, ccxtAmount, undefined, params);
    }
    
    // Clear caches after placing an order
    apiCache.del(CACHE_KEYS.POSITIONS);
    apiCache.del(CACHE_KEYS.ACCOUNT);
    apiCache.del(CACHE_KEYS.OPEN_ORDERS);
    
    // Format the response
    const response = {
      success: true,
      message: 'Order placed successfully',
      data: {
        orderId: order.id,
        symbol: order.symbol.split('/')[0],
        side: order.side,
        size: order.amount,
        price: order.price || 'Market',
        orderType: order.type,
        status: order.status,
        timestamp: order.timestamp
      }
    };
    
    res.json(response);
  } catch (error) {
    handleApiError(error, res);
  }
});

// Cancel an order
router.post('/cancel-order', async (req, res) => {
  try {
    const { orderId, symbol } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Symbol is required'
      });
    }
    
    const ccxtSymbol = `${symbol}/USD`;
    
    console.log('Canceling order:', { orderId, symbol: ccxtSymbol });
    
    // Cancel order using CCXT
    const result = await exchange.cancelOrder(orderId, ccxtSymbol);
    
    console.log('Cancel order response:', result);
    
    // Clear order caches after cancelling an order
    apiCache.del(CACHE_KEYS.OPEN_ORDERS);
    
    // Format the response
    const response = {
      success: true,
      message: `Order ${orderId} cancelled successfully`,
      data: {
        orderId: result.id || orderId,
        symbol: result.symbol ? result.symbol.split('/')[0] : symbol,
        status: 'Cancelled',
        timestamp: new Date().toISOString()
      }
    };
    
    res.json(response);
  } catch (error) {
    handleApiError(error, res);
  }
});

module.exports = router;
