// models/BingoCard.js
const mongoose = require('mongoose');

const BingoCellSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    min: 1,
    max: 25
  },
  title: {
    type: String,
    default: '',
    trim: true,
    maxlength: 100
  },
  points: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  selected: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const BingoPageSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    default: 'Default Board',
    trim: true,
    maxlength: 100
  },
  bingoCells: {
    type: [BingoCellSchema],
    validate: {
      validator: function(cells) {
        return !cells || cells.length === 0 || cells.length === 25;
      },
      message: 'Each bingo page must have exactly 25 cells'
    },
    default: () => Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      title: '',
      points: 0,
      selected: false
    }))
  }
}, { _id: false });

const BingoCardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // This ensures one card per user
  },
  bingoPages: {
    type: [BingoPageSchema],
    default: () => [{
      id: 1,
      name: 'Default Board',
      bingoCells: Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        title: '',
        points: 0,
        selected: false
      }))
    }]
  },
  currentPageIndex: {
    type: Number,
    default: 0,
    min: 0
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Ensure index on userId
BingoCardSchema.index({ userId: 1 }, { unique: true });

// Methods
BingoCardSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('BingoCard', BingoCardSchema);