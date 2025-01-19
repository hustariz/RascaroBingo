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
    console.log('🔍 [TRADE] Getting trades for user:', req.user.id);
    const trades = await Trade.find({ user: req.user.id }).sort({ createdAt: -1 });
    console.log('✅ [TRADE] Found trades:', trades.length);
    res.json(trades);
  } catch (error) {
    console.error('❌ [TRADE] Error getting trades:', error);
    res.status(500).json({ msg: error.message });
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

    console.log('📝 [TRADE] Saving new trade:', { 
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
    console.log('✅ [TRADE] Trade saved:', savedTrade._id);

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
    console.error('❌ [TRADE] Error saving trade:', error);
    res.status(500).json({ msg: error.message });
  }
};

exports.updateTradeStatus = async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    console.log('🔄 [TRADE] Update request:', { 
      tradeId,
      status,
      userId,
      headers: req.headers
    });

    // First verify the trade exists
    const trade = await Trade.findById(tradeId);
    if (!trade) {
      console.error('❌ [TRADE] Trade not found:', tradeId);
      return res.status(404).json({ 
        success: false,
        msg: 'Trade not found' 
      });
    }

    // Convert both IDs to strings for comparison
    const tradeUserId = trade.user.toString();
    const requestUserId = userId.toString();

    console.log('🔍 [TRADE] Ownership check:', {
      tradeId,
      tradeUserId,
      requestUserId,
      isMatch: tradeUserId === requestUserId,
      tradeStatus: trade.status
    });

    // Verify user owns this trade
    if (tradeUserId !== requestUserId) {
      console.error('🚫 [TRADE] Unauthorized:', { 
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

    // Verify valid status transition
    if (trade.status !== 'OPEN') {
      console.error('❌ [TRADE] Invalid status transition:', {
        tradeId,
        currentStatus: trade.status,
        requestedStatus: status
      });
      return res.status(400).json({
        success: false,
        msg: 'Cannot update status of a closed trade',
        error: 'Trade is already closed'
      });
    }

    // Update the trade
    trade.status = status;
    await trade.save();
    console.log('✅ [TRADE] Status updated:', {
      tradeId,
      newStatus: status
    });

    // Calculate profit/loss
    const profitLoss = status === 'TARGET_HIT' ? trade.potentialProfit : 
                      status === 'STOPLOSS_HIT' ? -trade.potentialLoss : 0;

    // Update user stats
    const stats = await calculateUserStats(requestUserId);
    console.log('📊 [TRADE] Stats updated:', stats);

    // Update risk management
    const user = await User.findById(requestUserId);
    if (user?.riskManagement) {
      if (status === 'TARGET_HIT') {
        user.riskManagement.tradeStreak = (user.riskManagement.tradeStreak || 0) + 1;
        user.riskManagement.totalStats.wins = (user.riskManagement.totalStats.wins || 0) + 1;
      } else if (status === 'STOPLOSS_HIT') {
        user.riskManagement.tradeStreak = 0;
        user.riskManagement.slTaken = (user.riskManagement.slTaken || 0) + 1;
        user.riskManagement.totalStats.losses = (user.riskManagement.totalStats.losses || 0) + 1;
      }
      user.riskManagement.totalStats.trades = (user.riskManagement.totalStats.trades || 0) + 1;
      await user.save();
      console.log('📈 [TRADE] Risk management updated:', user.riskManagement);
    }

    // Send response
    res.json({ 
      success: true,
      trade: trade.toJSON(),
      stats,
      profitLoss
    });
  } catch (error) {
    console.error('❌ [TRADE] Error:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Server error while updating trade',
      error: error.message 
    });
  }
};

exports.deleteTrade = async (req, res) => {
  try {
    const { tradeId } = req.params;
    const userId = req.user.id;

    console.log('🗑️ [TRADE] Delete request:', { 
      tradeId,
      userId,
      headers: req.headers
    });

    // First verify the trade exists
    const trade = await Trade.findById(tradeId);
    if (!trade) {
      console.error('❌ [TRADE] Trade not found:', tradeId);
      return res.status(404).json({ 
        success: false,
        msg: 'Trade not found' 
      });
    }

    // Convert both IDs to strings for comparison
    const tradeUserId = trade.user.toString();
    const requestUserId = userId.toString();

    console.log('🔍 [TRADE] Ownership check:', {
      tradeId,
      tradeUserId,
      requestUserId,
      isMatch: tradeUserId === requestUserId
    });

    // Verify user owns this trade
    if (tradeUserId !== requestUserId) {
      console.error('🚫 [TRADE] Unauthorized:', { 
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
    console.log('✅ [TRADE] Deleted:', tradeId);

    // Update user stats
    const stats = await calculateUserStats(requestUserId);
    console.log('📊 [TRADE] Stats updated:', stats);

    // Send response
    res.json({ 
      success: true,
      msg: 'Trade deleted successfully',
      stats
    });
  } catch (error) {
    console.error('❌ [TRADE] Error:', error);
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