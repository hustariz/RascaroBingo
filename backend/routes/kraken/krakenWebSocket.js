const { krakenFuturesRequestOriginal } = require('./krakenUtils');

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

module.exports = {
    init,
    startFuturesTickersUpdates,
    startFuturesPositionsUpdates,
    startFuturesBalanceUpdates
};
