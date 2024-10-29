import axios from 'axios';

const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:3004';
console.log('Using API URL:', API_URL);

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Add request interceptor
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Add response interceptor
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
    }
    return Promise.reject(error);
  }
);

export default {
  async login(userData) {
    try {
      const response = await api.post('/users/login', userData);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('username', response.data.username);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async register(userData) {
    try {
      const response = await api.post('/users/register', userData);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('username', response.data.username);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  getUsername() {
    return localStorage.getItem('username');
  },

  async checkAuth() {
    try {
      const response = await api.get('/users/me');
      if (response.data.username) {
        localStorage.setItem('username', response.data.username);
      }
      return response.data;
    } catch (error) {
      this.logout();
      throw error;
    }
  }
};