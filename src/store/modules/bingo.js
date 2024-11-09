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
        console.log('📥 Loading user card');
        commit('SET_LOADING', true);
        
        try {
          const token = localStorage.getItem('token');
          console.log('🎟️ Token:', token ? 'present' : 'missing');
  
          // First try to load from cache
          const cachedState = localStorage.getItem('bingoState');
          if (cachedState) {
            console.log('📋 Loading from cache');
            commit('RESTORE_STATE');
          }
  
          if (!token) {
            console.log('⚠️ No token, using cached state');
            return;
          }
  
          const response = await fetch('/api/bingo/card', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
  
          console.log('📊 Load response:', response.status);
  
          if (response.status === 401) {
            console.log('⚠️ Auth error, using cached state');
            return;
          }
  
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
  
          const data = await response.json();
          console.log('✅ Card loaded:', data);
          
          if (data && data.bingoCells?.length > 0) {
            commit('SET_CARD', data);
          } else if (cachedState) {
            console.log('⚠️ Server data empty, using cache');
            commit('RESTORE_STATE');
          }
        } catch (error) {
          console.error('❌ Load error:', error);
          // Try to use cached data on error
          const cachedState = localStorage.getItem('bingoState');
          if (cachedState) {
            console.log('⚠️ Using cached state');
            commit('RESTORE_STATE');
          }
        } finally {
          commit('SET_LOADING', false);
        }
      },
  
      async saveCardState({ state }) {
        console.log('💾 Saving card state...');
        try {
          const token = localStorage.getItem('token');
          console.log('🎟️ Token present:', !!token);
          
          // Always cache the current state
          localStorage.setItem('bingoState', JSON.stringify({
            bingoCells: state.bingoCells,
            totalScore: state.totalScore,
            lastModified: new Date().toISOString(),
            version: '1.0'
          }));
  
          if (!token) {
            console.log('⚠️ No token, saved to cache only');
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
  
          if (response.status === 401) {
            console.log('🔑 Authentication error, state saved to cache');
            return;
          }
  
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          console.log('✅ Card saved to server and cache');
        } catch (error) {
          console.error('❌ Error saving to server, but state is cached:', error);
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