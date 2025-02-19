import api from '@/services/api';

const state = {
  user: null,
  token: localStorage.getItem('token') || null,
  allUsers: []
};

const getters = {
  isAuthenticated: state => !!state.token,
  currentUser: state => state.user,
  isPaidUser: state => {
    console.log('🔑 Checking isPaidUser:', {
      user: state.user,
      isPaidUser: state.user?.isPaidUser,
      token: state.token
    });
    return state.user?.isPaidUser || false;
  },
  isConnected: () => {
    const hasToken = !!localStorage.getItem('token');
    console.log('🔌 Checking isConnected:', hasToken);
    return hasToken;
  },
  allUsers: state => state.allUsers
};

const actions = {
  async login({ commit, dispatch }, credentials) {
    const response = await api.login(credentials);
    console.log('🔐 Login response:', response);
    
    // Set token first
    localStorage.setItem('token', response.token);
    commit('setToken', response.token);
    
    // Set initial user data from login
    const userData = { 
      username: response.username, 
      email: response.email,
      isPaidUser: response.isPaidUser 
    };
    console.log('📝 Setting initial user data:', userData);
    commit('setUser', userData);
    
    // Get full user data after token is set
    console.log('🔄 Getting full user data...');
    await dispatch('getCurrentUser');
    
    return response;
  },

  async getCurrentUser({ commit }) {
    try {
      console.log('🔄 Getting current user data...');
      const userData = await api.getCurrentUser();
      console.log('✅ Got user data:', userData);
      
      if (userData) {
        commit('setUser', userData);
        return userData;
      }
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      if (error.response?.status === 401) {
        commit('setUser', null);
        commit('setToken', null);
        localStorage.removeItem('token');
      }
      throw error;
    }
  },

  logout({ commit }) {
    localStorage.removeItem('token');
    commit('setToken', null);
    commit('setUser', null);
  },

  // Admin actions
  async fetchAllUsers({ commit }) {
    const response = await api.get('/users/all');
    commit('setAllUsers', response.data);
    return response.data;
  },

  async updateUserPremiumStatus({ commit }, { userId, isPaidUser }) {
    const response = await api.put('/users/premium-status', {
      userId,
      isPaidUser
    });
    commit('updateUserInList', response.data);
    return response.data;
  }
};

const mutations = {
  setToken(state, token) {
    state.token = token;
  },
  setUser(state, user) {
    console.log('👤 Setting user state:', user);
    state.user = user;
  },
  setAllUsers(state, users) {
    state.allUsers = users;
  },
  updateUserInList(state, updatedUser) {
    const index = state.allUsers.findIndex(user => user._id === updatedUser._id);
    if (index !== -1) {
      state.allUsers.splice(index, 1, updatedUser);
    }
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
