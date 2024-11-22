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
    if (isNaN(numericProfitLoss)) {
      return res.status(400).json({ message: 'Invalid profit/loss value' });
    }

    // Update trade streak and account size
    if (status === 'TARGET_HIT') {
      // Step up through percentage levels
      let newPercentage;
      if (user.riskManagement.currentPercentage <= 3.33) newPercentage = 6.67;
      else if (user.riskManagement.currentPercentage <= 6.67) newPercentage = 10;
      else if (user.riskManagement.currentPercentage <= 10) newPercentage = 15;
      else if (user.riskManagement.currentPercentage <= 15) newPercentage = 20;
      else newPercentage = 20;

      user.riskManagement.currentPercentage = newPercentage;
      user.riskManagement.tradeStreak = Math.min(user.riskManagement.tradeStreak + 1, 2);
      user.riskManagement.accountSize += numericProfitLoss;
      user.riskManagement.dailyStats.dailyProfit += numericProfitLoss;
    } else if (status === 'STOPLOSS_HIT') {
      // Step down through percentage levels
      let newPercentage;
      if (user.riskManagement.currentPercentage >= 20) newPercentage = 15;
      else if (user.riskManagement.currentPercentage >= 15) newPercentage = 10;
      else if (user.riskManagement.currentPercentage >= 10) newPercentage = 6.67;
      else if (user.riskManagement.currentPercentage >= 6.67) newPercentage = 3.33;
      else newPercentage = 3.33;

      user.riskManagement.currentPercentage = newPercentage;
      user.riskManagement.tradeStreak = Math.max(user.riskManagement.tradeStreak - 1, -2);
      user.riskManagement.slTaken += 1;
      user.riskManagement.accountSize += numericProfitLoss;
      user.riskManagement.dailyStats.dailyLoss += Math.abs(numericProfitLoss);
    }

    // Calculate new trade size based on current percentage
    user.riskManagement.baseTradeSize = Math.round((user.riskManagement.accountSize * user.riskManagement.currentPercentage) / 100);
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