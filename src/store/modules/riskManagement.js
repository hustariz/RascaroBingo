// store/modules/riskManagement.js
export default {
    namespaced: true,
    state: {
      accountSize: 10000,
      baseTradeSize: 1000,
      adjustedTradeSize: 1000,
      tradeStreak: 0,
      slTaken: 0,
      currentPercentage: 10, // New field to track current percentage
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
      
        // For initial load, set trade size based on streak level
        if (!status) {
          const streakPercentages = {
            '-2': 3.33,  // Cold streak
            '-1': 6.67,  // Malus streak
            '0': 10,     // Normal trade
            '1': 15,     // Bonus streak
            '2': 20      // Hot streak
          };
          
          // Get percentage based on current streak
          const currentPercentage = streakPercentages[data.tradeStreak || 0];
          
          Object.assign(state, {
            ...data,
            currentPercentage,
            baseTradeSize: Math.round((data.accountSize * currentPercentage) / 100),
            adjustedTradeSize: Math.round((data.accountSize * currentPercentage) / 100)
          });
        } else if (status === 'TARGET_HIT') {
          // Step up through predefined levels
          let newPercentage;
          if (state.currentPercentage <= 3.33) newPercentage = 6.67;      // Cold to Malus
          else if (state.currentPercentage <= 6.67) newPercentage = 10;   // Malus to Normal
          else if (state.currentPercentage <= 10) newPercentage = 15;     // Normal to Bonus
          else if (state.currentPercentage <= 15) newPercentage = 20;     // Bonus to Hot
          else newPercentage = 20;                                        // Cap at 20%
          
          Object.assign(state, {
            ...data,
            slTaken: state.slTaken,
            currentPercentage: newPercentage,
            baseTradeSize: Math.round((data.accountSize * newPercentage) / 100),
            adjustedTradeSize: Math.round((data.accountSize * newPercentage) / 100),
            dailyStats: {
              ...state.dailyStats,
              lastTradeDate: data.dailyStats?.lastTradeDate || state.dailyStats.lastTradeDate,
              dailyTradeCount: (state.dailyStats.dailyTradeCount || 0) + 1,
              dailyLoss: data.dailyStats?.dailyLoss || state.dailyStats.dailyLoss,
              dailyProfit: (state.dailyStats.dailyProfit || 0) + profitLoss
            }
          });
        } else if (status === 'STOPLOSS_HIT') {
          // Step down through predefined percentage levels
          let newPercentage;
          if (state.currentPercentage >= 20) newPercentage = 15;      // Hot streak to Bonus
          else if (state.currentPercentage >= 15) newPercentage = 10; // Bonus to Normal
          else if (state.currentPercentage >= 10) newPercentage = 6.67; // Normal to Malus
          else if (state.currentPercentage >= 6.67) newPercentage = 3.33; // Malus to Cold
          else newPercentage = 3.33; // Minimum percentage
          
          Object.assign(state, {
            ...data,
            currentPercentage: newPercentage,
            baseTradeSize: Math.round((data.accountSize * newPercentage) / 100),
            adjustedTradeSize: Math.round((data.accountSize * newPercentage) / 100),
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
        // Update trade size and recalculate percentage
        state.baseTradeSize = newSize;
        state.currentPercentage = (newSize / state.accountSize) * 100;
        console.log('Manual trade size update:', {
          newSize,
          newPercentage: state.currentPercentage
        });
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
          // Remove state.slTaken = 0; - Don't reset SL count on wins
          state.dailyStats.dailyProfit += profitLoss;
          console.log('Target hit updates:', {
            streakChange: `${oldStreak} -> ${state.tradeStreak}`,
            slTaken: state.slTaken, // SL count stays the same
            dailyProfit: state.dailyStats.dailyProfit
          });
        } else if (status === 'STOPLOSS_HIT') {
          const oldStreak = state.tradeStreak;
          state.tradeStreak = Math.max(state.tradeStreak - 1, -2);
          state.slTaken++; // Increment SL count only on losses
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
          state.slTaken = status === 'STOPLOSS_HIT' ? 1 : 0; // Reset SL count at top level
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
          
          const riskManagementData = {
            accountSize: data.accountSize || 10000,
            baseTradeSize: data.baseTradeSize || 1000,
            adjustedTradeSize: data.adjustedTradeSize || 1000,
            tradeStreak: data.tradeStreak || 0,
            slTaken: data.slTaken || 0,
            currentPercentage: data.currentPercentage || 10,
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
    
      async updateAfterTrade({ commit }, { status, profitLoss }) {
        try {
          const token = localStorage.getItem('token');
          if (!token) throw new Error('No authentication token found');
    
          const response = await fetch('http://localhost:3004/api/risk-management/update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status, profitLoss })
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
            body: JSON.stringify({ 
              accountSize, 
              baseTradeSize,
              currentPercentage: (baseTradeSize / accountSize) * 100
            })
          });
    
          if (!response.ok) throw new Error('Failed to update settings');
    
          const data = await response.json();
          commit('UPDATE_TRADE_SIZE', baseTradeSize);
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