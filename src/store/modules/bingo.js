const API_URL = process.env.VUE_APP_API_URL || 
  (typeof import.meta !== 'undefined' ? import.meta.env.VITE_API_URL : undefined) || 
  'https://api.rascarobingo.com';

console.log('🌍 Bingo using API URL:', API_URL);

if (!API_URL) {
  console.error('❌ No API URL defined in environment');
}

export default {
  namespaced: true,

  state: {
    bingoPages: [],
    currentPageIndex: 0,
    isLoading: false,
    lastSaved: null
  },

  mutations: {
    SET_PAGES(state, pages) {
      console.log('📝 Setting pages state:', pages);
      state.bingoPages = pages;
    },

    SET_CURRENT_PAGE(state, index) {
      console.log('Setting current page to:', index);
      state.currentPageIndex = Math.max(0, Math.min(index, state.bingoPages.length - 1));
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
    },

    DELETE_PAGE(state, index) {
      console.log('🗑️ Deleting page at index:', index);
      if (state.bingoPages.length > 1) { // Ensure we always have at least one board
        state.bingoPages.splice(index, 1);
        // Adjust currentPageIndex if needed
        if (state.currentPageIndex >= state.bingoPages.length) {
          state.currentPageIndex = Math.max(0, state.bingoPages.length - 1);
        }
      } else {
        console.warn('⚠️ Cannot delete last board');
      }
    },

    TOGGLE_CELL(state, { index }) {
      const currentPage = state.bingoPages[state.currentPageIndex];
      if (currentPage && currentPage.bingoCells[index]) {
        currentPage.bingoCells[index].selected = !currentPage.bingoCells[index].selected;
      }
    },

    UPDATE_CELL(state, { pageIndex, cellIndex, cell }) {
      console.log('📝 Updating cell:', { pageIndex, cellIndex, cell });
      
      if (pageIndex >= 0 && pageIndex < state.bingoPages.length) {
        const page = state.bingoPages[pageIndex];
        if (page && cellIndex >= 0 && cellIndex < page.bingoCells.length) {
          page.bingoCells[cellIndex] = {
            ...page.bingoCells[cellIndex],
            ...cell,
            id: page.bingoCells[cellIndex].id // Preserve the original ID
          };
        }
      }
    },

    UPDATE_PAGE(state, { pageIndex, page }) {
      if (pageIndex >= 0 && pageIndex < state.bingoPages.length) {
        state.bingoPages[pageIndex] = {
          ...state.bingoPages[pageIndex],
          ...page,
          bingoCells: page.bingoCells || state.bingoPages[pageIndex].bingoCells
        };
      }
    },

    SET_LOADING(state, loading) {
      state.isLoading = loading;
    },

    SET_LAST_SAVED(state, timestamp) {
      state.lastSaved = timestamp;
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
    async loadUserCard({ commit, state }) {
      if (state.isLoading) {
        console.log('⏳ [LOAD] Already loading, skipping...');
        return;
      }

      console.log('📥 [LOAD] Starting loadUserCard');
      commit('SET_LOADING', true);

      try {
        // Try to load from server if authenticated
        const token = localStorage.getItem('token');
        if (token) {
          try {
            console.log('🔑 [LOAD] Token found, trying server load');
            const response = await fetch(`${API_URL}/api/bingo/card`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
              }
            });

            if (response.ok) {
              const { success, data } = await response.json();
              console.log('✅ [LOAD] Loaded from server:', { success, data });

              if (success && data && Array.isArray(data.bingoPages)) {
                // Ensure data structure matches our schema
                const normalizedPages = data.bingoPages.map(page => ({
                  id: page.id || Date.now(),
                  name: page.name || 'Default Board',
                  bingoCells: Array.from({ length: 25 }, (_, i) => {
                    const cell = page.bingoCells[i] || {};
                    return {
                      id: cell.id || i + 1,
                      title: cell.title || '',
                      points: Number(cell.points || 0),
                      selected: Boolean(cell.selected)
                    };
                  })
                }));

                commit('SET_PAGES', normalizedPages);
                commit('SET_CURRENT_PAGE', Math.min(data.currentPageIndex || 0, normalizedPages.length - 1));
                commit('SET_LAST_SAVED', data.lastModified || new Date().toISOString());
                
                // Update localStorage with normalized data
                localStorage.setItem('bingoState', JSON.stringify({
                  bingoPages: normalizedPages,
                  currentPageIndex: data.currentPageIndex || 0,
                  lastModified: data.lastModified || new Date().toISOString(),
                  version: '2.0'
                }));
                
                return true;
              }
            } else {
              const errorText = await response.text();
              console.warn('⚠️ [LOAD] Failed to load from server:', response.status, errorText);
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
            console.log('💾 [LOAD] Found localStorage state:', parsedState);
            
            if (parsedState && Array.isArray(parsedState.bingoPages)) {
              // Ensure localStorage data structure matches our schema
              const normalizedPages = parsedState.bingoPages.map(page => ({
                id: page.id || Date.now(),
                name: page.name || 'Default Board',
                bingoCells: Array.from({ length: 25 }, (_, i) => {
                  const cell = page.bingoCells[i] || {};
                  return {
                    id: cell.id || i + 1,
                    title: cell.title || '',
                    points: Number(cell.points || 0),
                    selected: Boolean(cell.selected)
                  };
                })
              }));

              commit('SET_PAGES', normalizedPages);
              commit('SET_CURRENT_PAGE', Math.min(parsedState.currentPageIndex || 0, normalizedPages.length - 1));
              commit('SET_LAST_SAVED', parsedState.lastModified || new Date().toISOString());
              return true;
            }
          } catch (error) {
            console.warn('⚠️ [LOAD] Error parsing localStorage state:', error);
          }
        }

        // If all else fails, create default state
        console.log('📝 [LOAD] Creating default state');
        const defaultState = [{
          id: Date.now(),
          name: 'Default Board',
          bingoCells: Array.from({ length: 25 }, (_, i) => ({
            id: i + 1,
            title: '',
            points: 0,
            selected: false
          }))
        }];

        commit('SET_PAGES', defaultState);
        commit('SET_CURRENT_PAGE', 0);
        commit('SET_LAST_SAVED', new Date().toISOString());
        return false;
      } finally {
        commit('SET_LOADING', false);
      }
    },

    async saveCardState({ commit, state }) {
      if (state.isLoading) {
        console.log('⏳ [SAVE] Already saving, skipping...');
        return;
      }

      console.log('💾 [SAVE] Starting saveCardState');
      commit('SET_LOADING', true);

      try {
        // Convert Proxy objects to plain objects and ensure correct structure
        const normalizedPages = state.bingoPages.map(page => ({
          id: page.id || Date.now(),
          name: page.name || 'Default Board',
          bingoCells: Array.from({ length: 25 }, (_, i) => {
            const cell = page.bingoCells[i] || {};
            return {
              id: cell.id || i + 1,
              title: cell.title || '',
              points: Number(cell.points || 0),
              selected: Boolean(cell.selected)
            };
          })
        }));

        const stateToSave = {
          bingoPages: normalizedPages,
          currentPageIndex: state.currentPageIndex,
          lastModified: new Date().toISOString(),
          version: '2.0'
        };

        // Save to localStorage first as backup
        localStorage.setItem('bingoState', JSON.stringify(stateToSave));

        // Try to save to server if authenticated
        const token = localStorage.getItem('token');
        if (token) {
          try {
            console.log('📤 [SAVE] Sending to server:', stateToSave);
            
            const response = await fetch(`${API_URL}/api/bingo/card`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(stateToSave)
            });

            if (response.ok) {
              const { success, data } = await response.json();
              console.log('✅ [SAVE] Saved to server successfully:', { success, data });
              commit('SET_LAST_SAVED', stateToSave.lastModified);
              return true;
            } else {
              const errorText = await response.text();
              console.error('❌ [SAVE] Server error:', response.status, errorText);
              if (response.status === 401) {
                localStorage.removeItem('token');
              }
              return false;
            }
          } catch (error) {
            console.error('❌ [SAVE] Network error:', error);
            return false;
          }
        } else {
          console.warn('⚠️ [SAVE] No token found, skipping server save');
        }

        commit('SET_LAST_SAVED', stateToSave.lastModified);
        return true;
      } finally {
        commit('SET_LOADING', false);
      }
    },

    async updatePage({ commit, dispatch }, { index, name }) {
      commit('UPDATE_PAGE', { pageIndex: index, page: { name } });
      await dispatch('saveCardState');
    },

    async toggleCell({ commit, dispatch }, index) {
      commit('TOGGLE_CELL', { index });
      await dispatch('saveCardState');
    },

    async updateCell({ commit, dispatch }, { pageIndex, cellIndex, cell }) {
      commit('UPDATE_CELL', { pageIndex, cellIndex, cell });
      await dispatch('saveCardState');
    },

    async setCurrentPage({ commit, dispatch }, index) {
      commit('SET_CURRENT_PAGE', index);
      await dispatch('saveCardState');
    },

    async addPage({ commit, dispatch }) {
      commit('ADD_PAGE');
      await dispatch('saveCardState');
    },

    async deletePage({ commit, dispatch, state }, index) {
      console.log('🗑️ [DELETE] Deleting page at index:', index);
      
      // Prevent deleting the last board
      if (state.bingoPages.length <= 1) {
        console.warn('⚠️ [DELETE] Cannot delete last board');
        return;
      }

      commit('DELETE_PAGE', index);
      await dispatch('saveCardState');
    },
  }
};