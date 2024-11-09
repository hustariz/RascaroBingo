export default {
    namespaced: true,
    state: {
      bingoCells: Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        title: '',
        points: 0,
        selected: false
      })),
      totalScore: 0,
      loading: false
    },
  
    mutations: {
      SET_CARD(state, card) {
        if (card && card.bingoCells) {
          state.bingoCells = card.bingoCells;
          state.totalScore = card.totalScore || 0;
        }
      },
      UPDATE_CELL(state, { index, cell }) {
        state.bingoCells[index] = cell;
        // Recalculate total score
        state.totalScore = state.bingoCells.reduce((total, cell) => {
          return total + (cell.selected ? (cell.points || 0) : 0);
        }, 0);
      },
      // Remove SET_LOADING mutation if not needed
    },
  
    actions: {
        async loadUserCard({ commit }) {
          console.log('📥 Loading user card');
          try {
            const token = localStorage.getItem('token');
            console.log('🎟️ Token:', token ? 'present' : 'missing');
      
            if (!token) {
              console.log('⚠️ No token, using default state');
              return;
            }
      
            const response = await fetch('/api/bingo/card', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
      
            console.log('📊 Load response:', response.status);
      
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
      
            const data = await response.json();
            console.log('✅ Card loaded:', data);
            commit('SET_CARD', data);
          } catch (error) {
            console.error('❌ Load error:', error);
            if (error.response?.status === 401) {
              // Retry once with fresh token
              console.log('🔄 Retrying with fresh token');
              await new Promise(resolve => setTimeout(resolve, 1000));
              return this.loadUserCard({ commit });
            }
          }
        },
      
        async saveCardState({ state }) {
          console.log('💾 Saving card state...');
          try {
            const token = localStorage.getItem('token');
            console.log('🎟️ Token present:', !!token);
            
            if (!token) {
              console.log('⚠️ No token, skipping save');
              return;
            }
      
            const response = await fetch('/api/bingo/card', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                bingoCells: state.bingoCells,
                totalScore: state.totalScore
              })
            });
      
            console.log('📊 Save response:', response.status);
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
          } catch (error) {
            console.error('❌ Error saving card:', error);
          }
        }
      },
  
    getters: {
      getBingoCells: state => state.bingoCells,
      getTotalScore: state => state.totalScore
    }
  };