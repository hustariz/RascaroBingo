// store/modules/trades.js
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
        async saveTrade({ commit }, { trade, token }) {
            try {
              commit('SET_LOADING', true);
              
              if (!token) {
                throw new Error('No authentication token found');
              }
      
              const response = await fetch('http://localhost:3004/api/trades', {
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
        try {
          commit('SET_LOADING', true);
          const token = localStorage.getItem('token');
          
          if (!token) {
            throw new Error('No authentication token found');
          }

          // Update the URL to use your backend port
          const response = await fetch('http://localhost:3004/api/trades', {
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
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/trades/${tradeId}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
          });
  
          if (!response.ok) {
            throw new Error('Failed to update trade status');
          }
  
          const updatedTrade = await response.json();
          commit('UPDATE_TRADE', updatedTrade);
          return updatedTrade;
        } catch (error) {
          commit('SET_ERROR', error.message);
          throw error;
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