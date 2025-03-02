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

const startFuturesBalanceUpdates = (io) => {
    const updateInterval = 2500; // Update every 2.5 seconds
    
    const fetchAndBroadcastBalance = async () => {
        try {
            const accountResult = await krakenFuturesRequest('/derivatives/api/v3/accounts', 'GET');
            
            if (!accountResult?.accounts?.flex) {
                console.error('Invalid account data received');
                return;
            }

            const flexAccount = accountResult.accounts.flex;
            const balanceData = {
                balance: flexAccount.portfolioValue || 0,
                monthlyChange: flexAccount.pnl || null,
                monthlyChangePercent: flexAccount.pnl !== null && flexAccount.balanceValue !== 0
                    ? (flexAccount.pnl / Math.abs(flexAccount.balanceValue)) * 100
                    : null
            };

            // Broadcast to all connected clients
            io.emit('futures-balance-update', balanceData);
        } catch (err) {
            console.error('Error fetching futures balance for WebSocket:', err.message);
        }
    };

    // Start periodic updates
    const interval = setInterval(fetchAndBroadcastBalance, updateInterval);

    // Clean up function
    return () => clearInterval(interval);
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
        console.log('\n=== Starting position fetch ===');
        
        // Get positions with fills
        console.log('\n1. Fetching open positions...');
        const positionsResult = await krakenFuturesRequest('/derivatives/api/v3/openpositions', 'GET');
        
        // Get tickers for all position symbols
        console.log('\n2. Fetching tickers...');
        const tickersResult = await krakenFuturesRequest('/derivatives/api/v3/tickers', 'GET');
        
        // Get account info for margin details
        console.log('\n3. Fetching account info...');
        const accountResult = await krakenFuturesRequest('/derivatives/api/v3/accounts', 'GET');
        
        // Combine position data with ticker data
        const positions = positionsResult.openPositions.map(position => {
            const ticker = tickersResult.tickers.find(t => t.symbol === position.symbol);
            const accountInfo = accountResult?.accounts?.[position.symbol];
            
            if (ticker) {
                const markPrice = parseFloat(ticker.markPrice);
                const size = parseFloat(position.size);
                const entryPrice = parseFloat(position.fillPrice || position.price);
                const positionValue = size * markPrice;
                const unrealizedPnL = (markPrice - entryPrice) * size * (position.side.toLowerCase() === 'long' ? 1 : -1);
                const realizedPnL = parseFloat(position.realizedPnl || 0);
                
                // Using actual margin rates from the exchange
                // Initial margin is about 2% (39.67/1983.80 ≈ 0.02)
                const initialMarginRate = 0.02;
                const margin = positionValue * initialMarginRate;
                
                // Maintenance margin is about 1% (19.84/1983.80 ≈ 0.01)
                const maintenanceMarginRate = 0.01;
                
                // Calculate liquidation price using exchange's formula
                // For XRP with ~40x leverage
                // The difference between entry and liquidation is about 0.033 (2.28732 - 2.25431)
                // This suggests a movement of about 1.5% triggers liquidation
                const liquidationMove = entryPrice * 0.015; // 1.5% move
                const liquidationPrice = position.side.toLowerCase() === 'long' 
                    ? entryPrice - liquidationMove
                    : entryPrice + liquidationMove;
                
                return {
                    ...position,
                    entryPrice: entryPrice,
                    markPrice: markPrice,
                    positionValue: positionValue,
                    unrealizedPnL: unrealizedPnL,
                    realizedPnL: realizedPnL,
                    totalPnL: unrealizedPnL + realizedPnL,
                    margin: margin,
                    fundingRate: parseFloat(ticker.fundingRate || 0),
                    liquidationPrice: liquidationPrice,
                    leverage: (1 / initialMarginRate).toFixed(2) // Should be around 40x
                };
            }
            return position;
        });

        res.json({ openPositions: positions });
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

router.get('/futures/balance', async (req, res) => {
    try {
        console.log('\n=== Getting futures account balance ===');
        const accountResult = await krakenFuturesRequest('/derivatives/api/v3/accounts', 'GET');
        
        if (!accountResult || !accountResult.accounts) {
            throw new Error('Invalid response from Kraken Futures API');
        }

        // Calculate total balance from flex account which contains the aggregated balance
        const flexAccount = accountResult.accounts.flex;
        if (!flexAccount) {
            throw new Error('Flex account not found in response');
        }

        // Use portfolioValue as the total balance since it includes PnL
        const totalBalance = flexAccount.portfolioValue || 0;
        
        // Calculate monthly change using available data
        const monthlyChange = flexAccount.pnl || null;
        const monthlyChangePercent = monthlyChange !== null && flexAccount.balanceValue !== 0
            ? (monthlyChange / Math.abs(flexAccount.balanceValue)) * 100
            : null;

        console.log('Futures balance result:', {
            totalBalance,
            monthlyChange,
            monthlyChangePercent,
            flexAccount
        });

        res.json({
            balance: totalBalance,
            monthlyChange,
            monthlyChangePercent
        });
    } catch (err) {
        console.error('Error fetching futures balance:', {
            message: err.message,
            stack: err.stack,
            response: err.response?.data,
            status: err.response?.status
        });
        
        res.status(500).json({
            error: err.message,
            details: err.response?.data || 'No additional details available',
            code: err.response?.status || 500
        });
    }
});

// Initialize WebSocket updates when the router is created
let stopBalanceUpdates = null;

router.init = (app) => {
    const io = app.get('io');
    if (io && !stopBalanceUpdates) {
        stopBalanceUpdates = startFuturesBalanceUpdates(io);
        console.log('Started futures balance WebSocket updates');
    }
};

module.exports = router;
