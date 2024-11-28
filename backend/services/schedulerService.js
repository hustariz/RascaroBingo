const schedule = require('node-schedule');
const User = require('../models/User');

const resetDailyStats = async () => {
  try {
    const result = await User.updateMany(
      {},
      {
        $set: {
          'riskManagement.dailyStats': {
            lastTradeDate: new Date(),
            dailyTradeCount: 0,
            dailyProfit: 0,
            dailyLoss: 0
          },
          'riskManagement.slTaken': 0,
          'riskManagement.tradeStreak': 0
        }
      },

      { 
        strict: false,
        preserveAccountSize: true 
      }
    );
    console.log('🔄 Daily stats reset completed at:', new Date().toLocaleString(), result);
  } catch (error) {
    console.error('❌ Error resetting daily stats:', error);
  }
};

const initializeScheduler = () => {
  schedule.scheduleJob('0 0 * * *', resetDailyStats);
  console.log('⏰ Daily reset scheduler initialized');
};

module.exports = {
  initializeScheduler,
  resetDailyStats
};