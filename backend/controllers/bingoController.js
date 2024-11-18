// controllers/bingoController.js
const BingoCard = require('../models/BingoCard');

exports.getCard = async (req, res) => {
  try {
    console.log('Getting card for user:', req.user.id);
    let card = await BingoCard.findOne({ userId: req.user.id });
    
    if (!card) {
      console.log('Creating new card for user:', req.user.id);
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
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.updateCard = async (req, res) => {
  try {
    const { bingoCells, totalScore, rrChecks } = req.body;

    if (!bingoCells || !Array.isArray(bingoCells) || bingoCells.length !== 25) {
      return res.status(400).json({ message: 'Invalid bingo cells data' });
    }

    let card = await BingoCard.findOne({ userId: req.user.id });
    
    if (card) {
      card.bingoCells = bingoCells;
      card.totalScore = totalScore || 0;
      card.rrChecks = {
        sixPoints: rrChecks?.sixPoints || false,
        twelvePoints: rrChecks?.twelvePoints || false,
        eighteenPoints: rrChecks?.eighteenPoints || false
      };
      card.lastModified = new Date();
    } else {
      card = new BingoCard({
        userId: req.user.id,
        bingoCells,
        totalScore: totalScore || 0,
        rrChecks: rrChecks || {
          sixPoints: false,
          twelvePoints: false,
          eighteenPoints: false
        }
      });
    }

    card.totalScore = card.bingoCells.reduce((total, cell) => {
      return total + (cell.selected ? (cell.points || 0) : 0);
    }, 0);

    card.rrChecks = {
      sixPoints: card.totalScore >= 6,
      twelvePoints: card.totalScore >= 12,
      eighteenPoints: card.totalScore >= 18
    };

    await card.save();
    res.json(card);
  } catch (error) {
    console.error('Error saving bingo card:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.updateCell = async (req, res) => {
  try {
    const { index } = req.params;
    const { cell } = req.body;
    
    if (!cell || typeof cell !== 'object') {
      return res.status(400).json({ message: 'Invalid cell data' });
    }

    if (index < 0 || index >= 25) {
      return res.status(400).json({ message: 'Invalid cell index' });
    }
    
    let card = await BingoCard.findOne({ userId: req.user.id });
    
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    card.bingoCells[index] = {
      ...card.bingoCells[index],
      ...cell,
      id: index + 1
    };
    
    card.totalScore = card.bingoCells.reduce((total, cell) => {
      return total + (cell.selected ? (cell.points || 0) : 0);
    }, 0);

    card.rrChecks = {
      sixPoints: card.totalScore >= 6,
      twelvePoints: card.totalScore >= 12,
      eighteenPoints: card.totalScore >= 18
    };

    card.lastModified = new Date();
    await card.save();
    
    res.json(card);
  } catch (error) {
    console.error('Error updating cell:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};