const express = require('express');
const router = express.Router();
const axios = require('axios');
const ethers = require('ethers');

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
  try {
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
  } catch (error) {
    throw error; // Let the route handler process the error
  }
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

// GET account information
router.get('/account', async (req, res) => {
  try {
    // Hyperliquid requires the user address for account queries
    const data = { 
      type: "userState",
      user: HYPERLIQUID_WALLET_ADDRESS // Use the actual wallet address
    };
    const accountInfo = await makeAuthenticatedRequest('/info', 'POST', data);
    res.json(accountInfo);
  } catch (error) {
    const errorResponse = handleApiError(error);
    res.status(errorResponse.status || 500).json(errorResponse);
  }
});

// GET market data
router.get('/markets', async (req, res) => {
  try {
    // Request for all markets metadata
    const data = { type: "meta" };
    const marketsData = await makeAuthenticatedRequest('/info', 'POST', data);
    res.json(marketsData);
  } catch (error) {
    const errorResponse = handleApiError(error);
    res.status(errorResponse.status || 500).json(errorResponse);
  }
});

// GET positions
router.get('/positions', async (req, res) => {
  try {
    // Hyperliquid requires the user address for position queries
    const data = { 
      type: "userState",
      user: HYPERLIQUID_WALLET_ADDRESS // Use the actual wallet address
    };
    const positionsData = await makeAuthenticatedRequest('/info', 'POST', data);
    // Extract positions from the response if available
    const positions = positionsData?.positions || [];
    res.json({ positions });
  } catch (error) {
    const errorResponse = handleApiError(error);
    res.status(errorResponse.status || 500).json(errorResponse);
  }
});

// POST place order
router.post('/order', async (req, res) => {
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
    res.json(result);
  } catch (error) {
    const errorResponse = handleApiError(error);
    res.status(errorResponse.status || 500).json(errorResponse);
  }
});

module.exports = router;
