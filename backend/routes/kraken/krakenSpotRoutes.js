const express = require('express');
const router = express.Router();
const KrakenClient = require('kraken-api');
const path = require('path');
const { handleKrakenError } = require('./krakenUtils');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

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

// Modified Kraken API request wrapper
const krakenApiRequest = async (kraken, method, params = {}) => {
    try {
        const result = await kraken.api(method, params);
        return result;
    } catch (error) {
        throw error;
    }
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

module.exports = router;
