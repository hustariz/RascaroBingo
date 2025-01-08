import api from '@/services/api';

const state = {
  user: null,
  token: localStorage.getItem('token') || null,
  allUsers: []
};

const getters = {
  isAuthenticated: state => !!state.token,
  currentUser: state => state.user,
  isPaidUser: state => state.user?.isPaidUser || false,
  allUsers: state => state.allUsers
};

const actions = {
  async login({ commit, dispatch }, credentials) {
    const response = await api.login(credentials);
    console.log('🔐 Login response full:', response);
    
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
      const token = localStorage.getItem('token');
      console.log('🎫 Getting current user with token:', token ? 'token-exists' : 'no-token');
      
      const response = await api.getCurrentUser();
      console.log('👥 GetCurrentUser full response:', response);
      
      if (response && response.data) {
        console.log('✅ Setting user data from getCurrentUser:', response.data);
        commit('setUser', response.data);
        
        // Debug current state
        console.log('🔍 Current store state after getCurrentUser:', {
          user: response.data,
          isPaidUser: response.data.isPaidUser
        });
        
        return response;
      }
    } catch (error) {
      console.error('❌ Error in getCurrentUser:', error);
      if (error.response?.status === 401) {
        console.log('⚠️ Unauthorized, clearing user data');
        commit('setUser', null);
        return null;
      }
      throw error;
    }
    return null;
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
    console.log('🔑 Setting token:', token ? 'token-exists' : 'no-token');
    state.token = token;
  },
  setUser(state, user) {
    console.log('👤 Setting user:', user);
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
