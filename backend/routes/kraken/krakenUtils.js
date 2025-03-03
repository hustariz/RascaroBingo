const crypto = require('crypto');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Nonce management
let lastNonce = Date.now();
const getNonce = () => {
    const now = Date.now();
    lastNonce = Math.max(now, lastNonce + 1);
    return lastNonce.toString();
};

// Kraken Futures API helper functions
const createSignature = (endpoint, nonce, apiKey, secretKey, postData = '') => {
    const message = `${postData}${nonce}${endpoint}`;
    const messageHash = crypto.createHash('sha256').update(message).digest();
    const decodedSecret = Buffer.from(secretKey, 'base64');
    const hmac = crypto.createHmac('sha512', decodedSecret);
    hmac.update(messageHash);
    return hmac.digest('base64');
};

// Rate limiting utilities
const rateLimitState = {
    lastRequestTime: {},
    backoffTime: {},
    maxBackoff: 30000, // Max 30 seconds
    minInterval: 3000  // Min 3 seconds between requests
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const handleRateLimit = async (endpoint) => {
    const now = Date.now();
    const lastRequest = rateLimitState.lastRequestTime[endpoint] || 0;
    const backoff = rateLimitState.backoffTime[endpoint] || rateLimitState.minInterval;
    
    const timeToWait = Math.max(0, lastRequest + backoff - now);
    if (timeToWait > 0) {
        await sleep(timeToWait);
    }
    
    rateLimitState.lastRequestTime[endpoint] = Date.now();
    return backoff;
};

const updateBackoff = (endpoint, success) => {
    if (success) {
        // Reset backoff on success
        rateLimitState.backoffTime[endpoint] = rateLimitState.minInterval;
    } else {
        // Exponential backoff on failure
        const currentBackoff = rateLimitState.backoffTime[endpoint] || rateLimitState.minInterval;
        rateLimitState.backoffTime[endpoint] = Math.min(currentBackoff * 2, rateLimitState.maxBackoff);
    }
};

// Error handling helper
const handleKrakenError = (err, res) => {
    console.error('Kraken API error:', err);
    
    // Handle rate limit errors
    if (err.message?.includes('Rate limit exceeded')) {
        res.status(429).json({
            error: 'Rate limit exceeded, please try again later',
            retryAfter: 5 // seconds
        });
        return;
    }
    
    // Handle authentication errors
    if (err.message?.includes('Invalid API key')) {
        res.status(401).json({
            error: 'Invalid API credentials'
        });
        return;
    }
    
    // Return test data for other errors in development
    if (process.env.NODE_ENV !== 'production') {
        if (err.config?.url?.includes('Balance')) {
            res.json({
                result: {
                    ZUSD: '150000.00',
                    XXBT: '2.50000000',
                    XETH: '25.00000000',
                    XXRP: '10000.00'
                }
            });
            return;
        }
    }
    
    // Generic error response
    res.status(500).json({
        error: err.message || 'Internal server error'
    });
};

// Kraken Futures API request function
const krakenFuturesRequestOriginal = async (endpoint, method = 'GET', data = {}) => {
    const apiKey = process.env.KRAKEN_FUTURES_API_KEY;
    const secretKey = process.env.KRAKEN_FUTURES_API_SECRET;
    
    if (!apiKey || !secretKey) {
        throw new Error('Kraken Futures API credentials not configured');
    }

    const nonce = getNonce();
    const path = endpoint.replace('/derivatives', '');
    const postData = method === 'POST' ? JSON.stringify(data) : '';
    const signature = createSignature(path, nonce, apiKey, secretKey, postData);

    const headers = {
        'Content-Type': 'application/json',
        'APIKey': apiKey,
        'Nonce': nonce,
        'Authent': signature
    };

    try {
        const response = await axios({
            method,
            url: `https://futures.kraken.com${endpoint}`,
            headers,
            data: method === 'POST' ? data : undefined,
            validateStatus: null
        });

        if (response.status !== 200) {
            throw new Error(`API returned status ${response.status}: ${JSON.stringify(response.data)}`);
        }

        if (response.data.error) {
            throw new Error(response.data.error);
        }

        return response.data;
    } catch (error) {
        console.error('Kraken API error:', {
            endpoint,
            status: error.response?.status,
            error: error.response?.data?.error || error.message
        });
        throw error;
    }
};

module.exports = {
    getNonce,
    createSignature,
    handleRateLimit,
    updateBackoff,
    handleKrakenError,
    krakenFuturesRequestOriginal,
    sleep
};
