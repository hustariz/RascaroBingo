// src/store/trades.module.js
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
      SET_LOADING(state, status) {
        state.loading = status;
      },
      SET_ERROR(state, error) {
        state.error = error;
      }
    },
    actions: {
      async saveTrade({ commit }, trade) {
        try {
          commit('SET_LOADING', true);
          // API call will go here
          const response = await fetch('/api/trades', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(trade)
          });
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
        try {
          commit('SET_LOADING', true);
          // API call will go here
          const response = await fetch('/api/trades');
          const trades = await response.json();
          commit('SET_TRADES', trades);
          return trades;
        } catch (error) {
          commit('SET_ERROR', error.message);
          throw error;
        } finally {
          commit('SET_LOADING', false);
        }
      }
    },
    getters: {
      allTrades: state => state.trades,
      isLoading: state => state.loading,
      hasError: state => state.error !== null,
      errorMessage: state => state.error
    }
  };