const express = require('express');
const router = express.Router();
const axios = require('axios');
const ethers = require('ethers');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');

/**
 * Hyperliquid API integration routes
 * 
 * This file contains all routes for interacting with the Hyperliquid API
 */

// Hyperliquid API configuration
const HYPERLIQUID_API_KEY = process.env.HYPERLIQUID_API_KEY;
const HYPERLIQUID_API_SECRET = process.env.HYPERLIQUID_API_SECRET;
const HYPERLIQUID_WALLET_ADDRESS = process.env.HYPERLIQUID_WALLET_ADDRESS;
const HYPERLIQUID_BASE_URL = 'https://api.hyperliquid.xyz';

// Check if API keys are configured
if (!HYPERLIQUID_API_KEY) {
  console.warn('⚠️ HYPERLIQUID_API_KEY is not set in environment variables');
}

if (!HYPERLIQUID_WALLET_ADDRESS) {
  console.warn('⚠️ HYPERLIQUID_WALLET_ADDRESS is not set in environment variables');
}

/**
 * Configure caching for API responses
 * 
 * Different TTL (time to live) values for different types of data:
 * - Market data: 30 seconds (changes frequently but can be cached briefly)
 * - Account data: 5 seconds (very short cache for account info)
 * - Other data: 60 seconds (default)
 */
const apiCache = new NodeCache({
  stdTTL: 60, // Default TTL in seconds
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false // Don't clone objects when getting/setting (for performance)
});

// Cache keys
const CACHE_KEYS = {
  MARKETS: 'hyperliquid_markets',
  ACCOUNT: 'hyperliquid_account',
  POSITIONS: 'hyperliquid_positions'
};

// Cache TTL values (in seconds)
const CACHE_TTL = {
  MARKETS: 30,
  ACCOUNT: 5,
  POSITIONS: 5
};

/**
 * Configure rate limiters for different API endpoints
 * 
 * These rate limits are set conservatively to avoid hitting Hyperliquid's limits
 * Adjust these values based on Hyperliquid's actual rate limits if needed
 */

// General rate limiter for all Hyperliquid routes
const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

// More restrictive rate limiter for order placement
const orderRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 order requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many order requests, please try again later',
    code: 'ORDER_RATE_LIMIT_EXCEEDED'
  }
});

// Apply the global rate limiter to all routes in this router
router.use(globalRateLimiter);

/**
 * Helper function to sign requests
 * 
 * Hyperliquid uses Ethereum signatures for authentication
 * The private key is used to sign the request data
 */
const signRequest = async (data) => {
  if (!HYPERLIQUID_API_SECRET) {
    console.warn('No API secret available for signing');
    return null;
  }
  
  try {
    // Create a wallet instance from the private key
    const wallet = new ethers.Wallet(HYPERLIQUID_API_SECRET);
    
    // Create a hash of the data
    const messageHash = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(JSON.stringify(data))
    );
    
    // Sign the hash
    const signature = await wallet.signMessage(ethers.utils.arrayify(messageHash));
    return signature;
  } catch (error) {
    console.error('Error signing request:', error);
    return null;
  }
};

/**
 * Helper function to handle API errors
 * 
 * @param {Error} error - The error object from axios
 * @returns {Object} - Formatted error response
 */
const handleApiError = (error) => {
  // Default error response
  const errorResponse = {
    success: false,
    message: 'An error occurred while communicating with Hyperliquid API',
    error: error.message,
    code: 'UNKNOWN_ERROR'
  };

  // Check if it's an axios error with response
  if (error.response) {
    const { status, data } = error.response;
    
    // Add status code to the error response
    errorResponse.status = status;
    
    // Handle specific HTTP status codes
    switch (status) {
      case 400:
        errorResponse.message = 'Bad request: The request was improperly formatted or contained invalid parameters';
        errorResponse.code = 'BAD_REQUEST';
        break;
      case 401:
        errorResponse.message = 'Unauthorized: Authentication failed, check your API credentials';
        errorResponse.code = 'UNAUTHORIZED';
        break;
      case 403:
        errorResponse.message = 'Forbidden: You do not have permission to access this resource';
        errorResponse.code = 'FORBIDDEN';
        break;
      case 404:
        errorResponse.message = 'Not found: The requested resource could not be found';
        errorResponse.code = 'NOT_FOUND';
        break;
      case 429:
        errorResponse.message = 'Too many requests: You have exceeded the rate limit';
        errorResponse.code = 'RATE_LIMIT_EXCEEDED';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        errorResponse.message = 'Server error: The Hyperliquid API is currently experiencing issues';
        errorResponse.code = 'SERVER_ERROR';
        break;
    }
    
    // Include response data if available
    if (data) {
      errorResponse.details = data;
    }
  } else if (error.request) {
    // Request was made but no response received
    errorResponse.message = 'No response received from Hyperliquid API';
    errorResponse.code = 'NO_RESPONSE';
  }
  
  // Log the error for debugging
  console.error(`Hyperliquid API error [${errorResponse.code}]:`, error.message);
  
  return errorResponse;
};

/**
 * Helper function to make authenticated API requests
 * 
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {object} data - Request data
 * @returns {Promise<object>} - API response
 */
const makeAuthenticatedRequest = async (endpoint, method = 'POST', data = null) => {
  const url = `${HYPERLIQUID_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json'
  };
  
  // Add signature if needed for /exchange endpoint
  if (endpoint === '/exchange' && data && HYPERLIQUID_API_SECRET) {
    const signature = await signRequest(data);
    if (signature) {
      // Add the signature to the request
      data.signature = signature;
      // Add the wallet address to the request
      data.wallet = HYPERLIQUID_WALLET_ADDRESS;
    }
  }
  
  const options = {
    method,
    url,
    headers,
    ...(data && { data })
  };
  
  const response = await axios(options);
  return response.data;
};

// GET test connection
router.get('/connection-test', async (req, res) => {
  try {
    // Hyperliquid API requires POST for /info endpoint
    // We'll use the meta request to get basic info
    const data = { type: "meta" };
    const result = await makeAuthenticatedRequest('/info', 'POST', data);
    res.json({ success: true, message: 'Successfully connected to Hyperliquid API', data: result });
  } catch (error) {
    console.error('Error testing connection:', error);
    const errorResponse = handleApiError(error);
    res.status(errorResponse.status || 500).json(errorResponse);
  }
});

// GET account information (with caching)
router.get('/account', async (req, res) => {
  try {
    // Check cache first
    const cacheKey = CACHE_KEYS.ACCOUNT;
    const cachedData = apiCache.get(cacheKey);
    
    if (cachedData) {
      console.log('Returning cached account data');
      return res.json(cachedData);
    }
    
    // If not in cache, fetch from API
    const data = { 
      type: "userState",
      user: HYPERLIQUID_WALLET_ADDRESS
    };
    
    const accountInfo = await makeAuthenticatedRequest('/info', 'POST', data);
    
    // Cache the response
    apiCache.set(cacheKey, accountInfo, CACHE_TTL.ACCOUNT);
    
    res.json(accountInfo);
  } catch (error) {
    const errorResponse = handleApiError(error);
    res.status(errorResponse.status || 500).json(errorResponse);
  }
});

// GET market data (with caching)
router.get('/markets', async (req, res) => {
  try {
    // Check if we should bypass cache
    const bypassCache = req.query.refresh === 'true';
    
    // Check cache first (unless bypassing)
    const cacheKey = CACHE_KEYS.MARKETS;
    const cachedData = bypassCache ? null : apiCache.get(cacheKey);
    
    if (cachedData) {
      console.log('Returning cached market data');
      return res.json(cachedData);
    }
    
    // If not in cache or bypassing, fetch from API
    const data = { type: "meta" };
    const marketsData = await makeAuthenticatedRequest('/info', 'POST', data);
    
    // Cache the response
    apiCache.set(cacheKey, marketsData, CACHE_TTL.MARKETS);
    
    res.json(marketsData);
  } catch (error) {
    const errorResponse = handleApiError(error);
    res.status(errorResponse.status || 500).json(errorResponse);
  }
});

// GET positions (with caching)
router.get('/positions', async (req, res) => {
  try {
    // Check if we should bypass cache
    const bypassCache = req.query.refresh === 'true';
    
    // Check cache first (unless bypassing)
    const cacheKey = CACHE_KEYS.POSITIONS;
    const cachedData = bypassCache ? null : apiCache.get(cacheKey);
    
    if (cachedData) {
      console.log('Returning cached positions data');
      return res.json(cachedData);
    }
    
    // If not in cache or bypassing, fetch from API
    const data = { 
      type: "userState",
      user: HYPERLIQUID_WALLET_ADDRESS
    };
    
    const positionsData = await makeAuthenticatedRequest('/info', 'POST', data);
    
    // Extract positions from the response if available
    const positions = positionsData?.positions || [];
    const result = { positions };
    
    // Cache the response
    apiCache.set(cacheKey, result, CACHE_TTL.POSITIONS);
    
    res.json(result);
  } catch (error) {
    const errorResponse = handleApiError(error);
    res.status(errorResponse.status || 500).json(errorResponse);
  }
});

// POST place order - with additional rate limiting
router.post('/order', orderRateLimiter, async (req, res) => {
  try {
    const orderData = req.body;
    
    // Validate required fields
    if (!orderData.symbol || !orderData.side || !orderData.price || !orderData.size) {
      return res.status(400).json({
        success: false,
        message: 'Missing required order parameters',
        code: 'MISSING_PARAMETERS',
        details: {
          required: ['symbol', 'side', 'price', 'size'],
          received: Object.keys(orderData)
        }
      });
    }
    
    // Format the order data according to Hyperliquid's API requirements
    const formattedOrder = {
      action: {
        type: "order",
        order: {
          coin: orderData.symbol || "BTC",
          side: orderData.side === 'buy' ? 'B' : 'A', // Convert to Hyperliquid notation (B/A)
          price: orderData.price,
          sz: orderData.size,
          tif: orderData.timeInForce || 'GTC' // Default to GTC
        }
      },
      nonce: Date.now(), // Add a nonce to prevent replay attacks
      // The signature and wallet will be added by makeAuthenticatedRequest
    };
    
    const result = await makeAuthenticatedRequest('/exchange', 'POST', formattedOrder);
    
    // Clear position and account caches after placing an order
    apiCache.del(CACHE_KEYS.POSITIONS);
    apiCache.del(CACHE_KEYS.ACCOUNT);
    
    res.json(result);
  } catch (error) {
    const errorResponse = handleApiError(error);
    res.status(errorResponse.status || 500).json(errorResponse);
  }
});

// Add a route to manually clear the cache
router.post('/clear-cache', (req, res) => {
  const cacheKey = req.body.key;
  
  if (cacheKey && CACHE_KEYS[cacheKey.toUpperCase()]) {
    // Clear specific cache
    apiCache.del(CACHE_KEYS[cacheKey.toUpperCase()]);
    res.json({ success: true, message: `Cache for ${cacheKey} cleared successfully` });
  } else {
    // Clear all caches
    apiCache.flushAll();
    res.json({ success: true, message: 'All caches cleared successfully' });
  }
});

module.exports = router;
