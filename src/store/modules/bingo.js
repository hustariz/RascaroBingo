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

    SET_CURRENT_PAGE(state, index) {
      console.log('Setting current page to:', index);
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
    },

    DELETE_PAGE(state, index) {
      if (index >= 0 && index < state.bingoPages.length) {
        state.bingoPages.splice(index, 1);
        state.currentPageIndex = Math.min(state.currentPageIndex, state.bingoPages.length - 1);
      }
    },

    TOGGLE_CELL(state, { index }) {
      const currentPage = state.bingoPages[state.currentPageIndex];
      if (currentPage && currentPage.bingoCells[index]) {
        currentPage.bingoCells[index].selected = !currentPage.bingoCells[index].selected;

        // Save to localStorage after cell toggle
        localStorage.setItem('bingoState', JSON.stringify({
          bingoPages: state.bingoPages,
          currentPageIndex: state.currentPageIndex,
          lastModified: new Date().toISOString(),
          version: '2.0'
        }));
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

          // Save to localStorage after cell update
          localStorage.setItem('bingoState', JSON.stringify({
            bingoPages: state.bingoPages,
            currentPageIndex: state.currentPageIndex,
            lastModified: new Date().toISOString(),
            version: '2.0'
          }));
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

        commit('SET_PAGES', [defaultState]);
        commit('SET_CURRENT_PAGE', 0);

        // Save default state to localStorage as backup
        console.log('💾 [LOAD] Saving default state to localStorage');
        localStorage.setItem('bingoState', JSON.stringify({
          bingoPages: [defaultState],
          currentPageIndex: 0,
          lastModified: new Date().toISOString(),
          version: '2.0'
        }));

        return false;
      } finally {
        commit('SET_LOADING', false);
      }
    },

    updatePage({ commit, state }, { index, name }) {
      const page = state.bingoPages[index];
      if (page) {
        commit('UPDATE_PAGE', {
          pageIndex: index,
          page: { ...page, name }
        });
      }
    },

    saveCardState({ state }) {
      localStorage.setItem('bingoState', JSON.stringify({
        bingoPages: state.bingoPages,
        currentPageIndex: state.currentPageIndex,
        lastModified: new Date().toISOString(),
        version: '2.0'
      }));
    },

    ADD_PAGE({ commit }) {
      commit('ADD_PAGE');
      return Promise.resolve();
    },

    DELETE_PAGE({ commit }, index) {
      commit('DELETE_PAGE', index);
      return Promise.resolve();
    }
  }
};