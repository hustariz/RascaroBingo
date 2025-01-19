// backend/models/Trade.js
const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pair: {
    type: String,
    required: true
  },
  isLong: {
    type: Boolean,
    required: true
  },
  entryPrice: {
    type: Number,
    required: true
  },
  exitPrice: {
    type: Number
  },
  stopLoss: {
    type: Number,
    required: true
  },
  takeProfit: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['OPEN', 'TARGET_HIT', 'STOPLOSS_HIT', 'CLOSED'],
    default: 'OPEN'
  },
  notes: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  },
  potentialProfit: {
    type: Number
  },
  potentialLoss: {
    type: Number
  },
  actualProfit: {
    type: Number
  },
  riskRewardRatio: {
    type: Number
  }
}, {
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      ret.user = ret.user.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Calculate R/R ratio before saving
tradeSchema.pre('save', function(next) {
  const risk = Math.abs(this.stopLoss - this.entryPrice);
  const reward = Math.abs(this.takeProfit - this.entryPrice);
  this.riskRewardRatio = risk > 0 ? reward / risk : 0;
  
  // Calculate actual profit if trade is closed
  if (this.exitPrice) {
    this.actualProfit = this.exitPrice - this.entryPrice;
    if (!this.isLong) {
      this.actualProfit = -this.actualProfit; // Invert for short positions
    }
  }
  
  next();
});

module.exports = mongoose.model('Trade', tradeSchema);