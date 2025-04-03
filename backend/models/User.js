const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
  subscription: {
    active: { type: Boolean, default: false },
    plan: { type: String, enum: ['quick', 'monthly', 'quarterly', 'annual'], default: null },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    paymentId: { type: String, default: null },
    history: [{
      plan: String,
      startDate: Date,
      endDate: Date,
      paymentId: String
    }]
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isEmailVerified: {
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
  bingoCard: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BingoCard'
  },
  tradeHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trade'
  }],
  riskManagement: {
    accountSize: { type: Number, default: 10000 },
    baseTradeSize: { type: Number, default: 1000 },
    adjustedTradeSize: { type: Number, default: 1000 },
    currentPercentage: { type: Number, default: 10 }, 
    tradeStreak: { type: Number, default: 0, min: -3 },
    slTaken: { type: Number, default: 0, min: 0, max: 3 },
    dailyStats: {
      lastTradeDate: Date,
      trades: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      dailyProfit: { type: Number, default: 0 },
      dailyLoss: { type: Number, default: 0 }
    },
    totalStats: {
      trades: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      totalGain: { type: Number, default: 0 }, // Total profit/loss in currency
      totalRisk: { type: Number, default: 0 }, // Total risk taken
      totalReward: { type: Number, default: 0 }, // Total reward gained
      averageRR: { type: Number, default: 0 } // Average risk/reward ratio
    }
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  resetPasswordToken: {
    type: String,
    index: true // Add index for faster queries
  },
  resetPasswordExpires: Date
}, {
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      if (ret.bingoCard) ret.bingoCard = ret.bingoCard.toString();
      if (ret.tradeHistory) {
        ret.tradeHistory = ret.tradeHistory.map(t => t.toString());
      }
      delete ret.password;
      delete ret.refreshTokens;
      delete ret._id;
      delete ret.__v;
      delete ret.emailVerificationToken;
      delete ret.emailVerificationExpires;
      delete ret.resetPasswordToken;
      delete ret.resetPasswordExpires;
      return ret;
    }
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual for calculating winrate
UserSchema.virtual('winrate').get(function() {
  const totalTrades = this.riskManagement.totalStats.trades;
  if (totalTrades === 0) return 0;
  return this.riskManagement.totalStats.wins / totalTrades;
});

// Add methods to handle bingo card
UserSchema.methods.getBingoCard = async function() {
  await this.populate('bingoCard');
  return this.bingoCard;
};

UserSchema.methods.setBingoCard = async function(bingoCard) {
  this.bingoCard = bingoCard._id;
  await this.save();
};

// Add method to check if subscription is active
UserSchema.methods.hasActiveSubscription = function() {
  if (!this.subscription.active) return false;
  return this.subscription.endDate > new Date();
};

// Add method to get remaining subscription time in days
UserSchema.methods.getRemainingSubscriptionDays = function() {
  if (!this.hasActiveSubscription()) return 0;
  
  const now = new Date();
  const endDate = new Date(this.subscription.endDate);
  const diffTime = Math.abs(endDate - now);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

// Add method to extend subscription
UserSchema.methods.extendSubscription = async function(planType, paymentId) {
  const now = new Date();
  let daysToAdd = 0;
  
  // Set days based on plan type
  switch(planType) {
    case 'quick':
      daysToAdd = 10;
      break;
    case 'monthly':
      daysToAdd = 30;
      break;
    case 'quarterly':
      daysToAdd = 90;
      break;
    case 'annual':
      daysToAdd = 365;
      break;
    default:
      throw new Error('Invalid plan type');
  }
  
  // Calculate new end date
  let startDate = now;
  let newEndDate = new Date(now);
  
  // If user has an active subscription, extend from current end date
  if (this.hasActiveSubscription()) {
    newEndDate = new Date(this.subscription.endDate);
    startDate = this.subscription.endDate;
  }
  
  newEndDate.setDate(newEndDate.getDate() + daysToAdd);
  
  // Save subscription history
  if (this.subscription.active) {
    this.subscription.history.push({
      plan: this.subscription.plan,
      startDate: this.subscription.startDate,
      endDate: this.subscription.endDate,
      paymentId: this.subscription.paymentId
    });
  }
  
  // Update current subscription
  this.subscription.active = true;
  this.subscription.plan = planType;
  this.subscription.startDate = startDate;
  this.subscription.endDate = newEndDate;
  this.subscription.paymentId = paymentId;
  this.isPaidUser = true;
  
  await this.save();
  return this;
};

module.exports = mongoose.model('User', UserSchema);