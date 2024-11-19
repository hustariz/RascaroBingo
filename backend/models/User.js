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
    accountSize: {
      type: Number,
      default: 10000
    },
    tradeStreak: {
      type: Number,
      default: 0,
      min: -2,
      max: 2
    },
    slTaken: {
      type: Number,
      default: 0,
      min: 0,
      max: 3
    },
    dailyStats: {
      lastTradeDate: Date,
      dailyTradeCount: {
        type: Number,
        default: 0
      },
      dailyLoss: {
        type: Number,
        default: 0
      }
    },
    settings: {
      maxDailyLoss: {
        type: Number,
        default: 500
      },
      maxTradesPerDay: {
        type: Number,
        default: 3
      }
    }
  }
});

module.exports = mongoose.model('User', UserSchema);