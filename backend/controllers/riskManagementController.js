// controllers/riskManagementController.js
const User = require('../models/User');

exports.getRiskManagement = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'User not found'
      });
    }

    // Reset daily stats if it's a new day
    const today = new Date();
    const lastTradeDate = user.riskManagement.dailyStats?.lastTradeDate ? new Date(user.riskManagement.dailyStats.lastTradeDate) : null;
    
    if (!lastTradeDate || lastTradeDate.getDate() !== today.getDate()) {
      user.riskManagement.dailyStats = {
        lastTradeDate: today,
        trades: 0,
        wins: 0,
        losses: 0,
        dailyProfit: 0,
        dailyLoss: 0
      };
      await user.save();
    }

    const netPL = (user.riskManagement.dailyStats?.dailyProfit || 0) - (user.riskManagement.dailyStats?.dailyLoss || 0);
    console.log(' [RISK] Daily stats:', {
      ...user.riskManagement.dailyStats,
      netPL
    });

    res.json({
      success: true,
      dailyStats: {
        ...user.riskManagement.dailyStats,
        netPL
      },
      totalStats: user.riskManagement.totalStats,
      accountSize: user.riskManagement.accountSize,
      settings: user.riskManagement.settings,
      slTaken: user.riskManagement.slTaken,
      tradeStreak: user.riskManagement.tradeStreak,
      baseTradeSize: user.riskManagement.baseTradeSize,
      currentPercentage: user.riskManagement.currentPercentage
    });
  } catch (error) {
    console.error(' [RISK] Error getting risk management:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
};

exports.updateRiskManagement = async (req, res) => {
  try {
    const { status, profitLoss } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize risk management if it doesn't exist
    if (!user.riskManagement) {
      user.riskManagement = {
        accountSize: 10000,
        baseTradeSize: 1000,
        currentPercentage: 10,
        tradeStreak: 0,
        slTaken: 0,
        dailyStats: {
          lastTradeDate: new Date(),
          trades: 0,
          wins: 0,
          losses: 0,
          dailyProfit: 0,
          dailyLoss: 0
        },
        totalStats: {
          trades: 0,
          wins: 0,
          losses: 0,
          totalGain: 0,
          totalRisk: 0,
          totalReward: 0,
          averageRR: 0
        }
      };
    }

    // Handle null profitLoss - use a default value based on trade size
    const numericProfitLoss = profitLoss !== null ? Number(profitLoss) : 
      (status === 'TARGET_HIT' ? user.riskManagement.baseTradeSize * 0.02 : -user.riskManagement.baseTradeSize * 0.01);
    
    // Check if it's a new day
    const today = new Date();
    const lastTradeDate = user.riskManagement.dailyStats?.lastTradeDate ? new Date(user.riskManagement.dailyStats.lastTradeDate) : null;
    const isNewDay = !lastTradeDate || 
      lastTradeDate.getFullYear() !== today.getFullYear() ||
      lastTradeDate.getMonth() !== today.getMonth() ||
      lastTradeDate.getDate() !== today.getDate();

    // Reset daily stats if it's a new day
    if (isNewDay) {
      console.log('New day detected, resetting daily stats');
      user.riskManagement.dailyStats = {
        lastTradeDate: today,
        trades: 1,  // Start at 1 for the current trade
        wins: status === 'TARGET_HIT' ? 1 : 0,
        losses: status === 'STOPLOSS_HIT' ? 1 : 0,
        dailyProfit: status === 'TARGET_HIT' ? numericProfitLoss : 0,
        dailyLoss: status === 'STOPLOSS_HIT' ? -numericProfitLoss : 0
      };
      // On a new day, start fresh with SL counter
      user.riskManagement.slTaken = 0; // Always reset to 0 on new day
    } else {
      // Update existing daily stats
      user.riskManagement.dailyStats.lastTradeDate = today;
      user.riskManagement.dailyStats.trades++;
      
      if (status === 'TARGET_HIT') {
        user.riskManagement.dailyStats.wins++;
        user.riskManagement.dailyStats.dailyProfit += numericProfitLoss;
      } else if (status === 'STOPLOSS_HIT') {
        user.riskManagement.dailyStats.losses++;
        user.riskManagement.dailyStats.dailyLoss += -numericProfitLoss;
      }
    }

    // Check if we've hit the daily SL limit before processing
    if (status === 'STOPLOSS_HIT') {
      const currentSL = user.riskManagement.slTaken || 0;
      if (currentSL >= 3) {
        console.log('❌ Daily SL limit reached:', currentSL);
        return res.status(400).json({
          success: false,
          msg: 'Daily stoploss limit reached (3/3)',
          error: 'Cannot take more than 3 stoplosses per day'
        });
      }
      // Increment SL counter by 1 after the check
      user.riskManagement.slTaken = currentSL + 1;
    }

    // Handle streak and trade size changes
    if (status === 'TARGET_HIT') {
      user.riskManagement.totalStats.wins++;
      // Increase trade size by 20%
      const newBaseTradeSize = Math.round(user.riskManagement.baseTradeSize * 1.2);
      user.riskManagement.baseTradeSize = Math.max(0, newBaseTradeSize);
      
      // Update account size and total gain
      const profitAmount = profitLoss || user.riskManagement.baseTradeSize * 0.2; // Default to 20% if not specified
      user.riskManagement.accountSize = Math.max(0, user.riskManagement.accountSize + profitAmount);
      user.riskManagement.totalStats.totalGain = Math.max(0, (user.riskManagement.totalStats.totalGain || 0) + profitAmount);
      
      // Handle streak progression for wins
      const currentStreak = parseInt(user.riskManagement.tradeStreak || 0);
      
      // When winning from a negative streak or neutral, always go to 0 first
      if (currentStreak <= 0) {
        user.riskManagement.tradeStreak = 0;
        console.log('Streak reset to neutral after win:', {
          oldStreak: currentStreak,
          newStreak: 0,
          reason: 'Win from negative/neutral streak'
        });
      } else {
        // Only increment if we're already in a positive streak
        const newStreak = Math.min(3, currentStreak + 1);
        user.riskManagement.tradeStreak = newStreak;
        console.log('Streak incremented after win:', {
          oldStreak: currentStreak,
          newStreak,
          reason: 'Win from positive streak'
        });
      }

    } else if (status === 'STOPLOSS_HIT') {
      user.riskManagement.totalStats.losses++;
      // Decrease trade size by 20%
      const newBaseTradeSize = Math.round(user.riskManagement.baseTradeSize * 0.8);
      user.riskManagement.baseTradeSize = Math.max(0, newBaseTradeSize);
      
      // Update account size and total gain
      const lossAmount = profitLoss || user.riskManagement.baseTradeSize * 0.2; // Default to 20% if not specified
      user.riskManagement.accountSize = Math.max(0, user.riskManagement.accountSize - lossAmount);
      user.riskManagement.totalStats.totalGain = Math.max(0, (user.riskManagement.totalStats.totalGain || 0) - lossAmount);
      
      // Handle streak progression for losses
      const currentStreak = parseInt(user.riskManagement.tradeStreak || 0);
      let newStreak;
      
      if (currentStreak >= 0) {
        // If in positive or neutral streak, move down one level
        newStreak = currentStreak - 1;
        console.log('Streak decreased after loss:', {
          oldStreak: currentStreak,
          newStreak,
          change: -1,
          reason: currentStreak > 0 ? 'Loss from positive streak' : 'Loss from neutral streak'
        });
      } else {
        // If in negative streak, move down one level
        newStreak = Math.max(-3, currentStreak - 1);
        console.log('Streak decreased after loss:', {
          oldStreak: currentStreak,
          newStreak,
          change: newStreak - currentStreak,
          reason: 'Loss from negative streak'
        });
      }
      
      user.riskManagement.tradeStreak = newStreak;

      // Handle SL counter
      const currentSL = parseInt(user.riskManagement.slTaken || 0);
      user.riskManagement.slTaken = Math.min(3, currentSL + 1);
      
      console.log('SL counter updated:', {
        oldCount: currentSL,
        newCount: user.riskManagement.slTaken,
        maxDaily: 3
      });
    }
    
    // Ensure all numeric values are properly converted and have fallbacks
    user.riskManagement.tradeStreak = parseInt(user.riskManagement.tradeStreak || 0);
    user.riskManagement.slTaken = parseInt(user.riskManagement.slTaken || 0);
    user.riskManagement.baseTradeSize = parseInt(user.riskManagement.baseTradeSize || 0);
    user.riskManagement.accountSize = parseFloat(user.riskManagement.accountSize || 0);
    user.riskManagement.totalStats.totalGain = parseFloat(user.riskManagement.totalStats.totalGain || 0);
    
    // Calculate current percentage with safety checks
    const safeAccountSize = Math.max(1, user.riskManagement.accountSize); // Prevent division by zero
    const percentage = (user.riskManagement.baseTradeSize / safeAccountSize) * 100;
    user.riskManagement.currentPercentage = parseFloat(percentage.toFixed(2));

    console.log('Final risk management state:', {
      streak: user.riskManagement.tradeStreak,
      slTaken: user.riskManagement.slTaken,
      percentage: user.riskManagement.currentPercentage,
      baseTradeSize: user.riskManagement.baseTradeSize,
      accountSize: user.riskManagement.accountSize,
      totalGain: user.riskManagement.totalStats.totalGain
    });

    // Update percentage
    user.riskManagement.currentPercentage = (user.riskManagement.baseTradeSize / user.riskManagement.accountSize) * 100;

    // Save changes
    await user.save();

    res.json(user.riskManagement);

  } catch (error) {
    console.error('Error updating risk management:', error);
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
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'User not found'
      });
    }

    // Reset the SL counter
    user.riskManagement.slTaken = 0;
    
    // Save the changes
    await user.save();

    // Return the full updated risk management state
    const netPL = (user.riskManagement.dailyStats?.dailyProfit || 0) - (user.riskManagement.dailyStats?.dailyLoss || 0);
    
    res.json({
      success: true,
      dailyStats: {
        ...user.riskManagement.dailyStats,
        netPL
      },
      totalStats: user.riskManagement.totalStats,
      accountSize: user.riskManagement.accountSize,
      settings: user.riskManagement.settings,
      slTaken: user.riskManagement.slTaken,
      tradeStreak: user.riskManagement.tradeStreak,
      baseTradeSize: user.riskManagement.baseTradeSize,
      currentPercentage: user.riskManagement.currentPercentage
    });

  } catch (error) {
    console.error(' [RISK] Error resetting stoploss counter:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
};

exports.resetDailyStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate 10% of account size
    const defaultTradeSize = Math.round(user.riskManagement.accountSize * 0.1);

    // Update all stats
    user.riskManagement.dailyStats = {
      lastTradeDate: new Date(),
      trades: 0,
      wins: 0,
      losses: 0,
      dailyProfit: 0,
      dailyLoss: 0
    };
    user.riskManagement.slTaken = 0;
    user.riskManagement.tradeStreak = 0;
    user.riskManagement.baseTradeSize = defaultTradeSize;
    user.riskManagement.currentPercentage = 10;

    await user.save();
    res.json(user.riskManagement);
  } catch (error) {
    console.error('Error resetting daily stats:', error);
    res.status(500).json({ message: error.message });
  }
};