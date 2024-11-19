// store/modules/riskManagement.js
export default {
    namespaced: true,
    state: {
      accountSize: 10000,
      baseTradeSize: 1000,
      adjustedTradeSize: 1000,
      tradeStreak: 0,
      slTaken: 0,
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
      SET_RISK_MANAGEMENT(state, data) {
        console.log('SET_RISK_MANAGEMENT mutation called with:', data);
        Object.assign(state, data);
        console.log('Updated state:', state);
      },
      SET_ACCOUNT_SIZE(state, size) {
        console.log('SET_ACCOUNT_SIZE mutation called:', { oldSize: state.accountSize, newSize: size });
        state.accountSize = size;
      },
      SET_BASE_TRADE_SIZE(state, size) {
        console.log('SET_BASE_TRADE_SIZE mutation called:', { oldSize: state.baseTradeSize, newSize: size });
        state.baseTradeSize = size;
        
        const multipliers = {
          '-2': 0.33,
          '-1': 0.5,
          '0': 1,
          '1': 1.5,
          '2': 2
        };
        state.adjustedTradeSize = size * (multipliers[state.tradeStreak] || 1);
        console.log('Adjusted trade size calculated:', {
          baseSize: size,
          streak: state.tradeStreak,
          multiplier: multipliers[state.tradeStreak],
          adjustedSize: state.adjustedTradeSize
        });
      },
      SET_ADJUSTED_TRADE_SIZE(state, size) {
        console.log('SET_ADJUSTED_TRADE_SIZE mutation called:', { oldSize: state.adjustedTradeSize, newSize: size });
        state.adjustedTradeSize = size;
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
          state.slTaken = 0;
          state.dailyStats.dailyProfit += profitLoss;
          console.log('Target hit updates:', {
            streakChange: `${oldStreak} -> ${state.tradeStreak}`,
            slTaken: state.slTaken,
            dailyProfit: state.dailyStats.dailyProfit
          });
        } else if (status === 'STOPLOSS_HIT') {
          const oldStreak = state.tradeStreak;
          state.tradeStreak = Math.max(state.tradeStreak - 1, -2);
          state.slTaken++;
          state.dailyStats.dailyLoss += Math.abs(profitLoss);
          console.log('Stoploss hit updates:', {
            streakChange: `${oldStreak} -> ${state.tradeStreak}`,
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
        } else {
          state.dailyStats.dailyTradeCount++;
          console.log('Updated daily trade count:', state.dailyStats.dailyTradeCount);
        }
  
        // Update account size
        const oldAccountSize = state.accountSize;
        state.accountSize = Math.round(state.accountSize + profitLoss);
        console.log('Account size updated:', {
          old: oldAccountSize,
          change: profitLoss,
          new: state.accountSize
        });
  
        // Recalculate trade sizes with proper rounding
        const basePercentage = (state.baseTradeSize / state.accountSize) * 100;
        const oldBaseTradeSize = state.baseTradeSize;
        state.baseTradeSize = Math.round((state.accountSize * basePercentage) / 100);
        console.log('Trade size recalculated:', {
          basePercentage,
          oldBaseTradeSize,
          newBaseTradeSize: state.baseTradeSize
        });
        
        this.commit('riskManagement/SET_BASE_TRADE_SIZE', state.baseTradeSize);
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
          commit('SET_RISK_MANAGEMENT', data);
          return data;
        } catch (error) {
          console.error('Error fetching risk management:', error);
          throw error;
        }
      },
    
      async updateAfterTrade({ commit }, { status, profitLoss }) {
        try {
          const token = localStorage.getItem('token');
          if (!token) throw new Error('No authentication token found');
    
          // Send update to backend
          const response = await fetch('http://localhost:3004/api/risk-management/update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status, profitLoss })
          });
    
          if (!response.ok) throw new Error('Failed to update risk management');
    
          // Get updated data from backend
          const data = await response.json();
          console.log('Updated risk management data:', data);
          
          // Update store with new data from backend
          commit('SET_RISK_MANAGEMENT', data);
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
    
          const response = await fetch('http://localhost:3004/api/risk-management/settings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ accountSize, baseTradeSize })
          });
    
          if (!response.ok) throw new Error('Failed to update settings');
    
          const data = await response.json();
          commit('SET_RISK_MANAGEMENT', data);
          return data;
        } catch (error) {
          console.error('Error updating settings:', error);
          throw error;
        }
      }
    },
    getters: {
      currentTradeSize: state => state.adjustedTradeSize,
      basePercentage: state => ((state.baseTradeSize / state.accountSize) * 100).toFixed(1),
      adjustedPercentage: state => ((state.adjustedTradeSize / state.accountSize) * 100).toFixed(1),
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