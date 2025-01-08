const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const bingoController = require('../controllers/bingoController');

// Get user's bingo card
router.get('/card', auth, bingoController.getCard);

// Update entire bingo card
router.post('/card', auth, bingoController.updateCard);

// Update specific cell
router.put('/cell', auth, bingoController.updateCell);

// Error handling middleware
router.use((err, req, res, next) => {
  console.error(' Bingo route error:', err);
  res.status(500).json({
    success: false,
    message: 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = router;
