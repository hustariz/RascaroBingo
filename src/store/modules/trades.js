// store/modules/trades.js
const API_URL = process.env.VUE_APP_API_URL || 
  (typeof import.meta !== 'undefined' ? import.meta.env.VITE_API_URL : undefined) || 
  'https://api.rascarobingo.com';

console.log('🌍 Trades using API URL:', API_URL);

if (!API_URL) {
  console.error('❌ No API URL defined in environment');
}

export default {
  namespaced: true,
  state: {
    trades: [],
    loading: false,
    error: null
  },
  mutations: {
    SET_TRADES(state, trades) {
      state.trades = trades;
    },
    ADD_TRADE(state, trade) {
      state.trades.push(trade);
    },
    UPDATE_TRADE(state, updatedTrade) {
      const index = state.trades.findIndex(t => t._id === updatedTrade._id);
      if (index !== -1) {
        state.trades.splice(index, 1, updatedTrade);
      }
    },
    UPDATE_TRADE_STATUS(state, { tradeId, status }) {
      const trade = state.trades.find(t => t._id === tradeId);
      if (trade) {
        trade.status = status;
      }
    },
    DELETE_TRADE(state, tradeId) {
      state.trades = state.trades.filter(t => t._id !== tradeId);
    },
    SET_LOADING(state, status) {
      state.loading = status;
    },
    SET_ERROR(state, error) {
      state.error = error;
    }
  },
  actions: {
    async saveTrade({ commit, rootState }, trade) {
      try {
        commit('SET_LOADING', true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Calculate trade size and potential profit/loss
        const tradeSize = rootState.riskManagement.adjustedTradeSize;
        if (trade.isLong) {
          const risk = trade.entry - trade.stoploss;
          const reward = trade.target - trade.entry;
          trade.potentialProfit = reward * (tradeSize / risk);
          trade.potentialLoss = -tradeSize;
        } else {
          const risk = trade.stoploss - trade.entry;
          const reward = trade.entry - trade.target;
          trade.potentialProfit = reward * (tradeSize / risk);
          trade.potentialLoss = -tradeSize;
        }

        const response = await fetch(`${API_URL}/api/trades`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(trade)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to save trade');
        }

        const savedTrade = await response.json();
        commit('ADD_TRADE', savedTrade);
        return savedTrade;
      } catch (error) {
        commit('SET_ERROR', error.message);
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },

    async fetchTrades({ commit }) {
      commit('SET_LOADING', true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        commit('SET_ERROR', 'No authentication token found');
        commit('SET_LOADING', false);
        throw new Error('No authentication token found');
      }

      try {
        const response = await fetch(`${API_URL}/api/trades`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const trades = await response.json();
        commit('SET_TRADES', trades);
        return trades;
      } catch (error) {
        commit('SET_ERROR', error.message);
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },

    async updateTradeStatus({ commit }, { tradeId, status }) {
      const token = localStorage.getItem('token');
      if (!token) {
        commit('SET_ERROR', 'No authentication token found');
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/api/trades/${tradeId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        const error = new Error('Failed to update trade status');
        commit('SET_ERROR', error.message);
        throw error;
      }

      const updatedTrade = await response.json();
      commit('UPDATE_TRADE', updatedTrade);
      return updatedTrade;
    },

    async updateTrade({ commit }, trade) {
      const token = localStorage.getItem('token');
      if (!token) {
        commit('SET_ERROR', 'No authentication token found');
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/api/trades/${trade._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(trade)
      });

      if (!response.ok) {
        const error = new Error('Failed to update trade');
        commit('SET_ERROR', error.message);
        throw error;
      }

      const updatedTrade = await response.json();
      commit('UPDATE_TRADE', updatedTrade);
      return updatedTrade;
    },

    async deleteTrade({ commit }, tradeId) {
      const token = localStorage.getItem('token');
      if (!token) {
        commit('SET_ERROR', 'No authentication token found');
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/api/trades/${tradeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = new Error('Failed to delete trade');
        commit('SET_ERROR', error.message);
        throw error;
      }

      commit('DELETE_TRADE', tradeId);
    }
  },

  getters: {
    allTrades: state => state.trades,
    isLoading: state => state.loading,
    hasError: state => state.error !== null,
    errorMessage: state => state.error
  }
};