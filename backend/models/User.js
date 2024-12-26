const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  isPaidUser: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  refreshTokens: [{
    token: String,
    expiresAt: Date,
    lastUsed: Date
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  riskManagement: {
    accountSize: { type: Number, default: 10000 },
    baseTradeSize: { type: Number, default: 1000 },
    adjustedTradeSize: { type: Number, default: 1000 },
    currentPercentage: { type: Number, default: 10 }, 
    tradeStreak: { type: Number, default: 0, min: -3, max: 3 },
    slTaken: { type: Number, default: 0, min: 0, max: 3 },
    dailyStats: {
      lastTradeDate: Date,
      dailyTradeCount: { type: Number, default: 0 },
      dailyProfit: { type: Number, default: 0 }, 
      dailyLoss: { type: Number, default: 0 }
    }
  }
});

module.exports = mongoose.model('User', UserSchema);