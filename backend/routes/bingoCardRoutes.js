// routes/bingoCardRoutes.js
const express = require('express');
const router = express.Router();
const bingoController = require('../controllers/bingoController');
const auth = require('../middleware/auth');

// Get user's bingo card
router.get('/card', auth, bingoController.getCard);

// Save or update bingo card
router.post('/card', auth, bingoController.updateCard);

// Update single cell
router.patch('/card/cell/:index', auth, bingoController.updateCell);

// Add error handling middleware
router.use((err, req, res) => {
  console.error('🚨 Bingo route error:', {
    path: req.path,
    method: req.method,
    error: err.message
  });
  res.status(500).json({ message: 'Server Error', error: err.message });
});
module.exports = router;