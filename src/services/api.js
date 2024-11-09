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
    // Don't clear token on 401, let useAuth handle it
    if (error.response?.status === 401) {
      console.log('⚠️ Auth error in interceptor, keeping credentials');
    }
    return Promise.reject(error);
  }
);

export default {
  // Auth methods
  async login(userData) {
    try {
      console.log('🔑 Attempting login...');
      const response = await api.post('/users/login', userData);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('username', response.data.username);
        const expiresAt = new Date().getTime() + (24 * 60 * 60 * 1000);
        localStorage.setItem('tokenExpires', expiresAt.toString());
        console.log('✅ Login successful');
      }
      return response.data;
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error.response?.data || error.message;
    }
  },

  async register(userData) {
    try {
      console.log('📝 Attempting registration...');
      const response = await api.post('/users/register', userData);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('username', response.data.username);
        const expiresAt = new Date().getTime() + (24 * 60 * 60 * 1000);
        localStorage.setItem('tokenExpires', expiresAt.toString());
        console.log('✅ Registration successful');
      }
      return response.data;
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw error.response?.data || error.message;
    }
  },

  logout() {
    console.log('🚪 Logging out...');
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('tokenExpires');
    localStorage.removeItem('bingoState'); // Clear bingo state on logout
    console.log('✅ Logout complete');
  },

  isAuthenticated() {
    const token = localStorage.getItem('token');
    const expiresAt = localStorage.getItem('tokenExpires');
    if (!token || !expiresAt) return false;
    const isValid = new Date().getTime() < parseInt(expiresAt);
    console.log('🔒 Auth check:', isValid ? 'valid' : 'expired');
    return isValid;
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

      const response = await api.get('/users/me');
      console.log('✅ Auth check successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      // Don't clear token on 401, let useAuth handle it
      if (error.response?.status !== 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
      }
      throw error;
    }
  },

  // Bingo card methods
  async getBingoCard() {
    try {
      console.log('📥 Loading bingo card');
      // Try to load from cache first
      const cachedCard = localStorage.getItem('bingoState');
      if (cachedCard) {
        console.log('📋 Found cached card');
        return JSON.parse(cachedCard);
      }

      const response = await api.get('/bingo/card');
      console.log('✅ Card loaded from server');
      return response.data;
    } catch (error) {
      console.error('❌ Error loading card:', error);
      if (error.response?.status === 404) {
        const defaultCard = {
          bingoCells: Array.from({ length: 25 }, (_, i) => ({
            id: i + 1,
            title: '',
            points: 0,
            selected: false
          })),
          totalScore: 0
        };
        console.log('⚠️ Using default card');
        return defaultCard;
      }
      throw error;
    }
  },

  async saveBingoCard(cardData) {
    try {
      console.log('💾 Saving card');
      // Always cache the card
      localStorage.setItem('bingoState', JSON.stringify(cardData));

      const response = await api.post('/bingo/card', cardData);
      console.log('✅ Card saved to server');
      return response.data;
    } catch (error) {
      console.error('❌ Error saving card:', error);
      throw error.response?.data || error.message;
    }
  },

  async updateBingoCell(index, cellData) {
    try {
      console.log('📝 Updating cell:', index);
      const response = await api.patch(`/bingo/card/cell/${index}`, { cell: cellData });
      console.log('✅ Cell updated');
      return response.data;
    } catch (error) {
      console.error('❌ Error updating cell:', error);
      throw error.response?.data || error.message;
    }
  }
};