const crypto = require('crypto');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Nonce management - match Python's time.time() * 1000
const getNonce = () => {
    return Math.floor(Date.now()).toString();
};

// Custom URL encode to match Python implementation
const customUrlEncode = (params) => {
    // First, ensure dates are in the correct format
    const processedParams = Object.fromEntries(
        Object.entries(params).map(([key, value]) => {
            if (key === 'processBefore') {
                // Format: YYYY-MM-ddTHH:mm:ss.SSSZ
                const date = new Date(value);
                return [key, date.toISOString()];
            }
            return [key, value];
        })
    );

    return Object.entries(processedParams)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => {
            if (Array.isArray(value)) {
                return value.map(item => `${key}=${encodeURIComponent(item)}`).join('&');
            }
            return `${key}=${encodeURIComponent(value)}`;
        })
        .join('&');
};

// Kraken Futures API helper functions
const createSignature = (endpoint, nonce, apiKey, secretKey, data = {}) => {
    // Remove /derivatives and ensure endpoint starts with /
    const cleanEndpoint = endpoint.replace('/derivatives', '');
    const signaturePath = cleanEndpoint.startsWith('/') ? cleanEndpoint : '/' + cleanEndpoint;
    
    // Create message in exact order: data + nonce + path (matching Python)
    const encodedParams = customUrlEncode(data);
    const message = encodedParams + nonce + signaturePath;
    console.log('Creating signature with message:', message);
    
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
        rateLimitState.backoffTime[endpoint] = rateLimitState.minInterval;
    } else {
        const currentBackoff = rateLimitState.backoffTime[endpoint] || rateLimitState.minInterval;
        rateLimitState.backoffTime[endpoint] = Math.min(currentBackoff * 2, rateLimitState.maxBackoff);
    }
};

// Kraken Futures API request function
const krakenFuturesRequestOriginal = async (endpoint, method = 'GET', data = {}) => {
    const apiKey = process.env.KRAKEN_FUTURES_API_KEY;
    const secretKey = process.env.KRAKEN_FUTURES_API_SECRET;
    
    if (!apiKey || !secretKey) {
        throw new Error('Kraken Futures API credentials not configured');
    }

    const nonce = getNonce();
    
    // Add processBefore for POST requests (30 seconds from now)
    if (method === 'POST' && !data.processBefore) {
        const processBeforeDate = new Date(Date.now() + 30000);
        data.processBefore = processBeforeDate.toISOString();
    }
    
    // Create signature with the raw data object
    const signature = createSignature(endpoint, nonce, apiKey, secretKey, data);

    // Headers exactly as in the Python example
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'APIKey': apiKey,
        'Nonce': nonce,
        'Authent': signature
    };

    try {
        await handleRateLimit(endpoint);

        const url = `https://futures.kraken.com${endpoint}`;
        console.log(`Making Kraken API request to: ${url}`);
        console.log('Request data:', data);
        
        const requestConfig = {
            method,
            url,
            headers,
            maxBodyLength: Infinity,
            validateStatus: null
        };

        if (method === 'POST') {
            requestConfig.data = data;
        }

        console.log('Request config:', {
            ...requestConfig,
            headers: {
                ...requestConfig.headers,
                APIKey: '[REDACTED]',
                Authent: '[REDACTED]'
            }
        });

        const response = await axios(requestConfig);

        // Log the full response for debugging
        console.log('Response:', {
            status: response.status,
            data: response.data,
            headers: response.headers
        });

        if (response.status !== 200) {
            console.error('API Error Response:', response.data);
            throw new Error(`API returned status ${response.status}: ${JSON.stringify(response.data)}`);
        }

        if (response.data.error) {
            throw new Error(response.data.error);
        }

        updateBackoff(endpoint, true);
        return response.data;
    } catch (error) {
        updateBackoff(endpoint, false);
        console.error('Full error details:', error);
        throw error;
    }
};

module.exports = {
    krakenFuturesRequestOriginal
};
