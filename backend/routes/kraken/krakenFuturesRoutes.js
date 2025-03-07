const express = require('express');
const router = express.Router();
const { handleKrakenError, krakenFuturesRequestOriginal } = require('./krakenUtils');
const crypto = require('crypto');

// Custom request logger that only shows relevant data
const logRequest = (req) => {
    const { method, originalUrl } = req;
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${method} ${originalUrl}`);
    
    if (req.body && Object.keys(req.body).length > 0) {
        const { password, authorization, ...safeBody } = req.body;
        console.log('Request data:', safeBody);
    }
};

// Futures trading routes
router.get('/positions', async (req, res) => {
    try {
        logRequest(req);

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
            const unrealizedPnL = pos.side.toLowerCase() === 'short' 
                ? (entryPrice - markPrice) * size
                : (markPrice - entryPrice) * size;
            
            const maintenanceMarginRate = 0.01; // 1%
            const initialMarginRate = 0.02; // 2%
            
            // Calculate initial margin (2% of position value)
            const initialMargin = positionValue * initialMarginRate;
            
            // Calculate liquidation price
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

router.get('/orders', async (req, res) => {
    try {
        logRequest(req);

        const result = await krakenFuturesRequestOriginal('/derivatives/api/v3/openorders', 'GET');
        
        // If in development mode and no API credentials, return test data
        if (!process.env.KRAKEN_FUTURES_API_KEY && process.env.NODE_ENV !== 'production') {
            return res.json({
                openOrders: [{
                    orderId: 'test-order-1',
                    order_id: 'test-order-1',
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

        // Transform orders to a consistent format
        const openOrders = result.openOrders.map(order => ({
            orderId: order.order_id || order.orderId,
            order_id: order.order_id || order.orderId, // Include client order ID
            cliOrdId: order.cliOrdId, // Include client order ID
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
        }));

        res.json({ openOrders });
    } catch (error) {
        console.error('Error fetching futures orders:', error);
        res.status(500).json({
            error: 'Failed to fetch orders',
            details: error.message
        });
    }
});

router.get('/balance', async (req, res) => {
    try {
        logRequest(req);

        const accountResult = await krakenFuturesRequestOriginal('/derivatives/api/v3/accounts', 'GET');
        
        if (!accountResult || !accountResult.accounts) {
            throw new Error('Invalid response from Kraken Futures API');
        }

        // Calculate total balance from flex account
        const flexAccount = accountResult.accounts.flex;
        if (!flexAccount) {
            throw new Error('Flex account not found in response');
        }

        const totalBalance = flexAccount.portfolioValue || 0;
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

router.get('/tickers', async (req, res) => {
    try {
        logRequest(req);

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

router.post('/trade', async (req, res) => {
    try {
        logRequest(req);

        const { symbol, side, size, price, stopLoss, takeProfit } = req.body;
        
        if (!symbol || !side || !size || !price) {
            return res.status(400).json({
                error: 'Missing required parameters. Need symbol, side, size, and price.'
            });
        }

        // Generate a unique client order ID
        const cliOrdId = `RB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Format the main limit order
        const orderData = {
            orderType: 'lmt',
            symbol: symbol,
            side: side.toLowerCase(),
            size: parseFloat(size),
            limitPrice: parseFloat(price),
            cliOrdId: cliOrdId
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
                    reduceOnly: true,
                    cliOrdId: `${cliOrdId}_sl` // Add _sl suffix for stop loss
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
                    limitPrice: parseFloat(takeProfit),
                    triggerSignal: 'mark',
                    reduceOnly: true,
                    cliOrdId: `${cliOrdId}_tp` // Add _tp suffix for take profit
                };
                await krakenFuturesRequestOriginal('/derivatives/api/v3/sendorder', 'POST', takeProfitOrder);
            }

            res.json(result);
        } catch (err) {
            throw err;
        }
    } catch (err) {
        console.error('Error placing trade:', err.message);
        res.status(500).json({
            error: 'Failed to place trade',
            details: err.response?.data?.error || err.message
        });
    }
});

router.post('/cancel-order', async (req, res) => {
    try {
        const { order_id, symbol } = req.body;
        
        if (!order_id || !symbol) {
            return res.status(400).json({
                error: 'Missing required parameters',
                details: 'order_id and symbol are required to cancel an order'
            });
        }

        // Generate a unique client order ID
        const cliOrdId = `cancel-${order_id}-${Date.now()}`;

        // Set processBefore to 1 minute from now in Kraken's expected format
        const now = new Date(Date.now() + 60000);
        const processBefore = now.toISOString()
            .replace('T', ' ')
            .replace('Z', '+00:00')
            .replace(/\.\d{3}/, '.000000');

        // Create request data with required fields in exact order
        const requestData = {
            processBefore,
            order_id: order_id.toString(),
            cliOrdId,
            symbol
        };

        console.log('Sending cancel order request:', requestData);
        
        const result = await krakenFuturesRequestOriginal('/derivatives/api/v3/cancelorder', 'POST', requestData);
        
        if (!result || result.error) {
            throw new Error(result?.error || 'Failed to cancel order');
        }

        res.json({
            success: true,
            message: 'Order cancelled successfully',
            orderId: order_id,
            result
        });
    } catch (err) {
        console.error('Error cancelling order:', err.message);
        res.status(500).json({
            error: 'Failed to cancel order',
            details: err.response?.data?.error || err.message
        });
    }
});

module.exports = router;
