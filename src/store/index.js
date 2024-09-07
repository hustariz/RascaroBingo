import { createStore } from 'vuex'
import axios from 'axios'

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
        // Replace with your actual API endpoint
        const response = await axios.post('http://localhost:3004/api/users/login', { username, password });
        const { user, token } = response.data;
        
        commit('SET_LOGGED_IN', true);
        commit('SET_USER', user);
        commit('SET_TOKEN', token);
        
        // Store token in localStorage for persistence
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
    checkAuth({ commit }) {
      const token = localStorage.getItem('token');
      if (token) {
        // You might want to validate the token with your backend here
        commit('SET_LOGGED_IN', true);
        commit('SET_TOKEN', token);
        // Optionally fetch user data here
      }
    }
  },
  getters: {
    isLoggedIn: state => state.auth.isLoggedIn,
    user: state => state.auth.user,
    token: state => state.auth.token
  }
})