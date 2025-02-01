const express = require('express');
const router = express.Router();
const KrakenClient = require('kraken-api');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Initialize Kraken client with API credentials
const initKrakenClient = () => {
    const apiKey = process.env.KRAKEN_SPOT_API_KEY;
    const apiSecret = process.env.KRAKEN_SPOT_API_SECRET;
    
    // Debug logging
    console.log('Kraken Environment check:', {
        hasApiKey: !!apiKey,
        hasApiSecret: !!apiSecret,
        apiKeyLength: apiKey?.length,
        apiSecretLength: apiSecret?.length,
        envKeys: Object.keys(process.env).filter(key => key.includes('KRAKEN'))
    });
    
    if (!apiKey || !apiSecret) {
        throw new Error('Kraken Spot API credentials not configured');
    }
    
    return new KrakenClient(apiKey, apiSecret);
};

// Error handler middleware
const handleKrakenError = (err, res) => {
    console.error('Full Kraken API error:', JSON.stringify({
        message: err.message,
        name: err.name,
        code: err.code,
        response: err.response,
        stack: err.stack
    }, null, 2));

    res.status(500).json({
        error: err.message,
        details: err.response?.data || err.response,
        code: err.code
    });
};

// Public endpoints
router.get('/public/ticker', async (req, res) => {
    try {
        const kraken = initKrakenClient();
        const pair = req.query.pair.replace('/', ''); // Convert XBT/USD to XBTUSD
        console.log('Getting ticker for pair:', pair);
        const result = await kraken.api('Ticker', { pair });
        console.log('Ticker result:', result);
        res.json(result);
    } catch (err) {
        handleKrakenError(err, res);
    }
});

// Private endpoints (require authentication)
router.post('/balance', async (req, res) => {
    try {
        const kraken = initKrakenClient();
        console.log('Getting balance...');
        const result = await kraken.api('Balance');
        console.log('Balance result:', result);
        res.json(result);
    } catch (err) {
        handleKrakenError(err, res);
    }
});

router.post('/openOrders', async (req, res) => {
    try {
        const kraken = initKrakenClient();
        console.log('Getting open orders...');
        const result = await kraken.api('OpenOrders');
        console.log('Open orders result:', result);
        res.json(result);
    } catch (err) {
        handleKrakenError(err, res);
    }
});

router.post('/closedOrders', async (req, res) => {
    try {
        const kraken = initKrakenClient();
        console.log('Getting closed orders...');
        const result = await kraken.api('ClosedOrders');
        console.log('Closed orders result:', result);
        res.json(result);
    } catch (err) {
        handleKrakenError(err, res);
    }
});

router.post('/addOrder', async (req, res) => {
    try {
        const kraken = initKrakenClient();
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
        const kraken = initKrakenClient();
        console.log('Canceling order:', req.body.txid);
        const result = await kraken.api('CancelOrder', { txid: req.body.txid });
        console.log('Cancel order result:', result);
        res.json(result);
    } catch (err) {
        handleKrakenError(err, res);
    }
});

module.exports = router;
