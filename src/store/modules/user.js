import axios from 'axios';

const state = {
  user: null,
  token: localStorage.getItem('token') || null,
  isPaidUser: false
};

const getters = {
  isAuthenticated: state => !!state.token,
  currentUser: state => state.user,
  isPaidUser: state => state.isPaidUser
};

const actions = {
  async login({ commit }, credentials) {
    const response = await axios.post('/api/users/login', credentials);
    const { token, username, email, isPaidUser } = response.data;
    
    localStorage.setItem('token', token);
    commit('setToken', token);
    commit('setUser', { username, email });
    commit('setPaidUser', isPaidUser);
    
    return response;
  },

  async getCurrentUser({ commit }) {
    const response = await axios.get('/api/users/me');
    const { username, email, isPaidUser } = response.data;
    
    commit('setUser', { username, email });
    commit('setPaidUser', isPaidUser);
    
    return response;
  },

  logout({ commit }) {
    localStorage.removeItem('token');
    commit('setToken', null);
    commit('setUser', null);
    commit('setPaidUser', false);
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
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
