// store/modules/riskManagement.js
export default {
  namespaced: true,
  state: {
    accountSize: 10000,
    baseTradeSize: 1000,
    adjustedTradeSize: 1000,
    tradeStreak: 0,
    slTaken: 0,
    currentPercentage: 10,
    dailyStats: {
      lastTradeDate: null,
      dailyTradeCount: 0,
      dailyLoss: 0,
      dailyProfit: 0
    },
    settings: {
      maxDailyLoss: 500,
      maxTradesPerDay: 3
    }
  },
  mutations: {
    SET_RISK_MANAGEMENT(state, { data, status, profitLoss }) {
      if (!data) return;
      
      // Update account size
      state.accountSize = data.accountSize;
      
      // For initial load
      if (!status) {
        Object.assign(state, {
          ...data,
          baseTradeSize: data.baseTradeSize || state.baseTradeSize,
          adjustedTradeSize: data.baseTradeSize || state.baseTradeSize,
          currentPercentage: ((data.baseTradeSize || state.baseTradeSize) / data.accountSize) * 100
        });
      } else if (status === 'TARGET_HIT') {
        // Increase trade size by 20%
        const newTradeSize = Math.round(state.baseTradeSize * 1.2);
        
        Object.assign(state, {
          ...data,
          slTaken: state.slTaken,
          baseTradeSize: newTradeSize,
          adjustedTradeSize: newTradeSize,
          currentPercentage: (newTradeSize / data.accountSize) * 100,
          dailyStats: {
            ...state.dailyStats,
            lastTradeDate: data.dailyStats?.lastTradeDate || state.dailyStats.lastTradeDate,
            dailyTradeCount: (state.dailyStats.dailyTradeCount || 0) + 1,
            dailyLoss: data.dailyStats?.dailyLoss || state.dailyStats.dailyLoss,
            dailyProfit: (state.dailyStats.dailyProfit || 0) + profitLoss
          }
        });
      } else if (status === 'STOPLOSS_HIT') {
        // Decrease trade size by 20%
        const newTradeSize = Math.round(state.baseTradeSize * 0.8);
        
        Object.assign(state, {
          ...data,
          baseTradeSize: newTradeSize,
          adjustedTradeSize: newTradeSize,
          currentPercentage: (newTradeSize / data.accountSize) * 100,
          dailyStats: {
            ...state.dailyStats,
            lastTradeDate: data.dailyStats?.lastTradeDate || state.dailyStats.lastTradeDate,
            dailyTradeCount: (state.dailyStats.dailyTradeCount || 0) + 1,
            dailyLoss: (state.dailyStats.dailyLoss || 0) + Math.abs(profitLoss),
            dailyProfit: state.dailyStats?.dailyProfit || 0
          }
        });
      }
      
      console.log('Trade size adjusted:', {
        accountSize: state.accountSize,
        currentPercentage: state.currentPercentage,
        baseTradeSize: state.baseTradeSize,
        adjustedTradeSize: state.adjustedTradeSize,
        status
      });
    },

    UPDATE_TRADE_SIZE(state, newSize) {
      state.baseTradeSize = newSize;
      state.adjustedTradeSize = newSize;
      state.currentPercentage = (newSize / state.accountSize) * 100;
      console.log('Manual trade size update:', {
        newSize,
        newPercentage: state.currentPercentage
      });
    },

    SET_ACCOUNT_SIZE(state, size) {
      console.log('SET_ACCOUNT_SIZE mutation called:', { oldSize: state.accountSize, newSize: size });
      state.accountSize = size;
      // Recalculate percentage when account size changes
      state.currentPercentage = (state.baseTradeSize / size) * 100;
    },

    UPDATE_AFTER_TRADE(state, { status, profitLoss }) {
      console.log('UPDATE_AFTER_TRADE mutation started:', {
        status,
        profitLoss,
        currentState: { ...state }
      });
      
      // Update streak and SL count
      if (status === 'TARGET_HIT') {
        const oldStreak = state.tradeStreak;
        state.tradeStreak = Math.min(state.tradeStreak + 1, 2);
        state.baseTradeSize = Math.round(state.baseTradeSize * 1.2);
        state.adjustedTradeSize = state.baseTradeSize;
        state.dailyStats.dailyProfit += profitLoss;
        console.log('Target hit updates:', {
          streakChange: `${oldStreak} -> ${state.tradeStreak}`,
          newTradeSize: state.baseTradeSize,
          slTaken: state.slTaken,
          dailyProfit: state.dailyStats.dailyProfit
        });
      } else if (status === 'STOPLOSS_HIT') {
        const oldStreak = state.tradeStreak;
        state.tradeStreak = Math.max(state.tradeStreak - 1, -2);
        state.baseTradeSize = Math.round(state.baseTradeSize * 0.8);
        state.adjustedTradeSize = state.baseTradeSize;
        state.slTaken++;
        state.dailyStats.dailyLoss += Math.abs(profitLoss);
        console.log('Stoploss hit updates:', {
          streakChange: `${oldStreak} -> ${state.tradeStreak}`,
          newTradeSize: state.baseTradeSize,
          slTaken: state.slTaken,
          dailyLoss: state.dailyStats.dailyLoss
        });
      }

      // Update daily stats
      const today = new Date().toDateString();
      if (state.dailyStats.lastTradeDate !== today) {
        console.log('New trading day detected, resetting daily stats');
        state.dailyStats = {
          lastTradeDate: today,
          dailyTradeCount: 1,
          dailyLoss: status === 'STOPLOSS_HIT' ? Math.abs(profitLoss) : 0,
          dailyProfit: status === 'TARGET_HIT' ? profitLoss : 0
        };
        state.slTaken = status === 'STOPLOSS_HIT' ? 1 : 0;
      } else {
        state.dailyStats.dailyTradeCount++;
      }

      // Update account size and recalculate percentage
      state.accountSize = Math.round(state.accountSize + profitLoss);
      state.currentPercentage = (state.baseTradeSize / state.accountSize) * 100;
    }
  },
  actions: {
    async fetchRiskManagement({ commit }) {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');

        const response = await fetch('http://localhost:3004/api/risk-management', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch risk management data');

        const data = await response.json();
        console.log('Fetched risk management data:', data);
        
        const riskManagementData = {
          accountSize: data.accountSize || 10000,
          baseTradeSize: data.baseTradeSize || 1000,
          adjustedTradeSize: data.baseTradeSize || 1000, // Simplified: adjusted = base
          tradeStreak: data.tradeStreak || 0,
          slTaken: data.slTaken || 0,
          currentPercentage: ((data.baseTradeSize || 1000) / (data.accountSize || 10000)) * 100,
          dailyStats: data.dailyStats || {
            lastTradeDate: null,
            dailyTradeCount: 0,
            dailyLoss: 0,
            dailyProfit: 0
          }
        };

        commit('SET_RISK_MANAGEMENT', { data: riskManagementData });
        return riskManagementData;
      } catch (error) {
        console.error('Error fetching risk management:', error);
        throw error;
      }
    },

    async updateAfterTrade({ commit, state }, { status, profitLoss }) {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');

        // Calculate new trade size before making the request
        const currentTradeSize = state.baseTradeSize;
        const newTradeSize = status === 'TARGET_HIT' 
          ? Math.round(currentTradeSize * 1.2) 
          : Math.round(currentTradeSize * 0.8);

        const response = await fetch('http://localhost:3004/api/risk-management/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            status, 
            profitLoss,
            newTradeSize,
            currentPercentage: (newTradeSize / (state.accountSize + profitLoss)) * 100
          })
        });

        if (!response.ok) throw new Error('Failed to update risk management');

        const data = await response.json();
        console.log('Updated risk management data:', data);
        
        commit('SET_RISK_MANAGEMENT', { data, status, profitLoss });
        return data;
      } catch (error) {
        console.error('Error updating risk management:', error);
        throw error;
      }
    },

    async updateSettings({ commit,  }, { accountSize, baseTradeSize }) {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');

        const response = await fetch('http://localhost:3004/api/risk-management/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            accountSize, 
            baseTradeSize,
            currentPercentage: (baseTradeSize / accountSize) * 100
          })
        });

        if (!response.ok) throw new Error('Failed to update settings');

        const data = await response.json();
        commit('UPDATE_TRADE_SIZE', baseTradeSize);
        commit('SET_ACCOUNT_SIZE', accountSize);
        return data;
      } catch (error) {
        console.error('Error updating settings:', error);
        throw error;
      }
    }
  },

  getters: {
    currentTradeSize: state => state.baseTradeSize, // Simplified: no more adjusted trade size
    basePercentage: state => ((state.baseTradeSize / state.accountSize) * 100).toFixed(1),
    adjustedPercentage: state => ((state.baseTradeSize / state.accountSize) * 100).toFixed(1), // Same as base now
    dailyProfitLoss: state => state.dailyStats.dailyProfit - state.dailyStats.dailyLoss,
    canTrade: state => {
      const canTrade = state.slTaken < 3 && 
                      state.dailyStats.dailyTradeCount < state.settings.maxTradesPerDay &&
                      state.dailyStats.dailyLoss < state.settings.maxDailyLoss;
      console.log('Can trade check:', {
        slTaken: state.slTaken,
        dailyTradeCount: state.dailyStats.dailyTradeCount,
        dailyLoss: state.dailyStats.dailyLoss,
        result: canTrade
      });
      return canTrade;
    }
  }
};
