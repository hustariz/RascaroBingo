// controllers/riskManagementController.js
const User = require('../models/User');

exports.updateRiskManagement = async (req, res) => {
  try {
    const { status } = req.body; // Remove tradeId since we don't use it
    const user = await User.findById(req.user.id);

    // Update trade streak based on outcome
    if (status === 'TARGET_HIT') {
      user.riskManagement.tradeStreak = Math.min(user.riskManagement.tradeStreak + 1, 2);
      user.riskManagement.slTaken = 0; // Reset SL counter on win
    } else if (status === 'STOPLOSS_HIT') {
      user.riskManagement.tradeStreak = Math.max(user.riskManagement.tradeStreak - 1, -2);
      user.riskManagement.slTaken += 1;
    }

    // Reset daily stats if it's a new day
    const today = new Date().toDateString();
    const lastTradeDate = user.riskManagement.dailyStats.lastTradeDate?.toDateString();
    
    if (today !== lastTradeDate) {
      user.riskManagement.dailyStats = {
        lastTradeDate: new Date(),
        dailyTradeCount: 1,
        dailyLoss: status === 'STOPLOSS_HIT' ? 1 : 0
      };
    } else {
      user.riskManagement.dailyStats.dailyTradeCount += 1;
      if (status === 'STOPLOSS_HIT') {
        user.riskManagement.dailyStats.dailyLoss += 1;
      }
    }

    await user.save();
    res.json(user.riskManagement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRiskManagement = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.riskManagement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};