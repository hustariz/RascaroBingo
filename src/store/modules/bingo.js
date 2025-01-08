const API_URL = process.env.VUE_APP_API_URL;
console.log('🌍 Bingo using API URL:', API_URL);
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
          console.log('📝 Setting card state:', card);
          state.bingoCells = card.bingoCells.map(cell => ({
            ...cell,
            title: cell.title || '',  // Ensure title is never undefined
            points: Number(cell.points) || 0,  // Convert points to number
            selected: !!cell.selected  // Ensure boolean value
          }));
          state.totalScore = card.totalScore || 0;
          
          // Cache the state
          localStorage.setItem('bingoState', JSON.stringify({
            bingoCells: state.bingoCells,
            totalScore: state.totalScore,
            lastModified: new Date().toISOString(),
            version: '1.0'
          }));
        }
      },
      
      UPDATE_CELL(state, { index, cell }) {
        console.log('📝 Updating cell:', index, cell);
        state.bingoCells[index] = {
          ...state.bingoCells[index],
          ...cell,
          title: cell.title || '',  // Ensure title is never undefined
          points: Number(cell.points) || 0,  // Convert points to number
          selected: !!cell.selected  // Ensure boolean
        };
        
        // Recalculate total score
        state.totalScore = state.bingoCells.reduce((total, cell) => {
          return total + (cell.selected ? (cell.points || 0) : 0);
        }, 0);
        
        // Cache the updated state
        localStorage.setItem('bingoState', JSON.stringify({
          bingoCells: state.bingoCells,
          totalScore: state.totalScore,
          lastModified: new Date().toISOString(),
          version: '1.0'
        }));
  
        console.log('✅ Cell updated with title:', cell.title);
      },
  
      RESTORE_STATE(state) {
        const cachedState = localStorage.getItem('bingoState');
        if (cachedState) {
          try {
            const { bingoCells, totalScore } = JSON.parse(cachedState);
            state.bingoCells = bingoCells.map(cell => ({
              ...cell,
              title: cell.title || '',  // Ensure title is never undefined
              points: Number(cell.points) || 0,  // Convert points to number
              selected: !!cell.selected  // Ensure boolean value
            }));
            state.totalScore = totalScore;
            console.log('📋 State restored from cache');
          } catch (error) {
            console.error('❌ Error parsing cached state:', error);
          }
        }
      },
  
      SET_LOADING(state, loading) {
        state.loading = loading;
      }
    },
  
    actions: {
      async loadUserCard({ commit }) {
        try {
          commit('SET_LOADING', true);
          
          // Try to load from cache first
          const cachedState = localStorage.getItem('bingoState');
          if (cachedState) {
            const parsedState = JSON.parse(cachedState);
            if (parsedState && parsedState.bingoCells) {
              console.log('📦 Loaded from cache:', parsedState);
              commit('SET_CARD', parsedState);
              return;
            }
          }
          
          // If no cache or invalid cache, try to load from API
          const token = localStorage.getItem('token');
          if (token) {
            const response = await fetch(`${API_URL}/bingo/card`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('🎲 Loaded from API:', data);
            commit('SET_CARD', data);
          }
        } catch (error) {
          console.error('❌ Error loading bingo card:', error);
          // Initialize with default state if loading fails
          commit('SET_CARD', {
            bingoCells: Array.from({ length: 25 }, (_, i) => ({
              id: i + 1,
              title: '',
              points: 0,
              selected: false
            })),
            totalScore: 0
          });
        } finally {
          commit('SET_LOADING', false);
        }
      },
      
      async saveCardState({ state }) {
        try {
          const token = localStorage.getItem('token');
          if (token) {
            const response = await fetch(`${API_URL}/bingo/card`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                bingoCells: state.bingoCells,
                totalScore: state.totalScore
              })
            });
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            console.log('💾 Saved to API');
          }
          
          // Always save to local storage
          localStorage.setItem('bingoState', JSON.stringify({
            bingoCells: state.bingoCells,
            totalScore: state.totalScore,
            lastModified: new Date().toISOString(),
            version: '1.0'
          }));
          console.log('💾 Saved to local storage');
          
        } catch (error) {
          console.error('❌ Error saving bingo card:', error);
          // Still save to local storage even if API fails
          localStorage.setItem('bingoState', JSON.stringify({
            bingoCells: state.bingoCells,
            totalScore: state.totalScore,
            lastModified: new Date().toISOString(),
            version: '1.0'
          }));
        }
      }
    },
  
    getters: {
      getBingoCells: state => state.bingoCells,
      getTotalScore: state => state.totalScore,
      isLoading: state => state.loading,
      getCachedState: () => {
        const cachedState = localStorage.getItem('bingoState');
        return cachedState ? JSON.parse(cachedState) : null;
      }
    }
  };