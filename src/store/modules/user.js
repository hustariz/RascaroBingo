import api from '@/services/api';

const state = {
  user: null,
  token: localStorage.getItem('token') || null,
  isPaidUser: false,
  allUsers: []
};

const getters = {
  isAuthenticated: state => !!state.token,
  currentUser: state => state.user,
  isPaidUser: state => state.isPaidUser,
  allUsers: state => state.allUsers
};

const actions = {
  async login({ commit }, credentials) {
    const response = await api.login(credentials);
    const { token, username, email, isPaidUser } = response.data;
    
    localStorage.setItem('token', token);
    commit('setToken', token);
    commit('setUser', { username, email });
    commit('setPaidUser', isPaidUser);
    
    return response;
  },

  async getCurrentUser({ commit }) {
    const response = await api.getCurrentUser();
    if (response && response.data) {
      const {isPaidUser = false } = response.data;
      commit('setUser', response.data);
      commit('setPaidUser', isPaidUser);
      return response;
    }
    return null;
  },

  logout({ commit }) {
    localStorage.removeItem('token');
    commit('setToken', null);
    commit('setUser', null);
    commit('setPaidUser', false);
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
    state.user = user;
  },
  setPaidUser(state, isPaid) {
    state.isPaidUser = isPaid;
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
