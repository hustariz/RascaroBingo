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
    const { status } = req.body;
    const userId = req.user.id;

    console.log(' [TRADE] Update request:', { 
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
      console.error(' [TRADE] Trade not found:', tradeId);
      return res.status(404).json({ 
        success: false,
        msg: 'Trade not found' 
      });
    }

    if (!user) {
      console.error(' [TRADE] User not found:', userId);
      return res.status(404).json({
        success: false,
        msg: 'User not found'
      });
    }

    // Convert both IDs to strings for comparison
    const tradeUserId = trade.user.toString();
    const requestUserId = userId.toString();

    // Verify user owns this trade
    if (tradeUserId !== requestUserId) {
      console.error(' [TRADE] Unauthorized:', { 
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
      console.error(' [TRADE] Invalid status transition:', {
        tradeId,
        currentStatus: trade.status,
        requestedStatus: status
      });
      return res.status(400).json({
        success: false,
        msg: 'Cannot update status of a closed trade'
      });
    }

    // Calculate profit/loss based on trade details
    let profitLoss = 0;
    const tradeSize = user.riskManagement.baseTradeSize;
    
    if (status === 'TARGET_HIT') {
      // For longs: (target - entry) * trade size
      // For shorts: (entry - target) * trade size
      const priceDiff = trade.isLong 
        ? trade.takeProfit - trade.entryPrice
        : trade.entryPrice - trade.takeProfit;
      profitLoss = Math.abs(priceDiff * tradeSize);
    } else if (status === 'STOPLOSS_HIT') {
      // For longs: (stoploss - entry) * trade size
      // For shorts: (entry - stoploss) * trade size
      const priceDiff = trade.isLong
        ? trade.stopLoss - trade.entryPrice
        : trade.entryPrice - trade.stopLoss;
      profitLoss = -Math.abs(priceDiff * tradeSize);
    }

    console.log(' [TRADE] Calculated P/L:', {
      status,
      profitLoss,
      details: {
        isLong: trade.isLong,
        entry: trade.entryPrice,
        target: trade.takeProfit,
        stoploss: trade.stopLoss,
        tradeSize
      }
    });

    // Update the trade
    trade.status = status;
    trade.realizedPnL = profitLoss;
    await trade.save();

    // Update user stats
    const stats = await calculateUserStats(userId);
    console.log(' [TRADE] Updated stats:', stats);

    // Check stoploss limit before updating
    if (status === 'STOPLOSS_HIT' && user.riskManagement.slTaken >= 3) {
      return res.status(400).json({
        success: false,
        msg: 'Daily stoploss limit reached (3/3)',
        error: 'Cannot take more than 3 stoplosses per day'
      });
    }

    // Update total stats
    user.riskManagement.totalStats = {
      ...user.riskManagement.totalStats,
      trades: stats.trades,
      wins: stats.wins,
      losses: stats.losses,
      totalGain: stats.totalGain,
      totalRisk: stats.totalRisk,
      totalReward: stats.totalReward,
      averageRR: stats.averageRR
    };

    // Update daily stats
    const today = new Date();
    const lastTradeDate = user.riskManagement.dailyStats?.lastTradeDate ? new Date(user.riskManagement.dailyStats.lastTradeDate) : null;

    // Reset daily stats if it's a new day
    if (!lastTradeDate || lastTradeDate.getDate() !== today.getDate()) {
      user.riskManagement.dailyStats = {
        lastTradeDate: today,
        trades: 1,
        wins: status === 'TARGET_HIT' ? 1 : 0,
        losses: status === 'STOPLOSS_HIT' ? 1 : 0,
        dailyProfit: profitLoss > 0 ? profitLoss : 0,
        dailyLoss: profitLoss < 0 ? Math.abs(profitLoss) : 0
      };
    } else {
      // Update existing daily stats
      const currentStats = user.riskManagement.dailyStats || {};
      user.riskManagement.dailyStats = {
        lastTradeDate: today,
        trades: (currentStats.trades || 0) + 1,
        wins: status === 'TARGET_HIT' 
          ? (currentStats.wins || 0) + 1 
          : (currentStats.wins || 0),
        losses: status === 'STOPLOSS_HIT'
          ? (currentStats.losses || 0) + 1
          : (currentStats.losses || 0),
        dailyProfit: profitLoss > 0 
          ? (currentStats.dailyProfit || 0) + profitLoss
          : (currentStats.dailyProfit || 0),
        dailyLoss: profitLoss < 0
          ? (currentStats.dailyLoss || 0) + Math.abs(profitLoss)
          : (currentStats.dailyLoss || 0)
      };
    }

    const netPL = (user.riskManagement.dailyStats.dailyProfit || 0) - (user.riskManagement.dailyStats.dailyLoss || 0);
    console.log(' [TRADE] Daily stats updated:', {
      ...user.riskManagement.dailyStats,
      profitLoss,
      netPL
    });

    // Update trade streak and trade size
    if (status === 'TARGET_HIT') {
      const currentStreak = parseInt(user.riskManagement.tradeStreak || 0);
      if (currentStreak < 0) {
        // When winning from negative streak, go to 0 first
        user.riskManagement.tradeStreak = 0;
      } else {
        // When at 0 or in positive streak, increment
        user.riskManagement.tradeStreak = Math.min(currentStreak + 1, 3);
      }
      user.riskManagement.baseTradeSize = Math.round(user.riskManagement.baseTradeSize * 1.2);
    } else if (status === 'STOPLOSS_HIT') {
      const currentStreak = parseInt(user.riskManagement.tradeStreak || 0);
      if (currentStreak >= 0) {
        // If in positive or neutral streak, move down one level
        user.riskManagement.tradeStreak = currentStreak - 1;
      } else {
        // If in negative streak, move down one level (min -3)
        user.riskManagement.tradeStreak = Math.max(-3, currentStreak - 1);
      }
      user.riskManagement.slTaken = Math.min((user.riskManagement.slTaken || 0) + 1, 3);
      user.riskManagement.baseTradeSize = Math.round(user.riskManagement.baseTradeSize * 0.8);
    }

    // Update account size and recalculate percentage
    user.riskManagement.accountSize = Math.round(user.riskManagement.accountSize + profitLoss);
    user.riskManagement.currentPercentage = (user.riskManagement.baseTradeSize / user.riskManagement.accountSize) * 100;

    // Save changes
    await Promise.all([
      trade.save(),
      user.save()
    ]);

    console.log(' [TRADE] Risk management updated:', {
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

    res.json({ 
      success: true,
      trade,
      stats: {
        ...stats,
        tradeStreak: user.riskManagement.tradeStreak,
        slTaken: user.riskManagement.slTaken,
        accountSize: user.riskManagement.accountSize,
        baseTradeSize: user.riskManagement.baseTradeSize,
        currentPercentage: user.riskManagement.currentPercentage,
        dailyStats: {
          ...user.riskManagement.dailyStats,
          netPL
        }
      },
      profitLoss
    });
  } catch (error) {
    console.error(' [TRADE] Error updating trade status:', error);
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

    console.log(' [TRADE] Delete request:', { 
      tradeId,
      userId
    });

    // First verify the trade exists
    const trade = await Trade.findById(tradeId);
    if (!trade) {
      console.error(' [TRADE] Trade not found:', tradeId);
      return res.status(404).json({ 
        success: false,
        msg: 'Trade not found' 
      });
    }

    // Convert both IDs to strings for comparison
    const tradeUserId = trade.user.toString();
    const requestUserId = userId.toString();

    console.log(' [TRADE] Ownership check:', {
      tradeId,
      tradeUserId,
      requestUserId,
      isMatch: tradeUserId === requestUserId
    });

    // Verify user owns this trade
    if (tradeUserId !== requestUserId) {
      console.error(' [TRADE] Unauthorized:', { 
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
    console.log(' [TRADE] Deleted:', tradeId);

    // Update user stats
    const stats = await calculateUserStats(requestUserId);
    console.log(' [TRADE] Stats updated:', stats);

    // Send response
    res.json({ 
      success: true,
      msg: 'Trade deleted successfully',
      stats
    });
  } catch (error) {
    console.error(' [TRADE] Error:', error);
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