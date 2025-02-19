const API_URL = process.env.VUE_APP_API_URL || 
  (typeof import.meta !== 'undefined' ? import.meta.env.VITE_API_URL : undefined) || 
  'https://api.rascarobingo.com';

console.log('🌍 Bingo using API URL:', API_URL);

if (!API_URL) {
  console.error('❌ No API URL defined in environment');
}

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
      this.dispatch('bingo/saveCardState');
    },

    TOGGLE_CELL(state, { index }) {
      const currentPage = state.bingoPages[state.currentPageIndex];
      if (currentPage && currentPage.bingoCells[index]) {
        currentPage.bingoCells[index].selected = !currentPage.bingoCells[index].selected;
      }
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
    },

    UPDATE_PAGE(state, { pageIndex, page }) {
      if (pageIndex >= 0 && pageIndex < state.bingoPages.length) {
        state.bingoPages[pageIndex] = {
          ...state.bingoPages[pageIndex],
          ...page,
          bingoCells: page.bingoCells || state.bingoPages[pageIndex].bingoCells
        };
        
        // Save to localStorage
        localStorage.setItem('bingoState', JSON.stringify({
          bingoPages: state.bingoPages,
          currentPageIndex: state.currentPageIndex,
          lastModified: new Date().toISOString(),
          version: '2.0'
        }));
      }
    },
  },

  getters: {
    getCurrentPage: state => {
      // Ensure we have at least one page
      if (!state.bingoPages || state.bingoPages.length === 0) {
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
      
      // Get current page with bounds checking
      const index = Math.min(state.currentPageIndex, state.bingoPages.length - 1);
      return state.bingoPages[index];
    },

    getCurrentPageCells: (state, getters) => {
      const currentPage = getters.getCurrentPage;
      return currentPage?.bingoCells || [];
    },

    getTotalScore: (state, getters) => {
      const cells = getters.getCurrentPageCells;
      return cells.reduce((total, cell) => {
        return total + (cell.selected ? (cell.points || 0) : 0);
      }, 0);
    },

    getAllPages: state => state.bingoPages || [],
    
    getCurrentPageIndex: state => Math.min(state.currentPageIndex, state.bingoPages.length - 1)
  },

  actions: {
    async loadUserCard({ commit }) {
      console.log('📥 [LOAD] Starting loadUserCard');
      commit('SET_LOADING', true);

      try {
        // Try to load from server if authenticated
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const response = await fetch(`${API_URL}/api/bingo/card`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (response.ok) {
              const data = await response.json();
              console.log('✅ [LOAD] Loaded from server:', data);

              if (data && Array.isArray(data.bingoPages)) {
                commit('SET_PAGES', data.bingoPages);
                commit('SET_CURRENT_PAGE', data.currentPageIndex || 0);
                return true;
              }
            } else {
              console.warn('⚠️ [LOAD] Failed to load from server');
              if (response.status === 401) {
                localStorage.removeItem('token');
              }
            }
          } catch (error) {
            console.warn('⚠️ [LOAD] Error loading from server:', error);
          }
        }

        // If server load fails or no token, try localStorage
        const localState = localStorage.getItem('bingoState');
        if (localState) {
          try {
            const parsedState = JSON.parse(localState);
            if (parsedState && Array.isArray(parsedState.bingoPages)) {
              console.log('💾 [LOAD] Loaded from localStorage:', parsedState);
              commit('SET_PAGES', parsedState.bingoPages);
              commit('SET_CURRENT_PAGE', parsedState.currentPageIndex || 0);
              return true;
            }
          } catch (error) {
            console.warn('⚠️ [LOAD] Error parsing localStorage state:', error);
          }
        }

        // If all else fails, create default state
        console.log('📝 [LOAD] Creating default state');
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

        const stateToSave = {
          bingoPages: [defaultState],
          currentPageIndex: 0,
          lastModified: new Date().toISOString(),
          version: '2.0'
        };

        commit('SET_PAGES', [defaultState]);
        commit('SET_CURRENT_PAGE', 0);

        // Save default state to localStorage as backup
        console.log('💾 [LOAD] Saving default state to localStorage');
        localStorage.setItem('bingoState', JSON.stringify(stateToSave));

        return false;
      } finally {
        commit('SET_LOADING', false);
      }
    },

    async setCurrentPageIndex({ commit }, index) {
      commit('SET_CURRENT_PAGE', index);
      return Promise.resolve();
    },

    ADD_PAGE({ commit }) {
      commit('ADD_PAGE');
      return Promise.resolve();
    },

    async updatePage({ commit }, { pageIndex, page }) {
      commit('UPDATE_PAGE', { pageIndex, page });
      return Promise.resolve();
    },

    async saveCardState({ state }) {
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

          return {
            id: page.id || Date.now() + index,
            name: page.name || `Board ${index + 1}`,
            bingoCells: bingoCells.slice(0, 25)
          };
        });

        // Prepare state to save
        const stateToSave = {
          bingoPages: formattedPages,
          currentPageIndex: state.currentPageIndex,
          lastModified: new Date().toISOString(),
          version: '2.0'
        };

        // Always save to localStorage first as backup
        console.log('💾 [SAVE] Saving to localStorage:', stateToSave);
        localStorage.setItem('bingoState', JSON.stringify(stateToSave));

        // Try to save to server if authenticated
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const response = await fetch(`${API_URL}/api/bingo/card`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(stateToSave)
            });

            if (!response.ok) {
              console.warn('⚠️ [SAVE] Failed to save to server, but saved to localStorage');
              if (response.status === 401) {
                // If unauthorized, clear token but keep localStorage
                localStorage.removeItem('token');
              }
            } else {
              console.log('✅ [SAVE] Saved to server successfully');
            }
          } catch (error) {
            console.warn('⚠️ [SAVE] Error saving to server:', error);
            // Don't throw here since we already saved to localStorage
          }
        }

        return true;
      } catch (error) {
        console.error('❌ [SAVE] Error saving card state:', error);
        return false;
      }
    },

    deletePage({ commit }, pageIndex) {
      if (pageIndex === 0) {
        console.warn('Cannot delete the first board');
        return;
      }
      commit('DELETE_PAGE', pageIndex);
    },
  }
};