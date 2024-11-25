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
    const user = await User.findById(req.user.id);
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    const numericProfitLoss = Number(profitLoss);
    // Update account size first
    user.riskManagement.accountSize += numericProfitLoss;

    if (status === 'TARGET_HIT') {
      // Simple 20% increase in trade size
      user.riskManagement.baseTradeSize = Math.round(user.riskManagement.baseTradeSize * 1.2);
      user.riskManagement.tradeStreak = Math.min(user.riskManagement.tradeStreak + 1, 3);
      user.riskManagement.dailyStats.dailyProfit += numericProfitLoss;
    } else if (status === 'STOPLOSS_HIT') {
      // Simple 20% decrease in trade size
      user.riskManagement.baseTradeSize = Math.round(user.riskManagement.baseTradeSize * 0.8);
      user.riskManagement.tradeStreak = Math.max(user.riskManagement.tradeStreak - 1, -3);
      user.riskManagement.slTaken += 1;
      user.riskManagement.dailyStats.dailyLoss += Math.abs(numericProfitLoss);
    }

    // Calculate and store current percentage
    user.riskManagement.currentPercentage = (user.riskManagement.baseTradeSize / user.riskManagement.accountSize) * 100;
    user.riskManagement.adjustedTradeSize = user.riskManagement.baseTradeSize;

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

// In riskManagementController.js
exports.resetStopLoss = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('❌ Reset SL failed: User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('🔄 Attempting to reset SL count for user:', {
      userId: user._id,
      currentSL: user.riskManagement.slTaken,
      currentPercentage: user.riskManagement.currentPercentage
    });

    // Update the document directly
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { 'riskManagement.slTaken': 0 },
      { new: true }
    );

    if (!updatedUser) {
      console.log('❌ Reset SL failed: Update failed');
      return res.status(404).json({ message: 'Failed to update user' });
    }

    console.log('✅ SL count reset successful:', {
      userId: updatedUser._id,
      newSLCount: updatedUser.riskManagement.slTaken,
      percentage: updatedUser.riskManagement.currentPercentage
    });

    res.json(updatedUser.riskManagement);
  } catch (error) {
    console.error('❌ Error resetting SL count:', error);
    res.status(500).json({ message: error.message });
  }
};