const mongoose = require('mongoose');

const BingoCellSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  title: { type: String, default: '' },
  points: { type: Number, default: 0 },
  selected: { type: Boolean, default: false }
});

const BingoPageSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, default: 'Default Board' },
  bingoCells: [BingoCellSchema]
});

const BingoCardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bingoPages: [BingoPageSchema],
  currentPageIndex: { type: Number, default: 0 },
  lastModified: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Create indexes
BingoCardSchema.index({ userId: 1 });

// Methods
BingoCardSchema.methods.toJSON = function() {
  const obj = this.toObject();
  return {
    bingoPages: obj.bingoPages,
    currentPageIndex: obj.currentPageIndex,
    lastModified: obj.lastModified
  };
};

module.exports = mongoose.model('BingoCard', BingoCardSchema);
