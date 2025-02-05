const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const WebSocket = require('ws');

const FUTURES_API_URL = 'https://futures.kraken.com';
const FUTURES_WS_URL = 'wss://futures.kraken.com/ws/v1';

// Store WebSocket connections by user
const wsConnections = new Map();

// Initialize Kraken Futures client with API credentials
const createSignature = (endpoint, postData, nonce) => {
    // For signature generation, we need to remove /api/v3 prefix
    const signatureEndpoint = endpoint.replace('/api/v3', '');
    
    console.log('Debug - Creating signature with:', {
        originalEndpoint: endpoint,
        signatureEndpoint,
        messageLength: signatureEndpoint.length,
        hasPostData: !!postData,
        message: `${nonce}${signatureEndpoint}${postData ? JSON.stringify(postData) : ''}`
    });

    try {
        const message = `${nonce}${signatureEndpoint}${postData ? JSON.stringify(postData) : ''}`;
        const secret = Buffer.from(process.env.KRAKEN_FUTURES_API_SECRET, 'base64');
        const hash = crypto.createHash('sha256')
            .update(message)
            .digest();
        const hmac = crypto.createHmac('sha512', secret)
            .update(hash)
            .digest('base64');

        console.log('Debug - Signature details:', {
            messageBytes: Buffer.byteLength(message),
            messageHashLength: hash.length,
            secretBytes: secret.length,
            signatureLength: hmac.length,
            signaturePreview: `${hmac.substring(0, 4)}...${hmac.substring(hmac.length - 4)}`,
            message
        });

        return hmac;
    } catch (error) {
        console.error('Error creating signature:', error);
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

    // Remove /api/v3 from the endpoint for the actual request
    const requestEndpoint = endpoint.replace('/api/v3', '');
    const url = `${FUTURES_API_URL}/derivatives/api/v3${requestEndpoint}`;
    
    console.log(`\nDebug - Making request to ${endpoint}:`, {
        method,
        url,
        endpoint,
        requestEndpoint,
        hasData: !!data,
        headers: {
            ...headers,
            APIKey: '***' + apiKey.slice(-4),
            Authent: '***' + signature.slice(-4)
        },
        fullMessage: `${nonce}${requestEndpoint}${data ? JSON.stringify(data) : ''}`
    });

    try {
        const response = await axios({
            method,
            url,
            headers,
            data
        });
        console.log(`\nDebug - Response from ${endpoint}:`, {
            status: response.status,
            statusText: response.statusText,
            data: response.data,
            headers: response.headers
        });
        return response.data;
    } catch (error) {
        console.error(`\nKraken Futures API error for ${endpoint}:`, {
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

// WebSocket connection management
const setupWebSocket = (userId, symbols) => {
    if (wsConnections.has(userId)) {
        console.log(`WebSocket connection already exists for user ${userId}`);
        return wsConnections.get(userId);
    }

    console.log(`Creating new WebSocket connection for user ${userId}`);
    const ws = new WebSocket(FUTURES_WS_URL);

    ws.on('open', () => {
        console.log(`WebSocket connected for user ${userId}`);
        
        // Subscribe to user data feed
        const subscribeMsg = {
            event: 'subscribe',
            feed: 'user_data',
            api_key: process.env.KRAKEN_FUTURES_API_KEY
        };
        ws.send(JSON.stringify(subscribeMsg));

        // Also subscribe to ticker feed for real-time price updates
        const tickerSubscribeMsg = {
            event: 'subscribe',
            feed: 'ticker',
            product_ids: symbols // This will be the array of position symbols
        };
        ws.send(JSON.stringify(tickerSubscribeMsg));

        // Setup ping interval to keep connection alive
        const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ event: 'ping' }));
            }
        }, 30000); // Send ping every 30 seconds

        ws.pingInterval = pingInterval;
    });

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            console.log(`WebSocket message for user ${userId}:`, message);

            // Get the Socket.IO instance and connections
            const io = req.app.get('io');
            const socketConnections = req.app.get('socketConnections');
            const socket = socketConnections.get(userId);

            if (!socket) {
                console.warn(`No socket connection found for user ${userId}`);
                return;
            }

            // Handle different message types
            if (message.feed === 'user_data') {
                // Forward position updates to the frontend
                socket.emit('position_update', message);
            } else if (message.feed === 'ticker') {
                // Forward price updates to the frontend
                socket.emit('price_update', message);
            }
        } catch (error) {
            console.error(`Error processing WebSocket message for user ${userId}:`, error);
        }
    });

    ws.on('close', () => {
        console.log(`WebSocket closed for user ${userId}`);
        clearInterval(ws.pingInterval);
        wsConnections.delete(userId);
    });

    ws.on('error', (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
    });

    wsConnections.set(userId, ws);
    return ws;
};

// Cleanup WebSocket connections
const cleanupWebSocket = (userId) => {
    const ws = wsConnections.get(userId);
    if (ws) {
        clearInterval(ws.pingInterval);
        ws.close();
        wsConnections.delete(userId);
        console.log(`Cleaned up WebSocket connection for user ${userId}`);
    }
};

// Get orderbook data
router.get('/orderbook', async (req, res) => {
    try {
        const symbol = req.query.symbol;
        if (!symbol) {
            return res.status(400).json({ error: 'Symbol is required' });
        }

        const result = await makeRequest('GET', `/api/v3/orderbook?symbol=${symbol}`);
        res.json(result);
    } catch (err) {
        console.error('Error fetching orderbook:', err);
        res.status(500).json({
            error: err.message,
            details: err.response?.data
        });
    }
});

// Get all open positions with real-time updates
router.get('/positions', async (req, res) => {
    try {
        console.log('\n=== Starting position fetch ===');
        
        // Get positions with fills
        console.log('\n1. Fetching open positions...');
        const positionsResult = await makeRequest('GET', '/api/v3/openpositions');
        console.log('\n1. Raw positions response:', JSON.stringify(positionsResult, null, 2));
        
        if (!positionsResult.openPositions || !Array.isArray(positionsResult.openPositions)) {
            console.warn('No open positions found');
            return res.json(positionsResult);
        }

        let accountResult = null;
        let tickersResult = null;

        try {
            // Get account data for PnL
            console.log('\n2. Fetching account data...');
            accountResult = await makeRequest('GET', '/api/v3/accounts');
            if (!accountResult || !accountResult.accounts) {
                throw new Error('Invalid account data response');
            }
            console.log('\n2. Raw account response:', JSON.stringify(accountResult, null, 2));
        } catch (accountErr) {
            console.error('\nError fetching account data:', accountErr);
        }

        try {
            // Get tickers for all symbols at once
            const symbols = positionsResult.openPositions.map(p => p.symbol).join(',');
            console.log(`\n3. Fetching tickers for symbols: ${symbols}`);
            
            tickersResult = await makeRequest('GET', `/api/v3/tickers?symbol=${symbols}`);
            console.log('\n3.1 Raw tickers response:', JSON.stringify(tickersResult, null, 2));
            
            if (!tickersResult?.tickers) {
                console.error('Invalid tickers response:', tickersResult);
                throw new Error('Invalid tickers response');
            }

            // Create a map of tickers by symbol for easier lookup
            const tickerMap = {};
            tickersResult.tickers.forEach(ticker => {
                tickerMap[ticker.symbol] = ticker;
                console.log(`Ticker for ${ticker.symbol}:`, {
                    markPrice: ticker.markPrice,
                    indexPrice: ticker.indexPrice,
                    fundingRate: ticker.fundingRate
                });
            });

            // Enhance positions with ticker data
            const enhancedPositions = positionsResult.openPositions.map(position => {
                const ticker = tickerMap[position.symbol] || {};
                console.log(`Processing position for ${position.symbol}:`, {
                    positionData: position,
                    tickerData: ticker
                });

                // Parse values with fallbacks
                const size = parseFloat(position.size) || 0;
                const entryPrice = parseFloat(position.price) || 0;
                const markPrice = parseFloat(ticker.markPrice) || entryPrice;
                const indexPrice = parseFloat(ticker.indexPrice) || markPrice;
                const fundingRate = parseFloat(ticker.fundingRate) || 0;
                const positionValue = size * markPrice;

                // Calculate PnL based on position side
                const unrealizedPnL = position.side.toLowerCase() === 'long'
                    ? (markPrice - entryPrice) * size
                    : (entryPrice - markPrice) * size;

                // Get account position data for this symbol
                const accountPositionData = accountResult?.accounts?.[0]?.positions?.find(
                    p => p.symbol === position.symbol
                ) || {};

                console.log(`Enhanced calculations for ${position.symbol}:`, {
                    size,
                    entryPrice,
                    markPrice,
                    indexPrice,
                    positionValue,
                    unrealizedPnL,
                    accountPositionData
                });

                return {
                    ...position,
                    markPrice,
                    indexPrice,
                    fundingRate,
                    positionValue: positionValue || 0,
                    unrealizedPnL: unrealizedPnL + (parseFloat(position.unrealizedFunding) || 0),
                    realizedPnL: parseFloat(accountPositionData?.realizedPnl) || 0,
                    totalPnL: unrealizedPnL + (parseFloat(accountPositionData?.realizedPnl) || 0),
                    margin: parseFloat(accountPositionData?.margin) || 0,
                    marginRatio: parseFloat(accountPositionData?.marginRatio) || 0,
                    liquidationPrice: parseFloat(accountPositionData?.liquidationPrice) || 0
                };
            });

            // Update the response with enhanced positions
            positionsResult.openPositions = enhancedPositions;
            
        } catch (tickersErr) {
            console.error('\nError processing tickers:', tickersErr);
            // Don't throw here, return positions without ticker data
        }
            
        // Process each position
        console.log('\n4. Processing positions...');
        // const enhancedPositions = [];
        
        // for (const position of positionsResult.openPositions) {
        //     try {
        //         console.log(`\n4.1 Processing position for ${position.symbol}:`);
        //         console.log('Original position:', JSON.stringify(position, null, 2));
                
        //         // Find ticker for this symbol
        //         const ticker = tickersResult?.tickers?.find(t => t.symbol === position.symbol);
        //         if (!ticker) {
        //             console.warn(`No ticker found for ${position.symbol}`);
        //             enhancedPositions.push(position);
        //             continue;
        //         }
        //         console.log('4.2 Found ticker:', JSON.stringify(ticker, null, 2));
                
        //         // Find account data for this position
        //         console.log('4.3 Looking for account data...');
        //         const accountPosition = accountResult?.accounts?.find(account => 
        //             account.positions?.some(pos => pos.symbol === position.symbol)
        //         );
        //         const accountPositionData = accountPosition?.positions?.find(pos => 
        //             pos.symbol === position.symbol
        //         );
        //         console.log('4.4 Account position data:', JSON.stringify(accountPositionData, null, 2));
                
        //         // Calculate position metrics
        //         const size = parseFloat(position.size) || 0;
        //         const entryPrice = parseFloat(position.price) || 0;
        //         const markPrice = parseFloat(ticker?.markPrice) || entryPrice;
        //         const indexPrice = parseFloat(ticker?.indexPrice) || markPrice;
        //         const fundingRate = parseFloat(ticker?.fundingRate) || 0;
        //         const positionValue = size * markPrice;
                
        //         console.log('Position calculation debug:', {
        //             symbol: position.symbol,
        //             rawSize: position.size,
        //             rawPrice: position.price,
        //             rawMarkPrice: ticker?.markPrice,
        //             parsedSize: size,
        //             parsedEntryPrice: entryPrice,
        //             parsedMarkPrice: markPrice,
        //             side: position.side
        //         });

        //         const unrealizedPnL = position.side.toLowerCase() === 'long'
        //             ? (markPrice - entryPrice) * size
        //             : (entryPrice - markPrice) * size;
                
        //         console.log('PnL calculation debug:', {
        //             unrealizedPnL,
        //             markPrice,
        //             entryPrice,
        //             size,
        //             side: position.side,
        //             calculation: position.side.toLowerCase() === 'long' 
        //                 ? `(${markPrice} - ${entryPrice}) * ${size}`
        //                 : `(${entryPrice} - ${markPrice}) * ${size}`
        //         });

        //         const enhancedPosition = {
        //             ...position,
        //             markPrice,
        //             indexPrice,
        //             fundingRate,
        //             positionValue: positionValue || 0,
        //             unrealizedPnL: unrealizedPnL + (parseFloat(position.unrealizedFunding) || 0),
        //             realizedPnL: parseFloat(accountPositionData?.realizedPnl) || 0,
        //             totalPnL: unrealizedPnL + (parseFloat(accountPositionData?.realizedPnl) || 0),
        //             margin: parseFloat(accountPositionData?.margin) || 0,
        //             marginRatio: parseFloat(accountPositionData?.marginRatio) || 0,
        //             liquidationPrice: parseFloat(accountPositionData?.liquidationPrice) || 0
        //         };
                
        //         console.log('4.6 Enhanced position:', JSON.stringify(enhancedPosition, null, 2));
        //         enhancedPositions.push(enhancedPosition);
        //     } catch (error) {
        //         console.error(`Error processing position ${position.symbol}:`, error);
        //         enhancedPositions.push({
        //             ...position,
        //             error: error.message
        //         });
        //     }
        // }
        
        // Replace the positions array with enhanced positions
        // positionsResult.openPositions = enhancedPositions;

        // Setup WebSocket connection for real-time updates
        // Note: In a real application, you'd want to get the userId from the authenticated session
        const userId = 'default';
        const symbols = positionsResult.openPositions.map(p => p.symbol);
        setupWebSocket(userId, symbols);

        console.log('\n=== Final response ===');
        console.log(JSON.stringify(positionsResult, null, 2));
        res.json(positionsResult);
    } catch (err) {
        console.error('Error fetching positions:', err);
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
        const response = await axios.get(`${FUTURES_API_URL}/api/v3/tickers?contractType=futures_vanilla,futures_inverse`);
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
        const result = await makeRequest('GET', '/api/v3/accounts');
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
        const result = await makeRequest('GET', '/api/v3/openorders');
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
        const result = await makeRequest('POST', '/api/v3/sendorder', req.body);
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
        const result = await makeRequest('POST', '/api/v3/cancelorder', {
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
        const result = await makeRequest('POST', '/api/v3/editorder', req.body);
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
