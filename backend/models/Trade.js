// backend/models/Trade.js
const mongoose = require('mongoose');

const TradeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },    
  type: {
    type: String,
    required: true,
    enum: ['Long', 'Short']
  },
  stoploss: {
    type: Number,
    required: true
  },
  entry: {
    type: Number,
    required: true
  },
  target: {
    type: Number,
    required: true
  },
  riskReward: {
    type: Number,
    required: true
  },
  tradeIdea: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Open', 'Closed', 'Cancelled'],
    default: 'Open'
  }
});

module.exports = mongoose.model('Trade', TradeSchema);