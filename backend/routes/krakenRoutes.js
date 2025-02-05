const express = require('express');
const router = express.Router();
const KrakenClient = require('kraken-api');
const axios = require('axios');
const crypto = require('crypto');
const path = require('path');
const querystring = require('querystring');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Initialize Kraken spot client with API credentials
const initKrakenSpotClient = () => {
    const apiKey = process.env.KRAKEN_SPOT_API_KEY;
    const apiSecret = process.env.KRAKEN_SPOT_API_SECRET;
    
    if (!apiKey || !apiSecret) {
        throw new Error('Kraken Spot API credentials not configured');
    }
    
    return new KrakenClient(apiKey, apiSecret);
};

// Kraken Futures API helper functions
const createSignature = (endpoint, nonce, apiKey, secretKey, postData = '') => {
    // Create the message string: postData + nonce + endpoint
    const message = `${postData}${nonce}${endpoint}`;
    
    console.log('Debug - Creating signature with:', {
        originalEndpoint: endpoint,
        messageLength: message.length,
        hasPostData: !!postData,
        message
    });

    // First create SHA256 hash of the message
    const messageHash = crypto.createHash('sha256').update(message).digest();

    // Then create HMAC-SHA512 using base64-decoded secret
    const decodedSecret = Buffer.from(secretKey, 'base64');
    const hmac = crypto.createHmac('sha512', decodedSecret);
    hmac.update(messageHash);
    const signature = hmac.digest('base64');

    console.log('Debug - Signature details:', {
        messageBytes: message.length,
        messageHashLength: messageHash.length,
        secretBytes: decodedSecret.length,
        signatureLength: signature.length,
        signaturePreview: signature.substring(0, 4) + '...' + signature.substring(signature.length - 4),
        message
    });

    return signature;
};

const krakenFuturesRequest = async (endpoint, method = 'GET', data = {}) => {
    const apiKey = process.env.KRAKEN_FUTURES_API_KEY;
    const secretKey = process.env.KRAKEN_FUTURES_API_SECRET;
    
    console.log('Debug - API Keys:', {
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey?.length,
        hasApiSecret: !!secretKey,
        apiSecretLength: secretKey?.length,
        apiKeyPreview: apiKey ? apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4) : null,
        apiSecretPreview: secretKey ? secretKey.substring(0, 4) + '...' + secretKey.substring(secretKey.length - 4) : null
    });

    if (!apiKey || !secretKey) {
        throw new Error('Kraken Futures API credentials not configured');
    }

    const nonce = Date.now().toString();
    const path = endpoint.replace('/derivatives', '');
    const postData = method === 'POST' ? JSON.stringify(data) : '';
    const signature = createSignature(path, nonce, apiKey, secretKey, postData);

    const headers = {
        'Content-Type': 'application/json',
        'APIKey': apiKey,
        'Nonce': nonce,
        'Authent': signature
    };

    console.log('Debug - Making request:', {
        method,
        url: `https://futures.kraken.com${endpoint}`,
        hasData: !!Object.keys(data).length,
        headers: {
            'Content-Type': headers['Content-Type'],
            APIKey: '***' + apiKey.slice(-4),
            Nonce: headers.Nonce,
            Authent: '***' + signature.slice(-4)
        },
        fullMessage: `${postData}${nonce}${path}`
    });

    try {
        const response = await axios({
            method,
            url: `https://futures.kraken.com${endpoint}`,
            headers,
            data: method === 'POST' ? data : undefined
        });

        console.log(`${endpoint.split('/').pop()} result:`, response.data);
        return response.data;
    } catch (error) {
        console.error('Kraken Futures API error:', {
            endpoint,
            error: error.response?.data || error.message,
            status: error.response?.status,
            headers: error.response?.headers
        });
        throw error;
    }
};

// Error handler middleware
const handleKrakenError = (err, res) => {
    console.error('Full Kraken API error:', JSON.stringify({
        message: err.message,
        name: err.name,
        code: err.code,
        response: err.response?.data || err.response,
        stack: err.stack
    }, null, 2));

    res.status(500).json({
        error: err.message,
        details: err.response?.data || err.response,
        code: err.code
    });
};

// Spot trading routes
router.get('/public/ticker', async (req, res) => {
    try {
        const kraken = initKrakenSpotClient();
        const pair = req.query.pair.replace('/', '');
        const result = await kraken.api('Ticker', { pair });
        res.json(result);
    } catch (err) {
        handleKrakenError(err, res);
    }
});

router.post('/balance', async (req, res) => {
    try {
        const kraken = initKrakenSpotClient();
        const result = await kraken.api('Balance');
        res.json(result);
    } catch (err) {
        handleKrakenError(err, res);
    }
});

router.post('/openOrders', async (req, res) => {
    try {
        const kraken = initKrakenSpotClient();
        console.log('Getting open orders...');
        const result = await kraken.api('OpenOrders');
        console.log('Open orders result:', result);
        res.json(result);
    } catch (err) {
        handleKrakenError(err, res);
    }
});

router.post('/addOrder', async (req, res) => {
    try {
        const kraken = initKrakenSpotClient();
        console.log('Adding order:', req.body);
        const result = await kraken.api('AddOrder', req.body);
        console.log('Add order result:', result);
        res.json(result);
    } catch (err) {
        handleKrakenError(err, res);
    }
});

router.post('/cancelOrder', async (req, res) => {
    try {
        const kraken = initKrakenSpotClient();
        console.log('Canceling order:', req.body.txid);
        const result = await kraken.api('CancelOrder', { txid: req.body.txid });
        console.log('Cancel order result:', result);
        res.json(result);
    } catch (err) {
        handleKrakenError(err, res);
    }
});

// Futures trading routes
router.get('/futures/positions', async (req, res) => {
    try {
        console.log('Getting futures positions...');
        const result = await krakenFuturesRequest('/derivatives/api/v3/openpositions', 'GET');
        res.json(result);
    } catch (err) {
        handleKrakenError(err, res);
    }
});

router.get('/futures/accounts', async (req, res) => {
    try {
        console.log('Getting futures account balance...');
        const result = await krakenFuturesRequest('/derivatives/api/v3/accounts', 'GET');
        res.json(result);
    } catch (err) {
        handleKrakenError(err, res);
    }
});

router.post('/futures/positions', async (req, res) => {
    try {
        console.log('Getting futures positions (POST)...');
        const result = await krakenFuturesRequest('/derivatives/api/v3/openpositions', 'GET');
        res.json(result);
    } catch (err) {
        handleKrakenError(err, res);
    }
});

router.post('/futures/balance', async (req, res) => {
    try {
        console.log('Getting futures account balance (POST)...');
        const result = await krakenFuturesRequest('/derivatives/api/v3/accounts', 'GET');
        res.json(result);
    } catch (err) {
        handleKrakenError(err, res);
    }
});

module.exports = router;
