import { createStore } from 'vuex'
import axios from 'axios'

// Create an axios instance
const api = axios.create({
  baseURL: 'http://localhost:3004/api'
});

// Add a request interceptor
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

export default createStore({
  state: {
    auth: {
      isLoggedIn: false,
      user: null,
      token: null
    }
  },
  mutations: {
    SET_LOGGED_IN(state, value) {
      state.auth.isLoggedIn = value;
    },
    SET_USER(state, user) {
      state.auth.user = user;
    },
    SET_TOKEN(state, token) {
      state.auth.token = token;
    }
  },
  actions: {
    async login({ commit }, { username, password }) {
      try {
        const response = await api.post('/users/login', { username, password });
        const { token, username: responseUsername } = response.data;
        
        commit('SET_LOGGED_IN', true);
        commit('SET_USER', { username: responseUsername });
        commit('SET_TOKEN', token);
        
        localStorage.setItem('token', token);
        
        return response;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },
    logout({ commit }) {
      commit('SET_LOGGED_IN', false);
      commit('SET_USER', null);
      commit('SET_TOKEN', null);
      localStorage.removeItem('token');
    },
    async checkAuth({ commit, dispatch }) {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Validate token with backend
          const response = await api.get('/users/me');
          commit('SET_LOGGED_IN', true);
          commit('SET_TOKEN', token);
          commit('SET_USER', response.data);
        } catch (error) {
          console.error('Token validation failed:', error);
          dispatch('logout');
        }
      }
    }
  },
  getters: {
    isLoggedIn: state => state.auth.isLoggedIn,
    user: state => state.auth.user,
    token: state => state.auth.token
  }
})