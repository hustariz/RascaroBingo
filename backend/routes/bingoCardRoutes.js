// routes/bingoCardRoutes.js
const express = require('express');
const router = express.Router();
const BingoCard = require('../models/BingoCard');
const auth = require('../middleware/auth');

// Get user's bingo card
router.get('/card', auth, async (req, res) => {
  try {
    let card = await BingoCard.findOne({ userId: req.user.id });
    
    if (!card) {
      // Initialize new card with default structure
      card = new BingoCard({
        userId: req.user.id,
        bingoCells: Array.from({ length: 25 }, (_, i) => ({
          id: i + 1,
          title: '',
          points: 0,
          selected: false
        })),
        totalScore: 0,
        rrChecks: {
          sixPoints: false,
          twelvePoints: false,
          eighteenPoints: false
        }
      });
      await card.save();
    }
    
    res.json(card);
  } catch (error) {
    console.error('Error fetching bingo card:', error);
    res.status(500).send('Server Error');
  }
});

// Save or update bingo card
router.post('/card', auth, async (req, res) => {
  try {
    let card = await BingoCard.findOne({ userId: req.user.id });
    
    if (card) {
      // Update existing card
      card.bingoCells = req.body.cells;
      card.totalScore = req.body.totalScore || 0;
      card.rrChecks = {
        sixPoints: req.body.rrChecks?.sixPoints || false,
        twelvePoints: req.body.rrChecks?.twelvePoints || false,
        eighteenPoints: req.body.rrChecks?.eighteenPoints || false
      };
      card.lastModified = Date.now();
    } else {
      // Create new card
      card = new BingoCard({
        userId: req.user.id,
        bingoCells: req.body.cells,
        totalScore: req.body.totalScore || 0,
        rrChecks: req.body.rrChecks || {
          sixPoints: false,
          twelvePoints: false,
          eighteenPoints: false
        }
      });
    }

    await card.save();
    res.json(card);
  } catch (error) {
    console.error('Error saving bingo card:', error);
    res.status(500).send('Server Error');
  }
});

// Update single cell
router.patch('/card/cell/:index', auth, async (req, res) => {
  try {
    const { index } = req.params;
    const { cell } = req.body;
    
    let card = await BingoCard.findOne({ userId: req.user.id });
    
    if (!card) {
      return res.status(404).send('Card not found');
    }

    // Update specific cell
    card.bingoCells[index] = cell;
    card.lastModified = Date.now();
    
    // Recalculate total score
    card.totalScore = card.bingoCells.reduce((total, cell) => {
      return total + (cell.selected ? (cell.points || 0) : 0);
    }, 0);

    await card.save();
    res.json(card);
  } catch (error) {
    console.error('Error updating cell:', error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;