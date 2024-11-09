// models/BingoCard.js
const mongoose = require('mongoose');

const BingoCard = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bingoCells: [{
    id: Number,
    title: {
      type: String,
      default: ''
    },
    points: {
      type: Number,
      default: 0
    },
    selected: {
      type: Boolean,
      default: false
    }
  }],
  totalScore: {
    type: Number,
    default: 0
  },
  rrChecks: {
    sixPoints: {
      type: Boolean,
      default: false
    },
    twelvePoints: {
      type: Boolean,
      default: false
    },
    eighteenPoints: {
      type: Boolean,
      default: false
    }
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('BingoCard', BingoCard);