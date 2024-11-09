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
      localStorage.removeItem('tokenExpires');
    }
    return Promise.reject(error);
  }
);

export default {
  // Auth methods
  async login(userData) {
    try {
      const response = await api.post('/users/login', userData);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('username', response.data.username);
        const expiresAt = new Date().getTime() + (24 * 60 * 60 * 1000);
        localStorage.setItem('tokenExpires', expiresAt.toString());
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
        const expiresAt = new Date().getTime() + (24 * 60 * 60 * 1000);
        localStorage.setItem('tokenExpires', expiresAt.toString());
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('tokenExpires');
  },

  isAuthenticated() {
    const token = localStorage.getItem('token');
    const expiresAt = localStorage.getItem('tokenExpires');
    if (!token || !expiresAt) return false;
    return new Date().getTime() < parseInt(expiresAt);
  },

  getUsername() {
    return localStorage.getItem('username');
  },

  async checkAuth() {
    console.log('🔍 Checking authentication');
    try {
      const token = localStorage.getItem('token');
      console.log('🎟️ Token:', token ? 'present' : 'missing');
      
      if (!token) {
        return null;
      }
  
      const response = await api.get('/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      console.log('✅ Auth check successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      // Don't clear token on 401, let useAuth handle it
      throw error;
    }
  },

  // Bingo card methods
  async getBingoCard() {
    try {
      const response = await api.get('/bingo/card');
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return {
          bingoCells: Array.from({ length: 25 }, (_, i) => ({
            id: i + 1,
            title: '',
            points: 0,
            selected: false
          })),
          totalScore: 0
        };
      }
      throw error;
    }
  },

  async saveBingoCard(cardData) {
    try {
      const response = await api.post('/bingo/card', cardData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async updateBingoCell(index, cellData) {
    try {
      const response = await api.patch(`/bingo/card/cell/${index}`, { cell: cellData });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};