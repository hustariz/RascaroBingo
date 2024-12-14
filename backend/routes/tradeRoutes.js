// routes/tradeRoutes.js
const express = require('express');
const router = express.Router();
const tradeController = require('../controllers/tradeController');
const auth = require('../middleware/auth');

// Protect all trade routes with auth middleware
router.post('/', auth, tradeController.createTrade);
router.get('/', auth, tradeController.getTrades);
router.put('/:id', auth, tradeController.updateTrade);
router.delete('/:id', auth, tradeController.deleteTrade);
router.patch('/:tradeId/status', auth, tradeController.updateTradeStatus);

module.exports = router;