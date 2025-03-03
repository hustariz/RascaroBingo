const express = require('express');
const router = express.Router();
const path = require('path');
const { 
    handleRateLimit, 
    updateBackoff, 
} = require('./kraken/krakenUtils');
const websocket = require('./kraken/krakenWebSocket');
const spotRoutes = require('./kraken/krakenSpotRoutes');
const futuresRoutes = require('./kraken/krakenFuturesRoutes');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Rate limiting utilities
const rateLimitState = {
    lastRequestTime: {},
    backoffTime: {},
    maxBackoff: 30000, // Max 30 seconds
    minInterval: 3000  // Min 3 seconds between requests
};

// Modified Kraken API request wrapper
const krakenApiRequest = async (kraken, method, params = {}) => {
    const endpoint = method;
    await handleRateLimit(endpoint);
    
    try {
        const result = await kraken.api(method, params);
        updateBackoff(endpoint, true);
        return result;
    } catch (error) {
        if (error.message?.includes('Rate limit exceeded')) {
            updateBackoff(endpoint, false);
            console.log(`Rate limit hit for ${endpoint}, backing off to ${rateLimitState.backoffTime[endpoint]}ms`);
            throw error;
        }
        throw error;
    }
};

// Mount spot trading routes
router.use('/', spotRoutes);

// Mount futures trading routes
router.use('/futures', futuresRoutes);

// Initialize WebSocket updates
router.init = websocket.init;

module.exports = router;
