// store/modules/trades.js
import api from '@/services/api';

const API_URL = process.env.VUE_APP_API_URL || 
  (typeof import.meta !== 'undefined' ? import.meta.env.VITE_API_URL : undefined) || 
  'http://localhost:3004';

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
      // Ensure trade has an ID before adding
      const tradeWithId = {
        ...trade,
        id: trade._id || trade.id
      };
      state.trades.unshift(tradeWithId); // Add new trade at the beginning of the array
    },
    UPDATE_TRADE(state, updatedTrade) {
      const index = state.trades.findIndex(t => t.id === updatedTrade.id || t.id === updatedTrade._id || t._id === updatedTrade.id || t._id === updatedTrade._id);
      if (index !== -1) {
        state.trades.splice(index, 1, {
          ...updatedTrade,
          id: updatedTrade._id || updatedTrade.id
        });
      }
    },
    UPDATE_TRADE_STATUS(state, { tradeId, status }) {
      const trade = state.trades.find(t => t.id === tradeId || t._id === tradeId);
      if (trade) {
        trade.status = status;
        // Ensure ID is preserved
        trade.id = trade._id || trade.id;
      }
    },
    DELETE_TRADE(state, tradeId) {
      state.trades = state.trades.filter(t => (t.id || t._id) !== tradeId);
    },
    CLEAR_CLOSED_TRADES(state) {
      // Keep only open trades and ensure IDs are preserved
      state.trades = state.trades
        .filter(trade => trade.status === 'OPEN')
        .map(trade => ({
          ...trade,
          id: trade._id || trade.id
        }));
    },
    SET_LOADING(state, loading) {
      state.loading = loading;
    },
    SET_ERROR(state, error) {
      state.error = error;
    }
  },
  actions: {
    async fetchTrades({ commit }) {
      try {
        commit('SET_LOADING', true);
        const response = await api.get('/trades');
        const trades = response.data;
        commit('SET_TRADES', trades);
        commit('SET_LOADING', false);
        return trades;
      } catch (error) {
        commit('SET_ERROR', error.message);
        commit('SET_LOADING', false);
        throw error;
      }
    },

    async saveTrade({ commit }, trade) {
      try {
        commit('SET_LOADING', true);
        console.log('Saving trade:', trade);
        
        // Ensure trade has OPEN status
        const tradeToSave = {
          ...trade,
          status: 'OPEN'
        };
        
        const response = await api.post('/trades', tradeToSave);
        const savedTrade = response.data;
        
        // Ensure we have an ID and OPEN status before committing
        const tradeWithId = {
          ...savedTrade,
          id: savedTrade._id || savedTrade.id,
          status: 'OPEN'
        };
        
        // Commit immediately for UI responsiveness
        commit('ADD_TRADE', tradeWithId);
        commit('SET_LOADING', false);
        return savedTrade;
      } catch (error) {
        commit('SET_ERROR', error.message);
        commit('SET_LOADING', false);
        throw error;
      }
    },

    async updateTradeStatus({ commit}, { tradeId, status, profitLoss }) {
      try {
        commit('SET_LOADING', true);
        console.log('🔄 Updating trade status:', { tradeId, status, profitLoss });
        
        // Optimistically update UI
        commit('UPDATE_TRADE_STATUS', { tradeId, status });
        
        const response = await api.put(`/trades/${tradeId}/status`, { status, profitLoss });
        const { trade, stats } = response.data;
        
        if (!trade) {
          throw new Error('No trade data received from server');
        }
        
        // Update with server response
        commit('UPDATE_TRADE', {
          ...trade,
          id: trade._id || trade.id
        });
        
        // Update risk management if stats provided
        if (stats) {
          commit('riskManagement/SET_RISK_MANAGEMENT', { data: stats }, { root: true });
        }
        
        commit('SET_LOADING', false);
        return { trade, stats };
      } catch (error) {
        commit('SET_ERROR', error.message);
        commit('SET_LOADING', false);
        throw error;
      }
    },

    async updateTrade({ commit }, trade) {
      try {
        commit('SET_LOADING', true);
        const response = await api.put(`/trades/${trade.id}`, trade);
        const { trade: updatedTrade, stats } = response.data;
        
        commit('UPDATE_TRADE', updatedTrade);
        if (stats) {
          commit('riskManagement/SET_RISK_MANAGEMENT', { data: stats }, { root: true });
        }
        
        commit('SET_LOADING', false);
        return updatedTrade;
      } catch (error) {
        commit('SET_ERROR', error.message);
        commit('SET_LOADING', false);
        throw error;
      }
    },

    async deleteTrade({ commit }, tradeId) {
      try {
        commit('SET_LOADING', true);
        await api.delete(`/trades/${tradeId}`);
        commit('DELETE_TRADE', tradeId);
        commit('SET_LOADING', false);
      } catch (error) {
        commit('SET_ERROR', error.message);
        commit('SET_LOADING', false);
        throw error;
      }
    },

    async clearTradeHistory({ commit }) {
      try {
        commit('SET_LOADING', true);
        // Only clear trades from the frontend state
        commit('CLEAR_CLOSED_TRADES');
        commit('SET_LOADING', false);
      } catch (error) {
        commit('SET_ERROR', error.message);
        commit('SET_LOADING', false);
        throw error;
      }
    }
  },

  getters: {
    allTrades: state => state.trades,
    isLoading: state => state.loading,
    error: state => state.error,
    openTradesCount: state => state.trades.filter(trade => trade.status === 'OPEN').length,
    openTrades: state => state.trades.filter(trade => trade.status === 'OPEN')
  }
};