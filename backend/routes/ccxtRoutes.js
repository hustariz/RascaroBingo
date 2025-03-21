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
      // Hyperliquid specific credentials
      walletAddress: process.env.CCXT_WALLET_ADDRESS,
      privateKey: process.env.CCXT_API_SECRET, // Use the secret as privateKey
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
    // Fetch open orders
    const orders = await exchange.fetchOpenOrders();
    
    // Log raw order data for debugging
    console.log('Raw Hyperliquid open orders:', JSON.stringify(orders, null, 2));
    
    // Log more detailed information about the first order if available
    if (orders.length > 0) {
      console.log('First order details:');
      console.log('- ID:', orders[0].id);
      console.log('- Symbol:', orders[0].symbol);
      console.log('- Raw symbol type:', typeof orders[0].symbol);
      console.log('- Info object:', JSON.stringify(orders[0].info, null, 2));
      
      // Try to extract asset ID from different possible locations
      const possibleAssetId = 
        (orders[0].info && orders[0].info.coin) ? orders[0].info.coin :
        (orders[0].info && orders[0].info.asset) ? orders[0].info.asset :
        (orders[0].market && orders[0].market.id) ? orders[0].market.id :
        (orders[0].symbol && !isNaN(orders[0].symbol)) ? orders[0].symbol : null;
      
      console.log('- Extracted asset ID:', possibleAssetId);
    }
    
    // Enhance orders with additional information if missing
    const enhancedOrders = orders.map(order => {
      // Create a copy of the order to avoid modifying the original
      const enhancedOrder = { ...order };
      
      // Ensure orderType is set
      if (!enhancedOrder.orderType && enhancedOrder.type) {
        enhancedOrder.orderType = enhancedOrder.type;
      } else if (!enhancedOrder.orderType) {
        enhancedOrder.orderType = 'limit'; // Default to limit if not specified
      }
      
      // Ensure size is set
      if (!enhancedOrder.size && enhancedOrder.amount) {
        enhancedOrder.size = enhancedOrder.amount;
      } else if (!enhancedOrder.size && enhancedOrder.quantity) {
        enhancedOrder.size = enhancedOrder.quantity;
      } else if (!enhancedOrder.size) {
        // Try to derive size from other fields
        if (enhancedOrder.cost && enhancedOrder.price && enhancedOrder.price > 0) {
          enhancedOrder.size = enhancedOrder.cost / enhancedOrder.price;
        } else {
          enhancedOrder.size = 0; // Default if we can't determine
        }
      }
      
      // Ensure filled is set
      if (!enhancedOrder.filled && enhancedOrder.filledQuantity) {
        enhancedOrder.filled = enhancedOrder.filledQuantity;
      } else if (!enhancedOrder.filled && enhancedOrder.executed) {
        enhancedOrder.filled = enhancedOrder.executed;
      } else if (!enhancedOrder.filled) {
        enhancedOrder.filled = 0; // Default if not specified
      }
      
      // Ensure side is properly formatted
      if (enhancedOrder.side === 'buy' || enhancedOrder.side === 'B') {
        enhancedOrder.side = 'B';
      } else if (enhancedOrder.side === 'sell' || enhancedOrder.side === 'S') {
        enhancedOrder.side = 'S';
      }
      
      // Ensure timestamp is set
      if (!enhancedOrder.timestamp && enhancedOrder.datetime) {
        enhancedOrder.timestamp = new Date(enhancedOrder.datetime).getTime();
      } else if (!enhancedOrder.timestamp && enhancedOrder.time) {
        enhancedOrder.timestamp = enhancedOrder.time;
      } else if (!enhancedOrder.timestamp) {
        enhancedOrder.timestamp = Date.now(); // Default to current time
      }
      
      // Add asset ID if available in the info object
      if (enhancedOrder.info && enhancedOrder.info.coin) {
        enhancedOrder.assetId = enhancedOrder.info.coin;
      } else if (enhancedOrder.info && enhancedOrder.info.asset) {
        enhancedOrder.assetId = enhancedOrder.info.asset;
      } else if (enhancedOrder.market && enhancedOrder.market.id) {
        enhancedOrder.assetId = enhancedOrder.market.id;
      } else if (enhancedOrder.symbol && !isNaN(enhancedOrder.symbol)) {
        enhancedOrder.assetId = enhancedOrder.symbol;
      }
      
      return enhancedOrder;
    });
    
    return res.json({
      success: true,
      data: enhancedOrders
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
    
    // Log the order request details
    console.log('Order request:', {
      symbol,
      side,
      size,
      price,
      orderType,
      reduceOnly,
      leverage
    });
    
    // For Hyperliquid, ensure we have the correct market symbol
    let marketSymbol = symbol;
    
    // If the exchange is Hyperliquid, we need to handle the symbol properly
    if (exchange.id === 'hyperliquid') {
      try {
        // Fetch markets to find the correct symbol format
        const markets = await exchange.fetchMarkets();
        console.log(`Looking for market matching symbol: ${symbol}`);
        
        // Try to find the market by symbol, id, or base currency
        const market = markets.find(m => 
          m.id === symbol || 
          m.symbol === symbol || 
          m.base === symbol.split('-')[0] || // Handle XRP from XRP-USD
          m.symbol.startsWith(symbol.split('-')[0]) // Handle XRP from XRP-USD
        );
        
        if (market) {
          marketSymbol = market.symbol;
          console.log(`Found market for ${symbol}: using ${marketSymbol}`);
        } else {
          console.log('Available markets:', markets.map(m => ({ id: m.id, symbol: m.symbol, base: m.base })));
          console.warn(`Could not find exact market for symbol: ${symbol}, using as-is`);
        }
      } catch (marketError) {
        console.warn('Error fetching markets:', marketError.message);
        // Continue with the order using the provided symbol
      }
    }
    
    // Set leverage if provided (Hyperliquid specific)
    if (leverage && exchange.has['setLeverage']) {
      try {
        console.log(`Setting leverage to ${leverage} for ${marketSymbol}`);
        await exchange.setLeverage(leverage, marketSymbol);
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
    
    // For Hyperliquid, ensure numeric values are properly formatted
    const orderSize = parseFloat(size);
    const orderPrice = price ? parseFloat(price) : undefined;
    
    console.log(`Creating order: ${marketSymbol}, ${orderType}, ${side}, ${orderSize}, ${orderPrice}`);
    
    let order;
    if (orderType === 'market') {
      // Place market order
      order = await exchange.createOrder(marketSymbol, 'market', side, orderSize, undefined, params);
    } else {
      // Default to limit order
      if (!orderPrice) {
        return res.status(400).json({
          success: false,
          error: 'Price is required for limit orders'
        });
      }
      order = await exchange.createOrder(marketSymbol, 'limit', side, orderSize, orderPrice, params);
    }
    
    console.log('Order created successfully:', order);
    
    return res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Order placement error:', error);
    return handleApiError(error, req, res);
  }
});

/**
 * Cancel an order
 * DELETE /api/ccxt/order/:orderId
 */
router.delete('/order/:orderId', auth, async (req, res) => {
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
    
    // Log the attempt to cancel order
    console.log(`Attempting to cancel order: ${orderId} for asset ID: ${symbol}`);
    
    // For Hyperliquid, ensure the symbol is a valid asset ID (numeric)
    let marketSymbol = symbol;
    
    // If the exchange is Hyperliquid, we need to handle the symbol differently
    if (exchange.id === 'hyperliquid') {
      // Check if the symbol is already numeric
      if (isNaN(symbol)) {
        // Try to find the corresponding market
        const markets = await exchange.fetchMarkets();
        const market = markets.find(m => 
          m.id === symbol || 
          m.symbol === symbol || 
          m.base === symbol
        );
        
        if (market) {
          marketSymbol = market.id;
          console.log(`Converted symbol ${symbol} to market ID ${marketSymbol}`);
        } else {
          console.error(`Could not find market for symbol: ${symbol}`);
          return res.status(400).json({
            success: false,
            error: `Could not find market for symbol: ${symbol}`
          });
        }
      } else {
        // Symbol is already numeric, use it directly
        console.log(`Using numeric asset ID directly: ${symbol}`);
      }
    }
    
    // Ensure exchange has all required credentials
    if (!exchange.checkRequiredCredentials()) {
      console.error('Missing required credentials for Hyperliquid');
      // Log what credentials we have for debugging
      console.log('Available credentials:', {
        apiKey: !!exchange.apiKey,
        secret: !!exchange.secret,
        privateKey: !!exchange.privateKey,
        walletAddress: !!exchange.walletAddress
      });
      
      return res.status(400).json({
        success: false,
        error: 'Missing required exchange credentials'
      });
    }
    
    // Try to cancel the order with the proper market symbol
    const result = await exchange.cancelOrder(orderId, marketSymbol);
    console.log('Order cancelled successfully:', result);
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error cancelling order:', error.message);
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
 * Get current market price for a symbol
 * GET /api/ccxt/price/:symbol
 */
router.get('/price/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Symbol is required'
      });
    }
    
    console.log(`Fetching price for symbol: ${symbol}`);
    
    // Extract the base asset from the symbol (e.g., "XRP" from "XRP-USD")
    const baseAsset = symbol.split('-')[0];
    console.log(`Extracted asset ID: ${baseAsset}`);
    
    // For Hyperliquid, we need to find the correct market symbol
    let marketSymbol = symbol;
    let marketPrice = null;
    
    try {
      // First try to get the ticker for the exact symbol
      const ticker = await exchange.fetchTicker(symbol);
      marketPrice = ticker.last || ticker.close || ticker.bid;
      console.log(`Direct ticker price for ${symbol}: ${marketPrice}`);
    } catch (directTickerError) {
      console.warn(`Could not fetch direct ticker for ${symbol}: ${directTickerError.message}`);
      
      // If direct ticker fails, try to find the market and then get its ticker
      try {
        const markets = await exchange.fetchMarkets();
        
        // Find markets that match the base asset
        const matchingMarkets = markets.filter(m => 
          m.base === baseAsset || 
          m.symbol.startsWith(baseAsset + '/') ||
          m.id === baseAsset
        );
        
        if (matchingMarkets.length > 0) {
          // Use the first matching market
          marketSymbol = matchingMarkets[0].symbol;
          console.log(`Found matching market: ${marketSymbol}`);
          
          // Get ticker for the matching market
          const ticker = await exchange.fetchTicker(marketSymbol);
          marketPrice = ticker.last || ticker.close || ticker.bid;
        } else {
          // If no matching market, try to fetch all tickers and find one with the base asset
          const tickers = await exchange.fetchTickers();
          const marketPrices = {};
          
          for (const [tickerSymbol, tickerData] of Object.entries(tickers)) {
            if (tickerSymbol.startsWith(baseAsset + '/') || 
                tickerSymbol.includes('/' + baseAsset) ||
                tickerSymbol.startsWith(baseAsset + ':')) {
              marketPrices[tickerSymbol] = tickerData.last || tickerData.close || tickerData.bid;
            }
          }
          
          console.log(`Market prices fetched:`, marketPrices);
          
          if (Object.keys(marketPrices).length > 0) {
            // Use the first price found
            marketSymbol = Object.keys(marketPrices)[0];
            marketPrice = marketPrices[marketSymbol];
          }
        }
      } catch (marketSearchError) {
        console.error(`Error searching for markets: ${marketSearchError.message}`);
      }
    }
    
    if (marketPrice === null) {
      return res.status(404).json({
        success: false,
        error: `Could not find price for ${symbol}`
      });
    }
    
    return res.json({
      success: true,
      data: {
        symbol: marketSymbol,
        price: marketPrice,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return handleApiError(error, req, res);
  }
});

module.exports = router;
