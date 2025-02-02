// store/modules/riskManagement.js
const API_URL = process.env.VUE_APP_API_URL || 
  (typeof import.meta !== 'undefined' ? import.meta.env.VITE_API_URL : undefined) || 
  'http://localhost:3004';

console.log('🌍 Using API URL:', API_URL);

if (!API_URL) {
  console.error('❌ No API URL defined in environment');
}

export default {
  namespaced: true,
  state: {
    accountSize: 10000,
    baseTradeSize: 1000,
    currentPercentage: 10,
    tradeStreak: 0,
    slTaken: 0,
    lastUpdate: null,
    dailyStats: {
      lastTradeDate: null,
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
    },
    settings: {
      maxDailyLoss: 500,
      maxTradesPerDay: 3
    }
  },

  mutations: {
    SET_RISK_MANAGEMENT(state, { data }) {
      if (!data) return;
      
      console.log('Setting risk management with data:', data);
      
      // Update base values if they exist and are valid numbers
      if (typeof data.accountSize === 'number' && !isNaN(data.accountSize)) {
        state.accountSize = data.accountSize;
      }
      if (typeof data.baseTradeSize === 'number' && !isNaN(data.baseTradeSize)) {
        state.baseTradeSize = data.baseTradeSize;
      }
      if (typeof data.currentPercentage === 'number' && !isNaN(data.currentPercentage)) {
        state.currentPercentage = data.currentPercentage;
      } else {
        // Recalculate percentage if not provided
        state.currentPercentage = Number(((state.baseTradeSize / state.accountSize) * 100).toFixed(2));
      }
      
      // Update streak and SL if they exist and are valid numbers
      if (typeof data.tradeStreak === 'number' && !isNaN(data.tradeStreak)) {
        state.tradeStreak = data.tradeStreak;
      }
      if (typeof data.slTaken === 'number' && !isNaN(data.slTaken)) {
        state.slTaken = data.slTaken;
      }
      
      // Update daily stats with all fields
      if (data.dailyStats) {
        state.dailyStats = {
          lastTradeDate: data.dailyStats.lastTradeDate,
          trades: data.dailyStats.trades || 0,
          wins: data.dailyStats.wins || 0,
          losses: data.dailyStats.losses || 0,
          dailyProfit: data.dailyStats.dailyProfit || 0,
          dailyLoss: data.dailyStats.dailyLoss || 0
        };
        console.log('Daily stats updated:', state.dailyStats);
      }

      // Update total stats
      if (data.totalStats) {
        state.totalStats = {
          trades: data.totalStats.trades || 0,
          wins: data.totalStats.wins || 0,
          losses: data.totalStats.losses || 0,
          totalGain: data.totalStats.totalGain || 0,
          totalRisk: data.totalStats.totalRisk || 0,
          totalReward: data.totalStats.totalReward || 0,
          averageRR: data.totalStats.averageRR || 0
        };
      }

      // Log streak transitions for debugging
      if (state.tradeStreak !== data.tradeStreak) {
        console.log('Streak transition:', {
          old: state.tradeStreak,
          new: data.tradeStreak,
          change: data.tradeStreak - state.tradeStreak,
          timestamp: new Date().toISOString()
        });
      }
      
      if (data.settings) {
        state.settings = {
          ...state.settings,
          ...data.settings
        };
      }
      
      console.log('Risk management updated:', state);
    },

    UPDATE_TRADE_SIZE(state, newSize) {
      state.baseTradeSize = newSize;
      // Calculate new percentage based on current account size
      state.currentPercentage = Number(((newSize / state.accountSize) * 100).toFixed(2));
    },

    SET_ACCOUNT_SIZE(state, size) {
      state.accountSize = size;
      // Recalculate percentage when account size changes
      state.currentPercentage = Number(((state.baseTradeSize / size) * 100).toFixed(2));
    }
  },

  actions: {
    async fetchRiskManagement({ commit }) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No authentication token found, using default values');
          commit('SET_ACCOUNT_SIZE', 10000);
          commit('UPDATE_TRADE_SIZE', 1000);
          return;
        }

        const response = await fetch(`${API_URL}/api/risk-management/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        commit('SET_RISK_MANAGEMENT', { data });
        
      } catch (error) {
        console.error('Error fetching risk management data:', error);
        commit('SET_ACCOUNT_SIZE', 10000);
        commit('UPDATE_TRADE_SIZE', 1000);
      }
    },

    async updateAfterTrade({commit }, { status, profitLoss }) {
      try {
        console.log('Updating after trade:', { status, profitLoss });
        
        // Send update to backend
        const response = await fetch(`${API_URL}/api/risk-management/update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ status, profitLoss })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Backend error:', errorText);
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();
        console.log('Risk management updated with data:', data);
        
        commit('SET_RISK_MANAGEMENT', { data });
        return data;
      } catch (error) {
        console.error('Error updating risk management:', error);
        throw error;
      }
    },

    async updateSettings({ commit }, { accountSize, baseTradeSize }) {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');

        const response = await fetch(`${API_URL}/api/risk-management/settings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ accountSize, baseTradeSize })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        commit('SET_RISK_MANAGEMENT', { data });
        return data;
      } catch (error) {
        console.error('Error updating settings:', error);
        throw error;
      }
    }
  },

  getters: {
    dailyNet: state => {
      const wins = state.dailyStats.wins || 0;
      const losses = state.dailyStats.losses || 0;
      return wins - losses;
    },
    canTrade: state => {
      const canTrade = state.slTaken < 3 && 
                      state.dailyStats.trades < state.settings.maxTradesPerDay;
      console.log('Can trade check:', {
        slTaken: state.slTaken,
        dailyTrades: state.dailyStats.trades,
        result: canTrade
      });
      return canTrade;
    }
  }
};
