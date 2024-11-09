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

// Add response interceptor with retry logic
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Handle 401 errors with retry logic
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('⚠️ Auth error in interceptor, attempting recovery');
      originalRequest._retry = true;

      try {
        // Try to use stored token first
        const token = localStorage.getItem('token');
        if (token) {
          console.log('🔄 Retrying with stored token');
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return await api(originalRequest);
        }
      } catch (retryError) {
        console.log('⚠️ Retry failed, using cached state');
        // Return cached data if available
        const cachedData = localStorage.getItem('bingoState');
        if (cachedData) {
          return Promise.resolve({ data: JSON.parse(cachedData) });
        }
      }
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
        // Store auth data with metadata
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('username', response.data.username);
        const expiresAt = new Date().getTime() + (24 * 60 * 60 * 1000);
        localStorage.setItem('tokenExpires', expiresAt.toString());
        localStorage.setItem('lastLogin', new Date().toISOString());
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
        localStorage.setItem('lastLogin', new Date().toISOString());
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
    // Store last session info before clearing
    const lastSession = {
      username: localStorage.getItem('username'),
      loginTime: localStorage.getItem('lastLogin'),
      logoutTime: new Date().toISOString()
    };
    localStorage.setItem('lastSession', JSON.stringify(lastSession));
    
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('tokenExpires');
    localStorage.removeItem('lastLogin');
    localStorage.removeItem('bingoState');
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
      const username = localStorage.getItem('username');
      console.log('🎟️ Token:', token ? 'present' : 'missing');
      
      if (!token) {
        return null;
      }
  
      try {
        const response = await api.get('/users/me');
        console.log('✅ Auth check successful:', response.data);
        return response.data;
      } catch (error) {
        if (error.response?.status === 401) {
          console.log('⚠️ Auth check 401, using stored credentials');
          // Return cached user data on 401
          return {
            username: username,
            token: token
          };
        }
        throw error;
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      // Only clear on non-401 errors
      if (error.response?.status !== 401) {
        console.log('⚠️ Non-401 error, clearing auth data');
        localStorage.removeItem('token');
        localStorage.removeItem('username');
      } else {
        console.log('⚠️ 401 error, keeping credentials');
        // Return cached user data
        return {
          username: localStorage.getItem('username'),
          token: localStorage.getItem('token')
        };
      }
      throw error;
    }
  },

  // Bingo card methods
  async getBingoCard() {
    try {
      console.log('📥 Loading bingo card');
      // Always try cache first
      const cachedCard = localStorage.getItem('bingoState');
      if (cachedCard) {
        console.log('📋 Found cached card');
        return JSON.parse(cachedCard);
      }

      const response = await api.get('/bingo/card');
      console.log('✅ Card loaded from server');
      // Cache the server response
      localStorage.setItem('bingoState', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      console.error('❌ Error loading card:', error);
      // Try to use cached data on error
      const cachedCard = localStorage.getItem('bingoState');
      if (cachedCard) {
        console.log('⚠️ Using cached card data');
        return JSON.parse(cachedCard);
      }
      
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
      // Always cache first
      localStorage.setItem('bingoState', JSON.stringify({
        ...cardData,
        lastModified: new Date().toISOString()
      }));

      const response = await api.post('/bingo/card', cardData);
      console.log('✅ Card saved to server');
      return response.data;
    } catch (error) {
      console.error('❌ Error saving card, but state is cached:', error);
      if (error.response?.status === 401) {
        console.log('⚠️ Auth error, using cached state');
        return cardData;
      }
      throw error.response?.data || error.message;
    }
  },

  async updateBingoCell(index, cellData) {
    try {
      console.log('📝 Updating cell:', index);
      // Update cache first
      const cachedCard = localStorage.getItem('bingoState');
      if (cachedCard) {
        const card = JSON.parse(cachedCard);
        card.bingoCells[index] = cellData;
        localStorage.setItem('bingoState', JSON.stringify({
          ...card,
          lastModified: new Date().toISOString()
        }));
      }

      const response = await api.patch(`/bingo/card/cell/${index}`, { cell: cellData });
      console.log('✅ Cell updated');
      return response.data;
    } catch (error) {
      console.error('❌ Error updating cell:', error);
      if (error.response?.status === 401) {
        console.log('⚠️ Auth error, using cached state');
        return cellData;
      }
      throw error.response?.data || error.message;
    }
  }
};