// routes/tradeRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const tradeController = require('../controllers/tradeController');

// @route   POST /api/trades
// @desc    Create a new trade
// @access  Private
router.post('/', auth, tradeController.saveTrade);

// @route   GET /api/trades
// @desc    Get all trades for the user
// @access  Private
router.get('/', auth, tradeController.getTrades);

// @route   PUT /api/trades/:tradeId/status
// @desc    Update a trade's status
// @access  Private
router.put('/:tradeId/status', auth, tradeController.updateTradeStatus);

// @route   DELETE /api/trades/:tradeId
// @desc    Delete a trade
// @access  Private
router.delete('/:tradeId', auth, tradeController.deleteTrade);

module.exports = router;