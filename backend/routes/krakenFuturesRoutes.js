const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');

const FUTURES_API_URL = 'https://futures.kraken.com';
const FUTURES_API_V3_URL = 'https://futures.kraken.com/derivatives/api/v3';

// Initialize Kraken Futures client with API credentials
const createSignature = (endpoint, postData, nonce) => {
    const apiSecret = process.env.KRAKEN_FUTURES_API_SECRET;
    if (!apiSecret) {
        throw new Error('Kraken Futures API secret not configured');
    }

    // Use the full endpoint path for the signature, but URL encode it
    const endpointPath = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    const encodedPath = encodeURIComponent(endpointPath);
    
    // For POST requests, include the post data in the signature
    const message = postData ? 
        `${nonce}/${encodedPath}${JSON.stringify(postData)}` :
        `${nonce}/${encodedPath}`;

    console.log('Debug - Creating signature with:', {
        originalEndpoint: endpoint,
        endpointPath,
        encodedPath,
        messageLength: message.length,
        hasPostData: !!postData,
        message // Log the actual message for debugging
    });

    try {
        // The API secret might contain URL-safe base64 characters (including /)
        // We need to ensure it's properly handled
        const secretBuffer = Buffer.from(apiSecret, 'base64');
        
        // Create signature using sha256 and output as base64
        const signature = crypto
            .createHmac('sha256', secretBuffer)
            .update(message)
            .digest('base64');

        console.log('Debug - Signature details:', {
            messageBytes: Buffer.from(message).length,
            secretBytes: secretBuffer.length,
            signatureLength: signature.length,
            signaturePreview: `${signature.substring(0, 4)}...${signature.substring(signature.length - 4)}`,
            message // Log the full message for verification
        });

        return signature;
    } catch (error) {
        console.error('Error creating signature:', {
            error: error.message,
            secretLength: apiSecret.length,
            messageLength: message.length
        });
        throw error;
    }
};

const makeRequest = async (method, endpoint, data = null) => {
    const apiKey = process.env.KRAKEN_FUTURES_API_KEY;
    const apiSecret = process.env.KRAKEN_FUTURES_API_SECRET;
    
    console.log('Debug - API Keys:', {
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey?.length,
        hasApiSecret: !!apiSecret,
        apiSecretLength: apiSecret?.length,
        // Log first and last few characters of keys for verification
        apiKeyPreview: apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : null,
        apiSecretPreview: apiSecret ? `${apiSecret.substring(0, 4)}...${apiSecret.substring(apiSecret.length - 4)}` : null
    });

    if (!apiKey || !apiSecret) {
        throw new Error('Kraken Futures API credentials not configured');
    }

    const nonce = Date.now().toString();
    const signature = createSignature(endpoint, data, nonce);
    
    const headers = {
        'Content-Type': 'application/json',
        'APIKey': apiKey,
        'Nonce': nonce,
        'Authent': signature
    };

    const url = `${FUTURES_API_URL}${endpoint}`;
    
    console.log('Debug - Making request:', {
        method,
        url,
        hasData: !!data,
        headers: {
            ...headers,
            APIKey: '***' + apiKey.slice(-4),
            Authent: '***' + signature.slice(-4)
        },
        fullMessage: `${nonce}/${endpoint.startsWith('/') ? endpoint.substring(1) : endpoint}${data ? JSON.stringify(data) : ''}`
    });

    try {
        const response = await axios({
            method,
            url,
            headers,
            data
        });
        return response.data;
    } catch (error) {
        console.error('Kraken Futures API error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            headers: error.response?.headers,
            requestHeaders: {
                ...error.config?.headers,
                APIKey: '***' + apiKey.slice(-4),
                Authent: '***' + signature.slice(-4)
            }
        });
        throw error;
    }
};

// Get all open positions
router.get('/positions', async (req, res) => {
    try {
        const result = await makeRequest('GET', '/derivatives/api/v3/openpositions');
        console.log('Open positions result:', result);
        res.json(result);
    } catch (err) {
        res.status(500).json({
            error: err.message,
            details: err.response?.data
        });
    }
});

// Get futures ticker
router.get('/tickers', async (req, res) => {
    try {
        // Tickers endpoint doesn't require authentication
        const response = await axios.get(`${FUTURES_API_URL}/derivatives/api/v3/tickers`);
        console.log('Futures tickers result:', response.data);
        res.json(response.data);
    } catch (err) {
        res.status(500).json({
            error: err.message,
            details: err.response?.data
        });
    }
});

// Get account balances
router.get('/accounts', async (req, res) => {
    try {
        const result = await makeRequest('GET', '/derivatives/api/v3/accounts');
        console.log('Futures accounts result:', result);
        res.json(result);
    } catch (err) {
        res.status(500).json({
            error: err.message,
            details: err.response?.data
        });
    }
});

// Get open orders
router.get('/openorders', async (req, res) => {
    try {
        const result = await makeRequest('GET', '/derivatives/api/v3/openorders');
        console.log('Open orders result:', result);
        res.json(result);
    } catch (err) {
        res.status(500).json({
            error: err.message,
            details: err.response?.data
        });
    }
});

// Place a new order
router.post('/sendorder', async (req, res) => {
    try {
        const result = await makeRequest('POST', '/derivatives/api/v3/sendorder', req.body);
        console.log('Send order result:', result);
        res.json(result);
    } catch (err) {
        res.status(500).json({
            error: err.message,
            details: err.response?.data
        });
    }
});

// Cancel an order
router.post('/cancelorder', async (req, res) => {
    try {
        const result = await makeRequest('POST', '/derivatives/api/v3/cancelorder', {
            order_id: req.body.orderId
        });
        console.log('Cancel order result:', result);
        res.json(result);
    } catch (err) {
        res.status(500).json({
            error: err.message,
            details: err.response?.data
        });
    }
});

// Edit an order
router.post('/editorder', async (req, res) => {
    try {
        const result = await makeRequest('POST', '/derivatives/api/v3/editorder', req.body);
        console.log('Edit order result:', result);
        res.json(result);
    } catch (err) {
        res.status(500).json({
            error: err.message,
            details: err.response?.data
        });
    }
});

module.exports = router;
