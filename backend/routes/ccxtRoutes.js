/**
 * CCXT Hyperliquid API Routes
 * 
 * This file contains all the routes for interacting with Hyperliquid exchange
 * using the CCXT library.
 */

const express = require('express');
const router = express.Router();
const ccxt = require('ccxt');
const auth = require('../middleware/auth');

// Configure exchange based on environment variables
let exchange = null;

// Initialize exchange with API keys from environment
const initializeExchange = () => {
  try {
    // Specifically using Hyperliquid exchange
    const exchangeId = 'hyperliquid';
    
    // Create new exchange instance with Hyperliquid-specific config
    exchange = new ccxt[exchangeId]({
      apiKey: process.env.CCXT_API_KEY,
      secret: process.env.CCXT_API_SECRET,
      // Hyperliquid specific options
      walletAddress: process.env.CCXT_WALLET_ADDRESS,
      options: {
        defaultType: 'swap', // For perpetual swaps
        adjustForTimeDifference: true,
        recvWindow: 10000, // Increase if you get timestamp errors
      }
    });
    
    // Set testnet if configured
    if (process.env.CCXT_TESTNET === 'true') {
      exchange.setSandboxMode(true);
    }
    
    console.log(`CCXT Hyperliquid exchange initialized (${process.env.CCXT_TESTNET === 'true' ? 'testnet' : 'mainnet'})`);
    return true;
  } catch (error) {
    console.error('Failed to initialize Hyperliquid exchange:', error.message);
    return false;
  }
};

// Middleware to ensure exchange is initialized
const ensureExchangeInitialized = (req, res, next) => {
  if (!exchange) {
    if (!initializeExchange()) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to initialize exchange. Check API credentials.' 
      });
    }
  }
  next();
};

// Error handling middleware
const handleApiError = (error, req, res) => {
  console.error('CCXT API Error:', error);
  
  // Handle CCXT specific errors
  if (error instanceof ccxt.ExchangeError) {
    return res.status(400).json({ 
      success: false, 
      error: `Exchange error: ${error.message}` 
    });
  }
  
  if (error instanceof ccxt.AuthenticationError) {
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication failed. Check API credentials.' 
    });
  }
  
  if (error instanceof ccxt.InsufficientFunds) {
    return res.status(400).json({ 
      success: false, 
      error: 'Insufficient funds for this operation.' 
    });
  }
  
  if (error instanceof ccxt.InvalidOrder) {
    return res.status(400).json({ 
      success: false, 
      error: `Invalid order: ${error.message}` 
    });
  }
  
  // Generic error handling
  return res.status(500).json({ 
    success: false, 
    error: error.message || 'An unknown error occurred' 
  });
};

// Routes
// Apply authentication middleware to all routes
router.use(auth);
router.use(ensureExchangeInitialized);

/**
 * Get account information
 * GET /api/ccxt/account
 */
router.get('/account', async (req, res) => {
  try {
    // Fetch balance information
    const balance = await exchange.fetchBalance();
    
    // Log the raw balance data for debugging
    console.log('Raw Hyperliquid balance data:', JSON.stringify(balance, null, 2));
    
    // For Hyperliquid, we need to get additional account information
    let accountInfo = { balance };
    
    try {
      // Try to get additional account info if available
      if (exchange.has['fetchAccounts']) {
        const accounts = await exchange.fetchAccounts();
        accountInfo.accounts = accounts;
      }
      
      // Get trading fees if available
      if (exchange.has['fetchTradingFees']) {
        const tradingFees = await exchange.fetchTradingFees();
        accountInfo.tradingFees = tradingFees;
      }
      
      // For Hyperliquid-specific account info
      if (typeof exchange.privateGetAccountData === 'function') {
        const hyperliquidAccount = await exchange.privateGetAccountData();
        accountInfo.hyperliquidSpecific = hyperliquidAccount;
      }
    } catch (additionalInfoError) {
      console.warn('Could not fetch additional account info:', additionalInfoError.message);
      // Continue with just the balance info
    }
    
    return res.json({
      success: true,
      data: accountInfo
    });
  } catch (error) {
    return handleApiError(error, req, res);
  }
});

/**
 * Get positions
 * GET /api/ccxt/positions
 */
router.get('/positions', async (req, res) => {
  try {
    // Hyperliquid-specific position fetching
    let positions = [];
    let positionDetails = {};
    
    // Try multiple methods to get the most complete position data
    try {
      // Standard CCXT methods first
      if (exchange.has['fetchPositions']) {
        positions = await exchange.fetchPositions();
        positionDetails.source = 'fetchPositions';
      } else if (exchange.has['fetchOpenPositions']) {
        positions = await exchange.fetchOpenPositions();
        positionDetails.source = 'fetchOpenPositions';
      }
    } catch (standardMethodError) {
      console.warn('Standard position methods failed:', standardMethodError.message);
    }
    
    // If standard methods didn't work or returned empty, try Hyperliquid-specific methods
    if (!positions || positions.length === 0) {
      try {
        // Try Hyperliquid-specific methods
        if (typeof exchange.privateGetPositions === 'function') {
          positions = await exchange.privateGetPositions();
          positionDetails.source = 'privateGetPositions';
        } else if (typeof exchange.privateGetUserPositions === 'function') {
          positions = await exchange.privateGetUserPositions();
          positionDetails.source = 'privateGetUserPositions';
        }
      } catch (specificMethodError) {
        console.warn('Hyperliquid-specific position methods failed:', specificMethodError.message);
      }
    }
    
    // Get additional position metadata if available
    try {
      if (exchange.has['fetchPositionRisk']) {
        const positionRisk = await exchange.fetchPositionRisk();
        positionDetails.risk = positionRisk;
      }
    } catch (riskError) {
      console.warn('Could not fetch position risk:', riskError.message);
    }
    
    // Fetch current market prices for all positions
    const marketPrices = {};
    try {
      // Get unique symbols from positions
      const symbols = [...new Set(positions.map(p => p.symbol || p.instrument || p.market))];
      
      // Fetch tickers for all symbols
      if (symbols.length > 0 && exchange.has['fetchTickers']) {
        console.log('Fetching tickers for symbols:', symbols);
        const tickers = await exchange.fetchTickers(symbols);
        
        // Extract last prices from tickers
        for (const symbol in tickers) {
          if (tickers[symbol] && tickers[symbol].last) {
            marketPrices[symbol] = tickers[symbol].last;
          }
        }
      } else if (symbols.length > 0) {
        // Fetch individual tickers if fetchTickers is not available
        for (const symbol of symbols) {
          try {
            const ticker = await exchange.fetchTicker(symbol);
            if (ticker && ticker.last) {
              marketPrices[symbol] = ticker.last;
            }
          } catch (tickerError) {
            console.warn(`Failed to fetch ticker for ${symbol}:`, tickerError.message);
          }
        }
      }
      
      console.log('Market prices fetched:', marketPrices);
      positionDetails.marketPrices = marketPrices;
    } catch (marketPricesError) {
      console.warn('Failed to fetch market prices:', marketPricesError.message);
    }
    
    return res.json({
      success: true,
      data: {
        positions,
        details: positionDetails
      }
    });
  } catch (error) {
    return handleApiError(error, req, res);
  }
});

/**
 * Get open orders
 * GET /api/ccxt/orders
 */
router.get('/orders', async (req, res) => {
  try {
    const orders = await exchange.fetchOpenOrders();
    return res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    return handleApiError(error, req, res);
  }
});

/**
 * Place an order
 * POST /api/ccxt/order
 */
router.post('/order', async (req, res) => {
  try {
    const { symbol, side, size, price, orderType, reduceOnly, leverage } = req.body;
    
    if (!symbol || !side || !size) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: symbol, side, size'
      });
    }
    
    // Validate side
    if (side !== 'buy' && side !== 'sell') {
      return res.status(400).json({
        success: false,
        error: 'Side must be either "buy" or "sell"'
      });
    }
    
    // Set leverage if provided (Hyperliquid specific)
    if (leverage && exchange.has['setLeverage']) {
      try {
        await exchange.setLeverage(leverage, symbol);
      } catch (leverageError) {
        console.warn('Failed to set leverage:', leverageError.message);
        // Continue with order placement even if leverage setting fails
      }
    }
    
    // Prepare order parameters (Hyperliquid specific)
    const params = {};
    if (reduceOnly !== undefined) {
      params.reduceOnly = reduceOnly;
    }
    
    let order;
    if (orderType === 'market') {
      // Place market order
      order = await exchange.createOrder(symbol, 'market', side, size, undefined, params);
    } else {
      // Default to limit order
      if (!price) {
        return res.status(400).json({
          success: false,
          error: 'Price is required for limit orders'
        });
      }
      order = await exchange.createOrder(symbol, 'limit', side, size, price, params);
    }
    
    return res.json({
      success: true,
      data: order
    });
  } catch (error) {
    return handleApiError(error, req, res);
  }
});

/**
 * Cancel an order
 * DELETE /api/ccxt/order/:orderId
 */
router.delete('/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { symbol } = req.query;
    
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
    
    const result = await exchange.cancelOrder(orderId, symbol);
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    return handleApiError(error, req, res);
  }
});

/**
 * Set leverage for a symbol
 * POST /api/ccxt/leverage
 */
router.post('/leverage', async (req, res) => {
  try {
    const { leverage, symbol } = req.body;
    
    if (!leverage || !symbol) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: leverage, symbol'
      });
    }
    
    // Check if exchange supports leverage setting
    if (!exchange.has['setLeverage']) {
      return res.status(400).json({
        success: false,
        error: 'This exchange does not support leverage setting'
      });
    }
    
    const result = await exchange.setLeverage(leverage, symbol);
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    return handleApiError(error, req, res);
  }
});

/**
 * Get order book
 * GET /api/ccxt/orderbook/:symbol
 */
router.get('/orderbook/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Symbol is required'
      });
    }
    
    const orderbook = await exchange.fetchOrderBook(symbol, limit);
    return res.json({
      success: true,
      data: orderbook
    });
  } catch (error) {
    return handleApiError(error, req, res);
  }
});

/**
 * Get ticker
 * GET /api/ccxt/ticker/:symbol
 */
router.get('/ticker/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Symbol is required'
      });
    }
    
    const ticker = await exchange.fetchTicker(symbol);
    return res.json({
      success: true,
      data: ticker
    });
  } catch (error) {
    return handleApiError(error, req, res);
  }
});

/**
 * Get all tickers
 * GET /api/ccxt/tickers
 */
router.get('/tickers', async (req, res) => {
  try {
    const tickers = await exchange.fetchTickers();
    return res.json({
      success: true,
      data: tickers
    });
  } catch (error) {
    return handleApiError(error, req, res);
  }
});

/**
 * Get markets
 * GET /api/ccxt/markets
 */
router.get('/markets', async (req, res) => {
  try {
    const markets = await exchange.fetchMarkets();
    return res.json({
      success: true,
      data: markets
    });
  } catch (error) {
    return handleApiError(error, req, res);
  }
});

/**
 * Get OHLCV (Candlestick) data
 * GET /api/ccxt/ohlcv/:symbol
 */
router.get('/ohlcv/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const timeframe = req.query.timeframe || '1h';
    const limit = parseInt(req.query.limit) || 100;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Symbol is required'
      });
    }
    
    const ohlcv = await exchange.fetchOHLCV(symbol, timeframe, undefined, limit);
    return res.json({
      success: true,
      data: ohlcv
    });
  } catch (error) {
    return handleApiError(error, req, res);
  }
});

/**
 * Get recent trades
 * GET /api/ccxt/trades/:symbol
 */
router.get('/trades/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Symbol is required'
      });
    }
    
    const trades = await exchange.fetchTrades(symbol, undefined, limit);
    return res.json({
      success: true,
      data: trades
    });
  } catch (error) {
    return handleApiError(error, req, res);
  }
});

module.exports = router;
