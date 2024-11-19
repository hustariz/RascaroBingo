// controllers/riskManagementController.js
const User = require('../models/User');

exports.getRiskManagement = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.riskManagement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateRiskManagement = async (req, res) => {
  try {
    const { status, profitLoss } = req.body;
    console.log('Received update request:', { status, profitLoss }); // Debug log

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure profitLoss is a number
    const numericProfitLoss = Number(profitLoss);
    if (isNaN(numericProfitLoss)) {
      return res.status(400).json({ message: 'Invalid profit/loss value' });
    }

    console.log('Current account state:', {
      accountSize: user.riskManagement.accountSize,
      tradeStreak: user.riskManagement.tradeStreak,
      slTaken: user.riskManagement.slTaken
    }); // Debug log

    // Update trade streak and account size
    if (status === 'TARGET_HIT') {
      user.riskManagement.tradeStreak = Math.min(user.riskManagement.tradeStreak + 1, 2);
      user.riskManagement.slTaken = 0;
      user.riskManagement.accountSize = Number(user.riskManagement.accountSize) + numericProfitLoss;
      user.riskManagement.dailyStats.dailyProfit = Number(user.riskManagement.dailyStats.dailyProfit || 0) + numericProfitLoss;
    } else if (status === 'STOPLOSS_HIT') {
      user.riskManagement.tradeStreak = Math.max(user.riskManagement.tradeStreak - 1, -2);
      user.riskManagement.slTaken += 1;
      user.riskManagement.accountSize = Number(user.riskManagement.accountSize) + numericProfitLoss;
      user.riskManagement.dailyStats.dailyLoss = Number(user.riskManagement.dailyStats.dailyLoss || 0) + Math.abs(numericProfitLoss);
    }

    // Update daily stats
    const today = new Date().toDateString();
    const lastTradeDate = user.riskManagement.dailyStats.lastTradeDate?.toDateString();
    
    if (today !== lastTradeDate) {
      user.riskManagement.dailyStats = {
        lastTradeDate: new Date(),
        dailyTradeCount: 1,
        dailyLoss: status === 'STOPLOSS_HIT' ? Math.abs(numericProfitLoss) : 0,
        dailyProfit: status === 'TARGET_HIT' ? numericProfitLoss : 0
      };
    } else {
      user.riskManagement.dailyStats.dailyTradeCount += 1;
    }

    // Recalculate trade sizes
    const basePercentage = (user.riskManagement.baseTradeSize / user.riskManagement.accountSize) * 100;
    user.riskManagement.baseTradeSize = Math.round((user.riskManagement.accountSize * basePercentage) / 100);

    // Calculate adjusted trade size based on streak
    const multipliers = {
      '-2': 0.33,
      '-1': 0.5,
      '0': 1,
      '1': 1.5,
      '2': 2
    };
    user.riskManagement.adjustedTradeSize = Math.round(
      user.riskManagement.baseTradeSize * (multipliers[user.riskManagement.tradeStreak] || 1)
    );

    console.log('Updated account state:', {
      accountSize: user.riskManagement.accountSize,
      tradeStreak: user.riskManagement.tradeStreak,
      slTaken: user.riskManagement.slTaken,
      baseTradeSize: user.riskManagement.baseTradeSize,
      adjustedTradeSize: user.riskManagement.adjustedTradeSize
    }); // Debug log

    await user.save();
    res.json(user.riskManagement);
  } catch (error) {
    console.error('Error in updateRiskManagement:', error);
    res.status(500).json({ message: error.message });
  }
};
exports.updateSettings = async (req, res) => {
  try {
    const { accountSize, baseTradeSize } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.riskManagement.accountSize = Number(accountSize);
    user.riskManagement.baseTradeSize = Number(baseTradeSize);

    // Recalculate adjusted trade size
    const multipliers = {
      '-2': 0.33,
      '-1': 0.5,
      '0': 1,
      '1': 1.5,
      '2': 2
    };
    user.riskManagement.adjustedTradeSize = Math.round(
      user.riskManagement.baseTradeSize * (multipliers[user.riskManagement.tradeStreak] || 1)
    );

    await user.save();
    res.json(user.riskManagement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};