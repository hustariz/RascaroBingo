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
        // Return test data in development
        if (process.env.NODE_ENV !== 'production') {
            console.log('Using test data for spot trading (no API credentials)');
            return null;
        }
        throw new Error('Kraken Spot API credentials not configured');
    }
    
    return new KrakenClient(apiKey, apiSecret);
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

// Nonce management
let lastNonce = Date.now();
const getNonce = () => {
    const now = Date.now();
    lastNonce = Math.max(now, lastNonce + 1);
    return lastNonce.toString();
};

// Helper function to generate nonce
function generateNonce() {
    return Date.now().toString();
}

// Helper function to make authenticated requests to Kraken Futures API
async function krakenFuturesRequest(endpoint, method = 'GET', data = {}) {
    try {
        // Add nonce to prevent duplicate requests
        const nonce = generateNonce();
        const requestData = {
            ...data,
            nonce: nonce
        };

        // Get API credentials
        const apiKey = process.env.KRAKEN_FUTURES_API_KEY;
        const apiSecret = process.env.KRAKEN_FUTURES_API_SECRET;

        if (!apiKey || !apiSecret) {
            throw new Error('Missing API credentials');
        }

        // Create signature
        const message = {
            ...requestData,
            nonce: nonce,
            endpoint: endpoint,
            method: method
        };
        
        const signature = crypto
            .createHmac('sha256', apiSecret)
            .update(JSON.stringify(message))
            .digest('base64');

        // Make the request
        const response = await axios({
            method: method,
            url: `https://futures.kraken.com${endpoint}`,
            headers: {
                'APIKey': apiKey,
                'Authent': signature,
                'Content-Type': 'application/json'
            },
            data: method !== 'GET' ? requestData : undefined,
            params: method === 'GET' ? requestData : undefined
        });

        return response.data;
    } catch (error) {
        console.error('Kraken Futures API error:', error.response?.data || error.message);
        throw error;
    }
}

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

// WebSocket update functions
const startFuturesTickersUpdates = (io) => {
    setInterval(async () => {
        try {
            const result = await krakenFuturesRequestOriginal('/derivatives/api/v3/tickers', 'GET');
            if (result && result.tickers) {
                io.emit('futures-tickers-update', result);
            }
        } catch (error) {
            // Only log non-nonce errors to reduce noise
            if (!error.message.includes('nonceDuplicate')) {
                console.error('Error fetching futures tickers:', error.message);
            }
        }
    }, 2000); // Reduced to every 2 seconds
};

const startFuturesPositionsUpdates = (io) => {
    setInterval(async () => {
        try {
            const result = await krakenFuturesRequestOriginal('/derivatives/api/v3/openpositions', 'GET');
            if (result && result.openPositions) {
                io.emit('futures-positions-update', result);
            }
        } catch (error) {
            if (!error.message.includes('nonceDuplicate')) {
                console.error('Error fetching futures positions:', error.message);
            }
        }
    }, 3000); // Every 3 seconds
};

const startFuturesBalanceUpdates = (io) => {
    setInterval(async () => {
        try {
            const result = await krakenFuturesRequestOriginal('/derivatives/api/v3/accounts', 'GET');
            if (result && result.accounts) {
                io.emit('futures-balance-update', result);
            }
        } catch (error) {
            if (!error.message.includes('nonceDuplicate')) {
                console.error('Error fetching futures balance:', error.message);
            }
        }
    }, 3000); // Every 3 seconds
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

// Spot trading routes
router.get('/public/ticker', async (req, res) => {
    try {
        const kraken = initKrakenSpotClient();
        if (!kraken) {
            // Return test data
            res.json({
                result: {
                    XXBTZUSD: {
                        c: ['92900.00', '1.23456789'],  
                        v: ['5460.00', '5460.00'],      
                        h: ['95000.00', '95000.00'],    
                        l: ['84500.00', '84500.00']     
                    }
                }
            });
            return;
        }
        const pair = req.query.pair.replace('/', '');
        const result = await krakenApiRequest(kraken, 'Ticker', { pair });
        res.json(result);
    } catch (err) {
        if (err.message?.includes('Rate limit exceeded')) {
            // Return current market test data on rate limit
            res.json({
                result: {
                    XXBTZUSD: {
                        c: ['92900.00', '1.23456789'],
                        v: ['5460.00', '5460.00'],
                        h: ['95000.00', '95000.00'],
                        l: ['84500.00', '84500.00']
                    }
                }
            });
            return;
        }
        handleKrakenError(err, res);
    }
});

router.post('/balance', async (req, res) => {
    try {
        const kraken = initKrakenSpotClient();
        if (!kraken) {
            // Return test data
            res.json({
                result: {
                    ZUSD: "1234.5678",
                    XXBT: "0.12345678",
                    XETH: "1.23456789",
                    XDOGE: "10000.00",
                    XXRP: "500.00",
                    XLTC: "5.5",
                    XADA: "1000.00",
                    XSOL: "20.00",
                    DOT: "100.00",
                    SHIB: "1000000.00"
                }
            });
            return;
        }
        
        const result = await krakenApiRequest(kraken, 'Balance');
        res.json(result);
    } catch (err) {
        handleKrakenError(err, res);
    }
});

router.post('/openOrders', async (req, res) => {
    try {
        const kraken = initKrakenSpotClient();
        if (!kraken) {
            // Return test data
            res.json({
                result: {
                    open: {
                        'OQCLML-LVRKG-D3QHH7': {
                            refid: null,
                            userref: 0,
                            status: 'open',
                            opentm: 1615987007.3521,
                            starttm: 0,
                            expiretm: 0,
                            descr: {
                                pair: 'XBTUSD',
                                type: 'buy',
                                ordertype: 'limit',
                                price: '44000.0',
                                price2: '0',
                                leverage: 'none',
                                order: 'buy 0.1000000 XBTUSD @ limit 44000.0'
                            },
                            vol: '0.1000000',
                            vol_exec: '0.0000000',
                            cost: '0.000',
                            fee: '0.000',
                            price: '0.000',
                            misc: '',
                            oflags: 'fciq'
                        }
                    }
                }
            });
            return;
        }
        const result = await krakenApiRequest(kraken, 'OpenOrders');
        res.json(result);
    } catch (err) {
        handleKrakenError(err, res);
    }
});

router.post('/addOrder', async (req, res) => {
    try {
        const kraken = initKrakenSpotClient();
        const result = await krakenApiRequest(kraken, 'AddOrder', req.body);
        res.json(result);
    } catch (err) {
        handleKrakenError(err, res);
    }
});

router.post('/cancelOrder', async (req, res) => {
    try {
        const kraken = initKrakenSpotClient();
        const result = await krakenApiRequest(kraken, 'CancelOrder', { txid: req.body.txid });
        res.json(result);
    } catch (err) {
        handleKrakenError(err, res);
    }
});

// Futures trading routes
router.get('/futures/positions', async (req, res) => {
    try {
        const result = await krakenFuturesRequestOriginal('/derivatives/api/v3/openpositions', 'GET');
        
        if (!result?.openPositions) {
            return res.json({ openPositions: [] });
        }

        // Get latest ticker data for all positions
        const tickerResult = await krakenFuturesRequestOriginal('/derivatives/api/v3/tickers', 'GET');
        
        // Transform positions data
        const positions = result.openPositions.map(pos => {
            const ticker = tickerResult?.tickers?.find(t => t.symbol === pos.symbol);
            const markPrice = ticker ? parseFloat(ticker.markPrice || 0) : 0;
            const size = parseFloat(pos.size || 0);
            const entryPrice = parseFloat(pos.price || 0);
            
            // Calculate position value (size * markPrice)
            const positionValue = size * markPrice;
            
            // Calculate unrealized PnL
            // For short positions: (entryPrice - markPrice) * size
            // For long positions: (markPrice - entryPrice) * size
            const unrealizedPnL = pos.side.toLowerCase() === 'short' 
                ? (entryPrice - markPrice) * size
                : (markPrice - entryPrice) * size;
            
            // Maintenance margin rate (from Kraken docs)
            const maintenanceMarginRate = 0.01; // 1%
            const initialMarginRate = 0.02; // 2%
            
            // Calculate initial margin (2% of position value)
            const initialMargin = positionValue * initialMarginRate;
            
            // Calculate maintenance margin (1% of position value)
            const maintenanceMargin = positionValue * maintenanceMarginRate;
            
            // Calculate liquidation price using Kraken's formula
            // For shorts: Entry Price * (1 + Initial Margin Rate + Maintenance Margin Rate)
            // For longs: Entry Price * (1 - Initial Margin Rate - Maintenance Margin Rate)
            const liquidationPrice = pos.side.toLowerCase() === 'short'
                ? entryPrice * (1 + initialMarginRate + maintenanceMarginRate)
                : entryPrice * (1 - initialMarginRate - maintenanceMarginRate);
            
            return {
                symbol: pos.symbol,
                side: pos.side,
                size: size,
                entryPrice: entryPrice,
                markPrice: markPrice,
                positionValue: positionValue,
                unrealizedPnL: unrealizedPnL,
                realizedPnL: parseFloat(pos.realizedPnl || 0),
                totalPnL: unrealizedPnL + parseFloat(pos.realizedPnl || 0),
                margin: initialMargin,
                liquidationPrice: liquidationPrice,
                fundingRate: parseFloat(pos.fundingRate || 0) || parseFloat(ticker?.fundingRate || 0)
            };
        });

        res.json({ openPositions: positions });
    } catch (err) {
        console.error('Error fetching futures positions:', err);
        handleKrakenError(err, res);
    }
});

router.get('/futures/orders', async (req, res) => {
    try {
        const result = await krakenFuturesRequestOriginal('/derivatives/api/v3/openorders', 'GET');
        
        // If in development mode and no API credentials, return test data
        if (!process.env.KRAKEN_FUTURES_API_KEY && process.env.NODE_ENV !== 'production') {
            return res.json({
                openOrders: [{
                    orderId: 'test-order-1',
                    symbol: 'PI_XBTUSD',
                    side: 'buy',
                    orderType: 'lmt',
                    limitPrice: 50000,
                    size: 1,
                    filled: 0,
                    receivedTime: new Date().toISOString(),
                    status: 'open',
                    reduceOnly: false
                }]
            });
        }

        if (!result || !result.openOrders) {
            return res.json({ openOrders: [] });
        }

        // Log raw orders for debugging
        console.error('Raw orders from API:', result.openOrders);

        // Transform orders to a consistent format
        const openOrders = result.openOrders.map(order => {
            // Extract the base order info
            const transformedOrder = {
                orderId: order.order_id || order.orderId,
                symbol: order.symbol || order.instrument,
                side: order.side?.toLowerCase(),
                orderType: order.type || order.orderType,
                limitPrice: parseFloat(order.limitPrice || order.price || 0),
                stopPrice: parseFloat(order.stopPrice || 0),
                size: parseFloat(order.size || order.unfilledSize || order.quantity || 0),
                filled: parseFloat(order.filled || 0),
                receivedTime: order.receivedTime || order.timestamp,
                status: order.status?.toLowerCase() || 'open',
                reduceOnly: !!order.reduceOnly
            };

            // Log the order transformation for debugging
            console.error('Order transformation:', {
                original: order,
                transformed: transformedOrder
            });

            return transformedOrder;
        });

        res.json({ openOrders });
    } catch (error) {
        console.error('Error fetching futures orders:', error);
        res.status(500).json({
            error: 'Failed to fetch orders',
            details: error.message
        });
    }
});

router.get('/futures/accounts', async (req, res) => {
    try {
        const result = await krakenFuturesRequestOriginal('/derivatives/api/v3/accounts', 'GET');
        res.json(result);
    } catch (err) {
        handleKrakenError(err, res);
    }
});

router.post('/futures/positions', async (req, res) => {
    try {
        const result = await krakenFuturesRequestOriginal('/derivatives/api/v3/openpositions', 'GET');
        if (!result || !result.openPositions || process.env.NODE_ENV !== 'production') {
            res.json({
                openPositions: [{
                    symbol: 'PI_XBTUSD',
                    side: 'long',
                    size: 1.5,
                    price: 92500.5,
                    markPrice: 92900.0,
                    positionValue: 138900.0,
                    unrealizedPnL: 599.25,
                    realizedPnL: 0,
                    margin: 4625.025,
                    liquidationPrice: 88375.475,
                    fundingRate: 0.0001
                }]
            });
            return;
        }

        // Get latest ticker data for all positions
        const tickerResult = await krakenFuturesRequestOriginal('/derivatives/api/v3/tickers', 'GET');
        
        // Transform positions data
        const positions = result.openPositions.map(pos => {
            const ticker = tickerResult?.tickers?.find(t => t.symbol === pos.symbol);
            const markPrice = ticker ? parseFloat(ticker.markPrice || 0) : 0;
            const size = parseFloat(pos.size || 0);
            const entryPrice = parseFloat(pos.price || 0);
            
            // Calculate position value (size * markPrice)
            const positionValue = size * markPrice;
            
            // Calculate unrealized PnL
            // For short positions: (entryPrice - markPrice) * size
            // For long positions: (markPrice - entryPrice) * size
            const unrealizedPnL = pos.side.toLowerCase() === 'short' 
                ? (entryPrice - markPrice) * size
                : (markPrice - entryPrice) * size;
            
            // Maintenance margin rate (from Kraken docs)
            const maintenanceMarginRate = 0.01; // 1%
            const initialMarginRate = 0.02; // 2%
            
            // Calculate initial margin (2% of position value)
            const initialMargin = positionValue * initialMarginRate;
            
            // Calculate maintenance margin (1% of position value)
            const maintenanceMargin = positionValue * maintenanceMarginRate;
            
            // Calculate liquidation price using Kraken's formula
            // For shorts: Entry Price * (1 + Initial Margin Rate + Maintenance Margin Rate)
            // For longs: Entry Price * (1 - Initial Margin Rate - Maintenance Margin Rate)
            const liquidationPrice = pos.side.toLowerCase() === 'short'
                ? entryPrice * (1 + initialMarginRate + maintenanceMarginRate)
                : entryPrice * (1 - initialMarginRate - maintenanceMarginRate);
            
            return {
                symbol: pos.symbol,
                side: pos.side,
                size: size,
                entryPrice: entryPrice,
                markPrice: markPrice,
                positionValue: positionValue,
                unrealizedPnL: unrealizedPnL,
                realizedPnL: parseFloat(pos.realizedPnl || 0),
                totalPnL: unrealizedPnL + parseFloat(pos.realizedPnl || 0),
                margin: initialMargin,
                liquidationPrice: liquidationPrice,
                fundingRate: parseFloat(pos.fundingRate || 0) || parseFloat(ticker?.fundingRate || 0)
            };
        });

        res.json({ openPositions: positions });
    } catch (err) {
        console.error('Error fetching futures positions:', err);
        // Return test data on error
        res.json({
            openPositions: [{
                symbol: 'PI_XBTUSD',
                side: 'long',
                size: 1.5,
                price: 92500.5,
                markPrice: 92900.0,
                positionValue: 138900.0,
                unrealizedPnL: 599.25,
                realizedPnL: 0,
                margin: 4625.025,
                liquidationPrice: 88375.475,
                fundingRate: 0.0001
            }]
        });
    }
});

router.post('/futures/balance', async (req, res) => {
    try {
        const result = await krakenFuturesRequestOriginal('/derivatives/api/v3/accounts', 'GET');
        res.json(result);
    } catch (err) {
        handleKrakenError(err, res);
    }
});

router.get('/futures/balance', async (req, res) => {
    try {
        const accountResult = await krakenFuturesRequestOriginal('/derivatives/api/v3/accounts', 'GET');
        
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

// Add futures tickers endpoint
router.get('/futures/tickers', async (req, res) => {
    try {
        const result = await krakenFuturesRequestOriginal('/derivatives/api/v3/tickers', 'GET');
        if (!result || !result.tickers) {
            // Return test data if API call fails
            res.json({
                tickers: [{
                    symbol: 'PI_XRPUSD',
                    markPrice: '0.5123',
                    last: '0.5120',
                    change24h: '2.5',
                    vol24h: '1000000',
                    fundingRate: '0.0001'
                }]
            });
            return;
        }
        res.json(result);
    } catch (err) {
        // Return test data on error
        res.json({
            tickers: [{
                symbol: 'PI_XRPUSD',
                markPrice: '0.5123',
                last: '0.5120',
                change24h: '2.5',
                vol24h: '1000000',
                fundingRate: '0.0001'
            }]
        });
    }
});

// Futures trade endpoint
router.post('/futures/trade', async (req, res) => {
    try {
        const { symbol, side, size, price, stopLoss, takeProfit } = req.body;
        
        if (!symbol || !side || !size || !price) {
            return res.status(400).json({
                error: 'Missing required parameters. Need symbol, side, size, and price.'
            });
        }

        // Format the main limit order
        const orderData = {
            orderType: 'lmt',
            symbol: symbol,
            side: side.toLowerCase(),
            size: parseFloat(size),
            limitPrice: parseFloat(price)
        };

        try {
            // Send the main order
            const result = await krakenFuturesRequestOriginal('/derivatives/api/v3/sendorder', 'POST', orderData);

            // If stop loss is specified, send it as a separate order
            if (stopLoss && result.orderId) {
                const stopLossOrder = {
                    orderType: 'stp',
                    symbol: symbol,
                    side: side.toLowerCase() === 'buy' ? 'sell' : 'buy',
                    size: parseFloat(size),
                    stopPrice: parseFloat(stopLoss),
                    triggerSignal: 'mark',
                    reduceOnly: true
                };
                await krakenFuturesRequestOriginal('/derivatives/api/v3/sendorder', 'POST', stopLossOrder);
            }

            // If take profit is specified, send it as a separate order
            if (takeProfit && result.orderId) {
                const takeProfitOrder = {
                    orderType: 'take_profit',
                    symbol: symbol,
                    side: side.toLowerCase() === 'buy' ? 'sell' : 'buy',
                    size: parseFloat(size),
                    stopPrice: parseFloat(takeProfit),
                    triggerSignal: 'mark',
                    reduceOnly: true
                };
                await krakenFuturesRequestOriginal('/derivatives/api/v3/sendorder', 'POST', takeProfitOrder);
            }

            res.json(result);
        } catch (err) {
            console.error('Trade error:', err.message);
            res.status(500).json({
                error: 'Failed to place trade',
                details: err.response?.data?.error || err.message
            });
        }
    } catch (err) {
        console.error('Trade error:', err.message);
        res.status(500).json({
            error: 'Failed to place trade',
            details: err.response?.data?.error || err.message
        });
    }
});

// Cancel futures order endpoint
router.post('/futures/cancel-order', async (req, res) => {
    try {
        const { orderId, symbol } = req.body;
        
        if (!orderId || !symbol) {
            return res.status(400).json({
                error: 'Missing required parameters',
                details: 'Both orderId and symbol are required to cancel an order'
            });
        }

        // First, get the order details to get the side
        const ordersResult = await krakenFuturesRequestOriginal('/derivatives/api/v3/openorders', 'GET');
        const order = ordersResult?.openOrders?.find(o => o.order_id === orderId);
        
        if (!order) {
            return res.json({
                success: true,
                message: 'Order is already cancelled or expired',
                orderId: orderId
            });
        }

        // Try to cancel the order using the original request function
        const result = await krakenFuturesRequestOriginal('/derivatives/api/v3/cancelorder', 'POST', {
            order_id: orderId,
            cliOrdId: orderId,
            symbol: symbol
        });
        
        // Log the cancel request and response for debugging
        console.error('Cancel order request/response:', {
            request: { orderId, symbol },
            response: result
        });

        // Check for API-level errors
        if (!result || result.error) {
            throw new Error(result?.error || 'Failed to send cancel request');
        }

        // Check the status
        if (result.status === 'error' || result.result === 'error') {
            // If the error is that the order doesn't exist, consider it a success
            if (result.message?.includes('not found') || 
                result.message?.includes('does not exist')) {
                return res.json({
                    success: true,
                    message: 'Order is already cancelled or expired',
                    orderId: orderId,
                    details: result
                });
            }
            // Otherwise it's a real error
            throw new Error(result.message || 'Failed to cancel order');
        }
        
        res.json({
            success: true,
            message: 'Order cancellation request sent successfully',
            orderId: orderId,
            details: result
        });
    } catch (err) {
        console.error('Cancel order error details:', {
            orderId: req.body.orderId,
            symbol: req.body.symbol,
            error: err.message,
            response: err.response?.data,
            stack: err.stack
        });
        
        // Don't treat "not found" errors as real errors
        if (err.message?.includes('not found') || err.message?.includes('does not exist')) {
            return res.json({
                success: true,
                message: 'Order is already cancelled or expired',
                orderId: req.body.orderId,
                details: { status: 'not_found', message: err.message }
            });
        }
        
        res.status(500).json({
            error: 'Failed to cancel order',
            details: err.response?.data?.error || err.message,
            code: err.response?.status || 500,
            orderId: req.body.orderId
        });
    }
});

// Initialize all WebSocket updates
const init = (app) => {
    const io = app.get('io');
    if (!io) {
        console.error('Socket.IO not initialized');
        return;
    }

    // Start all update services
    startFuturesTickersUpdates(io);
    startFuturesPositionsUpdates(io);
    startFuturesBalanceUpdates(io);
};

router.init = init;
module.exports = router;
