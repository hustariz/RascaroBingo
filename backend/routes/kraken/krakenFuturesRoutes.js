const express = require('express');
const router = express.Router();
const { handleKrakenError, krakenFuturesRequestOriginal } = require('./krakenUtils');

// Futures trading routes
router.get('/positions', async (req, res) => {
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

        // Transform orders to a consistent format
        const openOrders = result.openOrders.map(order => ({
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

router.post('/cancel-order', async (req, res) => {
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

module.exports = router;
