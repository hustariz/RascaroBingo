// controllers/tradeController.js
const Trade = require('../models/Trade');
const User = require('../models/User');

exports.createTrade = async (req, res) => {
  try {
    console.log('Creating trade with user:', req.user.id);
    console.log('Trade data:', req.body);

    const trade = new Trade({
      ...req.body,
      user: req.user.id
    });
    
    const savedTrade = await trade.save();
    console.log('Trade saved successfully:', savedTrade);
    res.status(201).json(savedTrade);
  } catch (error) {
    console.error('Error creating trade:', error);
    res.status(400).json({ message: error.message });
  }
};

exports.getTrades = async (req, res) => {
  try {
    const userId = req.user.id;
    const trades = await Trade.find({ user: userId })
      .sort({ createdAt: -1 }) // Sort by newest first
      .exec();
    
    res.json(trades);
  } catch (error) {
    console.error('Error fetching trades:', error);
    res.status(500).json({ 
      success: false, 
      msg: 'Error fetching trades',
      error: error.message 
    });
  }
};

exports.saveTrade = async (req, res) => {
  try {
    const {
      pair,
      isLong,
      entryPrice,
      stopLoss,
      takeProfit,
      notes,
      status,
      potentialProfit,
      potentialLoss,
      riskRewardRatio
    } = req.body;

    console.log(' [TRADE] Saving new trade:', { 
      userId: req.user.id,
      pair,
      isLong
    });

    // Create new trade
    const trade = new Trade({
      user: req.user.id,  // Make sure we're setting the user field
      pair,
      isLong,
      entryPrice,
      stopLoss,
      takeProfit,
      notes,
      status,
      potentialProfit,
      potentialLoss,
      riskRewardRatio
    });

    console.log(' Created trade object:', {
      ...trade.toObject(),
      user: trade.user.toString()
    });

    // Save the trade
    const savedTrade = await trade.save();
    console.log(' [TRADE] Trade saved:', savedTrade._id);

    // Find the user and update their trade history
    const user = await User.findById(req.user.id);
    if (!user) {
      console.error(' User not found:', req.user.id);
      return res.status(404).json({ msg: 'User not found' });
    }

    // Initialize tradeHistory array if it doesn't exist
    if (!user.tradeHistory) {
      user.tradeHistory = [];
    }

    // Add trade to user's history
    user.tradeHistory.push(savedTrade._id);
    console.log(' Added trade to user history');

    // Initialize totalStats if they don't exist
    if (!user.riskManagement.totalStats) {
      user.riskManagement.totalStats = {
        trades: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        profitFactor: 0,
        averageWin: 0,
        averageLoss: 0,
        totalProfit: 0,
        totalLoss: 0,
        netProfit: 0
      };
    }

    // Save user changes
    await user.save();
    console.log(' User updated with new trade');

    // Calculate updated stats
    const stats = await calculateUserStats(req.user.id);
    console.log(' Updated user stats:', stats);

    res.status(201).json({ 
      trade: savedTrade,
      stats
    });
  } catch (error) {
    console.error(' [TRADE] Error saving trade:', error);
    res.status(500).json({ msg: error.message });
  }
};

exports.updateTradeStatus = async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { status, profitLoss } = req.body;
    const userId = req.user.id;

    console.log(' Update request:', { 
      tradeId,
      status,
      userId
    });

    // First verify the trade exists and get user data
    const [trade, user] = await Promise.all([
      Trade.findById(tradeId),
      User.findById(userId)
    ]);

    if (!trade) {
      console.error(' Trade not found:', tradeId);
      return res.status(404).json({ 
        success: false,
        msg: 'Trade not found' 
      });
    }

    if (!user) {
      console.error(' User not found:', userId);
      return res.status(404).json({
        success: false,
        msg: 'User not found'
      });
    }

    console.log(' Ownership check:', { 
      tradeId,
      tradeUserId: trade.user.toString(),
      requestUserId: userId,
      isMatch: trade.user.toString() === userId,
      tradeStatus: trade.status
    });

    // Convert both IDs to strings for comparison
    const tradeUserId = trade.user.toString();
    const requestUserId = userId.toString();

    // Verify user owns this trade
    if (tradeUserId !== requestUserId) {
      console.error(' Unauthorized:', { 
        tradeId,
        tradeUserId,
        requestUserId
      });
      return res.status(403).json({ 
        success: false,
        msg: 'Not authorized'
      });
    }

    // Verify valid status transition
    if (trade.status !== 'OPEN') {
      console.error(' Invalid status transition:', {
        tradeId,
        currentStatus: trade.status,
        requestedStatus: status
      });
      return res.status(400).json({
        success: false,
        msg: 'Cannot update status of a closed trade'
      });
    }

    // Check if we've hit the daily SL limit before processing
    if (status === 'STOPLOSS_HIT') {
      const currentSL = user.riskManagement.slTaken || 0;
      if (currentSL >= 3) {
        console.log(' Daily SL limit reached:', currentSL);
        return res.status(400).json({
          success: false,
          msg: 'Daily stoploss limit reached (3/3)',
          error: 'Cannot take more than 3 stoplosses per day'
        });
      }
    }

    // Update trade status
    trade.status = status;
    await trade.save();
    console.log('✅ [TRADE] Status updated:', { tradeId, newStatus: status });

    // Calculate updated stats
    const stats = await calculateUserStats(userId);
    console.log('📊 [TRADE] Stats updated:', stats);

    // Update risk management based on trade result
    if (status === 'TARGET_HIT' || status === 'STOPLOSS_HIT') {
      // Calculate actual P/L based on percentage gain/loss relative to trade size
      const currentTradeSize = user.riskManagement.baseTradeSize || 1000;
      let actualProfitLoss;
      
      if (status === 'TARGET_HIT') {
        // For a win, calculate percentage gain from entry to target
        const entryPrice = parseFloat(trade.entryPrice);
        const targetPrice = parseFloat(trade.takeProfit);
        let percentageGain;
        
        if (trade.isLong) {
          percentageGain = ((targetPrice - entryPrice) / entryPrice) * 100;
        } else {
          // For shorts, profit is when price goes down
          percentageGain = ((entryPrice - targetPrice) / entryPrice) * 100;
        }
        actualProfitLoss = (percentageGain / 100) * currentTradeSize;
      } else {
        // For a loss, calculate percentage loss from entry to stop
        const entryPrice = parseFloat(trade.entryPrice);
        const stopPrice = parseFloat(trade.stopLoss);
        let percentageLoss;
        
        if (trade.isLong) {
          percentageLoss = ((entryPrice - stopPrice) / entryPrice) * 100;
        } else {
          // For shorts, loss is when price goes up
          percentageLoss = ((stopPrice - entryPrice) / entryPrice) * 100;
        }
        actualProfitLoss = (percentageLoss / 100) * currentTradeSize;
      }

      // Round to 2 decimal places
      actualProfitLoss = Math.round(actualProfitLoss * 100) / 100;

      console.log('💵 P/L Calculation:', {
        status,
        isLong: trade.isLong,
        entry: trade.entryPrice,
        target: trade.takeProfit,
        stop: trade.stopLoss,
        tradeSize: currentTradeSize,
        calculatedPL: actualProfitLoss
      });

      // Update account size based on actual P/L
      const currentAccountSize = user.riskManagement.accountSize || 10000;
      if (status === 'TARGET_HIT') {
        user.riskManagement.accountSize = Math.round(currentAccountSize + actualProfitLoss);
      } else {
        user.riskManagement.accountSize = Math.round(currentAccountSize - actualProfitLoss);
      }
      console.log('💰 Account size updated:', {
        oldSize: currentAccountSize,
        newSize: user.riskManagement.accountSize,
        profitLoss: status === 'TARGET_HIT' ? actualProfitLoss : -actualProfitLoss
      });

      // Update risk management
      const today = new Date();
      const lastTradeDate = user.riskManagement.dailyStats?.lastTradeDate ? new Date(user.riskManagement.dailyStats.lastTradeDate) : null;
      const isNewDay = !lastTradeDate || 
        lastTradeDate.getFullYear() !== today.getFullYear() ||
        lastTradeDate.getMonth() !== today.getMonth() ||
        lastTradeDate.getDate() !== today.getDate();

      // Adjust trade size based on result (20% up for win, 20% down for loss)
      // Only adjust if we're not at the streak limits
      const currentStreak = parseInt(user.riskManagement.tradeStreak || 0);
      
      if (status === 'TARGET_HIT' && currentStreak < 3) {
        user.riskManagement.baseTradeSize = Math.round(currentTradeSize * 1.2); // Increase by 20%
        console.log('📈 Trade size increased by 20%:', {
          oldSize: currentTradeSize,
          newSize: user.riskManagement.baseTradeSize,
          streak: currentStreak
        });
      } else if (status === 'STOPLOSS_HIT' && currentStreak > -3) {
        user.riskManagement.baseTradeSize = Math.round(currentTradeSize * 0.8); // Decrease by 20%
        console.log('📉 Trade size decreased by 20%:', {
          oldSize: currentTradeSize,
          newSize: user.riskManagement.baseTradeSize,
          streak: currentStreak
        });
      } else {
        console.log('ℹ️ Trade size unchanged (at streak limit):', {
          size: currentTradeSize,
          streak: currentStreak
        });
      }

      // Reset daily stats if it's a new day
      if (isNewDay) {
        user.riskManagement.dailyStats = {
          lastTradeDate: today,
          trades: 1,
          wins: status === 'TARGET_HIT' ? 1 : 0,
          losses: status === 'STOPLOSS_HIT' ? 1 : 0,
          dailyProfit: status === 'TARGET_HIT' ? actualProfitLoss : 0,
          dailyLoss: status === 'STOPLOSS_HIT' ? actualProfitLoss : 0
        };
        user.riskManagement.slTaken = status === 'STOPLOSS_HIT' ? 1 : 0;
      } else {
        // Update existing daily stats
        user.riskManagement.dailyStats.lastTradeDate = today;
        user.riskManagement.dailyStats.trades++;
        
        if (status === 'TARGET_HIT') {
          user.riskManagement.dailyStats.wins++;
          user.riskManagement.dailyStats.dailyProfit += actualProfitLoss;
        } else if (status === 'STOPLOSS_HIT') {
          user.riskManagement.dailyStats.losses++;
          user.riskManagement.dailyStats.dailyLoss += actualProfitLoss;
          // Increment slTaken counter for same-day stop losses
          user.riskManagement.slTaken = (user.riskManagement.slTaken || 0) + 1;
          console.log('Stop loss counter updated:', user.riskManagement.slTaken);
        }
      }

      // Update trade streak
      if (status === 'TARGET_HIT') {
        const currentStreak = parseInt(user.riskManagement.tradeStreak || 0);
        // Always increment by 1, capped at +3
        const newStreak = Math.min(3, currentStreak + 1);
        user.riskManagement.tradeStreak = newStreak;
        console.log('Streak after win:', {
          oldStreak: currentStreak,
          newStreak,
          change: '+1'
        });
      } else if (status === 'STOPLOSS_HIT') {
        const currentStreak = parseInt(user.riskManagement.tradeStreak || 0);
        // Always decrement by 1, capped at -3
        const newStreak = Math.max(-3, currentStreak - 1);
        user.riskManagement.tradeStreak = newStreak;
        console.log('Streak after loss:', {
          oldStreak: currentStreak,
          newStreak,
          change: '-1'
        });
      }

      // Save user changes
      await user.save();
      console.log(' Risk management updated:', user.riskManagement);
    }

    res.json({ 
      success: true,
      trade,
      stats: user.riskManagement
    });
  } catch (error) {
    console.error(' Error updating trade status:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
};

exports.deleteTrade = async (req, res) => {
  try {
    const { tradeId } = req.params;
    const userId = req.user.id;

    console.log(' Delete request:', { 
      tradeId,
      userId
    });

    // First verify the trade exists
    const trade = await Trade.findById(tradeId);
    if (!trade) {
      console.error(' Trade not found:', tradeId);
      return res.status(404).json({ 
        success: false,
        msg: 'Trade not found' 
      });
    }

    // Convert both IDs to strings for comparison
    const tradeUserId = trade.user.toString();
    const requestUserId = userId.toString();

    console.log(' Ownership check:', {
      tradeId,
      tradeUserId,
      requestUserId,
      isMatch: tradeUserId === requestUserId
    });

    // Verify user owns this trade
    if (tradeUserId !== requestUserId) {
      console.error(' Unauthorized:', { 
        tradeId,
        tradeUserId,
        requestUserId
      });
      return res.status(403).json({ 
        success: false,
        msg: 'Not authorized',
        error: 'You do not own this trade'
      });
    }

    // Delete the trade
    await Trade.findByIdAndDelete(tradeId);
    console.log(' Deleted:', tradeId);

    // Update user stats
    const stats = await calculateUserStats(requestUserId);
    console.log(' Stats updated:', stats);

    // Send response
    res.json({ 
      success: true,
      msg: 'Trade deleted successfully',
      stats
    });
  } catch (error) {
    console.error(' Error:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Server error while deleting trade',
      error: error.message 
    });
  }
};

// Helper function to calculate user stats
const calculateUserStats = async (userId) => {
  console.log('Calculating stats for user:', userId);
  
  const user = await User.findById(userId).populate('tradeHistory');
  if (!user || !user.tradeHistory) {
    console.log('No user or trade history found');
    return {
      trades: 0,
      wins: 0,
      losses: 0,
      totalGain: 0,
      totalRisk: 0,
      totalReward: 0,
      averageRR: 0
    };
  }

  console.log('Found user with trade history:', user.tradeHistory.length);

  const stats = {
    trades: user.tradeHistory.length,
    wins: 0,
    losses: 0,
    totalGain: 0,
    totalRisk: 0,
    totalReward: 0,
    averageRR: 0
  };

  user.tradeHistory.forEach(trade => {
    if (trade.status === 'TARGET_HIT') {
      stats.wins++;
      stats.totalGain += trade.potentialProfit || 0;
    } else if (trade.status === 'STOPLOSS_HIT') {
      stats.losses++;
      stats.totalGain += trade.potentialLoss || 0;
    }

    stats.totalRisk += Math.abs(trade.stopLoss - trade.entryPrice);
    stats.totalReward += Math.abs(trade.takeProfit - trade.entryPrice);
  });

  if (stats.totalRisk > 0) {
    stats.averageRR = stats.totalReward / stats.totalRisk;
  }

  console.log('Calculated stats:', stats);
  return stats;
};

module.exports = exports;