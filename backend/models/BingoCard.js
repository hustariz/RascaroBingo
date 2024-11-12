// models/BingoCard.js
const mongoose = require('mongoose');

const BingoCard = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true  // Each user can only have one card
  },
  bingoCells: [{
    id: {
      type: Number,
      required: true,
      min: 1,
      max: 20
    },
    title: {
      type: String,
      default: '',
      trim: true
    },
    points: {
      type: Number,
      default: 0,
      min: 0
    },
    selected: {
      type: Boolean,
      default: false
    }
  }],
  totalScore: {
    type: Number,
    default: 0,
    min: 0
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
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Pre-save middleware to calculate totalScore
BingoCard.pre('save', function(next) {
  // Calculate total score from selected cells
  this.totalScore = this.bingoCells.reduce((total, cell) => {
    return total + (cell.selected ? (cell.points || 0) : 0);
  }, 0);

  // Update RR checks based on total score
  this.rrChecks = {
    sixPoints: this.totalScore >= 6,
    twelvePoints: this.totalScore >= 12,
    eighteenPoints: this.totalScore >= 18
  };

  // Update lastModified
  this.lastModified = new Date();
  
  next();
});

// Method to initialize bingo cells if they don't exist
BingoCard.methods.initializeCells = function() {
  if (!this.bingoCells || this.bingoCells.length === 0) {
    this.bingoCells = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      title: '',
      points: 0,
      selected: false
    }));
  }
};

// Ensure bingoCells array always has 25 cells
BingoCard.path('bingoCells').validate(function(cells) {
  return cells.length === 20;
}, 'Bingo card must have exactly 25 cells');

module.exports = mongoose.model('BingoCard', BingoCard);