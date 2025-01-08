const API_URL = process.env.VUE_APP_API_URL;
console.log('🌍 Bingo using API URL:', API_URL);
export default {
  namespaced: true,

  state: () => ({
    bingoPages: [{
      id: 1,
      name: 'Default Board',
      bingoCells: Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        title: '',
        points: 0,
        selected: false
      }))
    }],
    currentPageIndex: 0,
    loading: false
  }),

  mutations: {
    SET_PAGES(state, pages) {
      if (Array.isArray(pages)) {
        console.log('📝 Setting pages state:', pages);
        state.bingoPages = pages.map(page => ({
          ...page,
          bingoCells: page.bingoCells.map(cell => ({
            id: cell.id,
            title: cell.title || '',
            points: Number(cell.points) || 0,
            selected: !!cell.selected
          }))
        }));
      }
    },

    UPDATE_CELL(state, { pageIndex, cellIndex, cell }) {
      console.log('📝 Updating cell:', { pageIndex, cellIndex, cell });
      
      // Ensure page exists
      if (!state.bingoPages[pageIndex]) {
        state.bingoPages[pageIndex] = {
          id: Date.now() + pageIndex,
          name: `Board ${pageIndex + 1}`,
          bingoCells: Array(25).fill(null).map((_, i) => ({
            id: i + 1,
            title: '',
            points: 0,
            selected: false
          }))
        };
      }

      // Ensure bingoCells array exists and has 25 cells
      if (!state.bingoPages[pageIndex].bingoCells) {
        state.bingoPages[pageIndex].bingoCells = Array(25).fill(null).map((_, i) => ({
          id: i + 1,
          title: '',
          points: 0,
          selected: false
        }));
      }

      // Update the cell
      state.bingoPages[pageIndex].bingoCells[cellIndex] = {
        id: cell.id || cellIndex + 1,
        title: cell.title || '',
        points: typeof cell.points === 'number' ? cell.points : 0,
        selected: !!cell.selected
      };

      // Save to localStorage
      localStorage.setItem('bingoState', JSON.stringify({
        bingoPages: state.bingoPages,
        currentPageIndex: state.currentPageIndex,
        lastModified: new Date().toISOString(),
        version: '2.0'
      }));
    },

    SET_CURRENT_PAGE(state, index) {
      state.currentPageIndex = Math.max(0, Math.min(index, state.bingoPages.length - 1));

      // Save to localStorage
      localStorage.setItem('bingoState', JSON.stringify({
        bingoPages: state.bingoPages,
        currentPageIndex: state.currentPageIndex,
        lastModified: new Date().toISOString(),
        version: '2.0'
      }));
    },

    ADD_PAGE(state) {
      const newPage = {
        id: Date.now(),
        name: `Board ${state.bingoPages.length + 1}`,
        bingoCells: Array.from({ length: 25 }, (_, i) => ({
          id: i + 1,
          title: '',
          points: 0,
          selected: false
        }))
      };

      state.bingoPages.push(newPage);
      state.currentPageIndex = state.bingoPages.length - 1;

      // Save to localStorage
      localStorage.setItem('bingoState', JSON.stringify({
        bingoPages: state.bingoPages,
        currentPageIndex: state.currentPageIndex,
        lastModified: new Date().toISOString(),
        version: '2.0'
      }));
    },

    DELETE_PAGE(state, index) {
      if (index >= 0 && index < state.bingoPages.length) {
        // If this is the last page, don't delete it
        if (state.bingoPages.length === 1) {
          return;
        }

        state.bingoPages.splice(index, 1);

        // Adjust currentPageIndex if needed
        if (state.currentPageIndex >= state.bingoPages.length) {
          state.currentPageIndex = Math.max(0, state.bingoPages.length - 1);
        }

        // Save to localStorage
        localStorage.setItem('bingoState', JSON.stringify({
          bingoPages: state.bingoPages,
          currentPageIndex: state.currentPageIndex,
          lastModified: new Date().toISOString(),
          version: '2.0'
        }));
      }
    },

    SET_LOADING(state, loading) {
      state.loading = loading;
    }
  },

  getters: {
    getCurrentPage: state => {
      // Ensure we have at least one page
      if (state.bingoPages.length === 0) {
        return {
          id: 1,
          name: 'Default Board',
          bingoCells: Array.from({ length: 25 }, (_, i) => ({
            id: i + 1,
            title: '',
            points: 0,
            selected: false
          }))
        };
      }

      // Return current page or first page as fallback
      return state.bingoPages[state.currentPageIndex] || state.bingoPages[0];
    },

    getCurrentPageCells: (state, getters) => {
      const currentPage = getters.getCurrentPage;
      return currentPage.bingoCells || [];
    },

    getTotalScore: (state, getters) => {
      const currentPage = getters.getCurrentPage;
      if (!currentPage || !currentPage.bingoCells) return 0;

      return currentPage.bingoCells.reduce((total, cell) => {
        return total + (cell.selected ? (Number(cell.points) || 0) : 0);
      }, 0);
    },

    getAllPages: state => state.bingoPages || [],
    getCurrentPageIndex: state => Math.min(state.currentPageIndex, state.bingoPages.length - 1)
  },

  actions: {
    async loadUserCard({ commit }) {
      console.log('🔄 [LOAD] Starting loadUserCard');
      commit('SET_LOADING', true);
      try {
        // Try to load from server if user is authenticated
        const token = localStorage.getItem('token');
        if (token) {
          try {
            console.log('🔄 [LOAD] Found token, loading from server...');
            const response = await fetch(`${API_URL}/api/bingo/card`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            console.log('🔄 [LOAD] Server response status:', response.status);
            
            if (response.ok) {
              const result = await response.json();
              console.log('🔄 [LOAD] Server response:', result);
              
              if (result.success && result.data?.bingoPages) {
                console.log('✅ [LOAD] Loaded data from server:', result.data);
                commit('SET_PAGES', result.data.bingoPages);
                commit('SET_CURRENT_PAGE', result.data.currentPageIndex || 0);
                return true;
              }
            } else {
              const errorData = await response.json().catch(() => ({ message: 'Unknown server error' }));
              console.error('❌ [LOAD] Server error:', response.status, errorData);
              
              // If server error, try to load from localStorage as fallback
              console.log('⚠️ [LOAD] Server error, trying localStorage fallback');
              const localData = localStorage.getItem('bingoState');
              if (localData) {
                try {
                  const parsedData = JSON.parse(localData);
                  console.log('✅ [LOAD] Loaded fallback data from localStorage:', parsedData);
                  commit('SET_PAGES', parsedData.bingoPages);
                  commit('SET_CURRENT_PAGE', parsedData.currentPageIndex || 0);
                  return true;
                } catch (error) {
                  console.error('❌ [LOAD] Error parsing localStorage data:', error);
                }
              }
            }
          } catch (error) {
            console.error('❌ [LOAD] Error loading from server:', error);
            // Don't throw here, let it fall through to default state
          }
        } else {
          console.log('ℹ️ [LOAD] No token found, using local storage');
          // Try to load from localStorage for non-authenticated users
          const localData = localStorage.getItem('bingoState');
          if (localData) {
            try {
              const parsedData = JSON.parse(localData);
              console.log('✅ [LOAD] Loaded data from localStorage:', parsedData);
              commit('SET_PAGES', parsedData.bingoPages);
              commit('SET_CURRENT_PAGE', parsedData.currentPageIndex || 0);
              return true;
            } catch (error) {
              console.error('❌ [LOAD] Error parsing localStorage data:', error);
            }
          }
        }

        // If no data loaded, initialize with default
        console.log('📝 [LOAD] Initializing default state');
        const defaultState = {
          id: 1,
          name: 'Default Board',
          bingoCells: Array.from({ length: 25 }, (_, i) => ({
            id: i + 1,
            title: '',
            points: 0,
            selected: false
          }))
        };

        // Save default state
        const stateToSave = {
          bingoPages: [defaultState],
          currentPageIndex: 0,
          lastModified: new Date().toISOString()
        };

        commit('SET_PAGES', [defaultState]);
        commit('SET_CURRENT_PAGE', 0);
        
        // Always save default state to localStorage as backup
        console.log('💾 [LOAD] Saving default state to localStorage');
        localStorage.setItem('bingoState', JSON.stringify(stateToSave));
        
        return false;
      } finally {
        commit('SET_LOADING', false);
      }
    },

    async saveCardState({ state, commit }) {
      console.log('📤 [SAVE] Starting saveCardState');
      try {
        // Format pages data
        const formattedPages = state.bingoPages.map((page, index) => {
          // Ensure page has required fields
          if (!page || !page.bingoCells) {
            console.error('❌ [SAVE] Invalid page format:', page);
            throw new Error(`Invalid page format for page ${index}`);
          }

          // Ensure exactly 25 cells
          let bingoCells = [...page.bingoCells];
          while (bingoCells.length < 25) {
            bingoCells.push({
              id: bingoCells.length + 1,
              title: '',
              points: 0,
              selected: false
            });
          }
          if (bingoCells.length > 25) {
            bingoCells = bingoCells.slice(0, 25);
          }

          return {
            id: page.id || Date.now() + index,
            name: page.name || `Board ${index + 1}`,
            bingoCells: bingoCells.map((cell, cellIndex) => ({
              id: cell?.id || cellIndex + 1,
              title: cell?.title || '',
              points: typeof cell?.points === 'number' ? cell.points : 0,
              selected: !!cell?.selected
            }))
          };
        });

        const token = localStorage.getItem('token');
        const stateToSave = {
          bingoPages: formattedPages,
          currentPageIndex: state.currentPageIndex || 0,
          lastModified: new Date().toISOString()
        };

        // Save to server if authenticated
        if (token) {
          console.log('📤 [SAVE] Sending data to server:', JSON.stringify(stateToSave, null, 2));

          const response = await fetch(`${API_URL}/api/bingo/card`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(stateToSave)
          });

          console.log('📤 [SAVE] Server response status:', response.status);
          if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ [SAVE] Server error:', errorData);
            throw new Error(errorData.message || 'Failed to save bingo card');
          }

          const result = await response.json();
          console.log('✅ [SAVE] Card saved successfully:', JSON.stringify(result, null, 2));

          if (result.success && result.data?.bingoPages) {
            console.log('✅ [SAVE] Updating state with server response');
            commit('SET_PAGES', result.data.bingoPages);
            commit('SET_CURRENT_PAGE', result.data.currentPageIndex || 0);
          }

          return result;
        } else {
          // Save to localStorage for non-authenticated users
          console.log('💾 [SAVE] Saving to localStorage:', stateToSave);
          localStorage.setItem('bingoState', JSON.stringify(stateToSave));
          return { success: true, message: 'Saved to localStorage' };
        }
      } catch (error) {
        console.error('❌ [SAVE] Error saving card:', error);
        throw error;
      }
    }
  }
};