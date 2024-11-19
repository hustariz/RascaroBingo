// store/modules/riskManagement.js
export default {
    namespaced: true,
    state: {
      accountSize: 10000,
      tradeStreak: 0,
      slTaken: 0,
      dailyStats: {
        dailyTradeCount: 0,
        dailyLoss: 0
      },
      settings: {
        maxDailyLoss: 500,
        maxTradesPerDay: 3
      }
    },
    mutations: {
      SET_RISK_MANAGEMENT(state, data) {
        Object.assign(state, data);
      },
      UPDATE_AFTER_TRADE(state, { status }) {
        if (status === 'TARGET_HIT') {
          state.tradeStreak = Math.min(state.tradeStreak + 1, 2);
          state.slTaken = 0;
        } else if (status === 'STOPLOSS_HIT') {
          state.tradeStreak = Math.max(state.tradeStreak - 1, -2);
          state.slTaken++;
        }
      }
    },
    actions: {
      async fetchRiskManagement({ commit }) {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error('No authentication token found');
          }
  
          const response = await fetch('http://localhost:3004/api/risk-management', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
  
          if (!response.ok) {
            throw new Error('Failed to fetch risk management data');
          }
  
          const data = await response.json();
          commit('SET_RISK_MANAGEMENT', data);
          return data;
        } catch (error) {
          console.error('Error fetching risk management:', error);
          throw error;
        }
      },
      async updateAfterTrade({ commit }, { status }) {  // Removed tradeId as it's not needed
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error('No authentication token found');
          }
  
          const response = await fetch('http://localhost:3004/api/risk-management/update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
          });
  
          if (!response.ok) {
            throw new Error('Failed to update risk management');
          }
  
          const data = await response.json();
          commit('UPDATE_AFTER_TRADE', { status });
          return data;
        } catch (error) {
          console.error('Error updating risk management:', error);
          throw error;
        }
      }
    },
    getters: {
      tradeSize: state => {
        const percentages = {
          '-2': 3.3,
          '-1': 5,
          '0': 10,
          '1': 15,
          '2': 20
        };
        const percentage = percentages[state.tradeStreak] || 10;
        return Math.round((state.accountSize * percentage) / 100);
      },
      canTrade: state => {
        return state.slTaken < 3 && 
               state.dailyStats.dailyTradeCount < state.settings.maxTradesPerDay &&
               state.dailyStats.dailyLoss < state.settings.maxDailyLoss;
      }
    }
  };