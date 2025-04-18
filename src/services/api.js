import axios from 'axios';

// Try to get API URL from different environment variable formats
const API_URL = process.env.VUE_APP_API_URL || 
  (typeof import.meta !== 'undefined' ? import.meta.env.VITE_API_URL : undefined) || 
  'http://localhost:3004';

console.log('🌍 Using API URL:', API_URL);

// Use the API URL with /api prefix
const baseURL = `${API_URL}/api`;
console.log('🌍 Base URL:', baseURL);

const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('🔑 Request interceptor - Token:', token ? 'Present' : 'Missing');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Added token to request headers');
    } else {
      console.log('⚠️ No token found in localStorage');
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
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
        console.error('❌ Retry failed:', retryError);
      }
    }

    if (error.response) {
      // Handle specific error cases
      switch (error.response.status) {
        case 401:
          // Only clear token, don't redirect
          console.log('🚫 Unauthorized - clearing token');
          localStorage.removeItem('token');
          break;
        case 403:
          // Forbidden
          console.error('🚫 Access forbidden:', error.response.data);
          break;
        case 404:
          // Not found
          console.error('❌ Resource not found:', error.response.data);
          break;
        default:
          console.error('❌ API Error:', error.response.data);
      }
    } else if (error.request) {
      // Network error
      console.error('🌐 Network Error:', error.request);
    } else {
      console.error('❌ Error:', error.message);
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

  async getCurrentUser() {
    try {
      console.log('🔄 Getting current user data');
      const response = await api.get('/users/me');
      if (response && response.data) {
        console.log('✅ User data retrieved:', response.data);
        return response.data;
      }
      throw new Error(response.data.message || 'Failed to load user data');
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      throw error;
    }
  },

  // Admin methods
  async getAllUsers() {
    try {
      const response = await api.get('/users/all');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  async updateUserPremiumStatus(userId, isPaidUser) {
    try {
      const response = await api.put('/users/premium-status', { userId, isPaidUser });
      return response.data;
    } catch (error) {
      console.error('Error updating user premium status:', error);
      throw error;
    }
  },

  async updateUserAdminStatus(userId, isAdmin) {
    try {
      const response = await api.put('/users/admin-status', { userId, isAdmin });
      return response.data;
    } catch (error) {
      console.error('Error updating user admin status:', error);
      throw error;
    }
  },

  async updateUserEmail(userId, email) {
    try {
      const response = await api.put('/users/email', { userId, email });
      return response.data;
    } catch (error) {
      console.error('Error updating user email:', error);
      throw error;
    }
  },

  async sendVerificationEmail(userId) {
    try {
      const response = await api.post('/users/send-verification', { userId });
      return response.data;
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  },

  async updateUsername(userId, username) {
    try {
      const response = await api.put('/users/username', { userId, username });
      return response.data;
    } catch (error) {
      console.error('Error updating username:', error);
      throw error;
    }
  },

  async deleteUser(userId) {
    try {
      const response = await api.delete(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Email verification methods
  checkEmail(email) {
    return api.post('/auth/check-email', { email })
      .then(response => response.data)
      .catch(error => {
        console.error('Error checking email:', error);
        throw error;
      });
  },

  verifyEmail(token) {
    return api.get(`/auth/verify-email/${token}`)
      .then(response => response.data)
      .catch(error => {
        console.error('Error verifying email:', error);
        throw error;
      });
  },

  resendVerification(email) {
    return api.post('/auth/resend-verification', { email })
      .then(response => response.data)
      .catch(error => {
        console.error('Error resending verification:', error);
        throw error;
      });
  },

  // Password reset
  async requestPasswordReset(email) {
    console.log('🔄 Requesting password reset for:', email);
    const response = await api.post('/users/reset-password-request', { email });
    console.log('✅ Password reset email sent');
    return response.data;
  },

  async resetPassword(token, newPassword) {
    console.log('🔄 Resetting password with token');
    const response = await api.post(`/users/reset-password/${token}`, { password: newPassword });
    console.log('✅ Password reset successful');
    return response.data;
  },

  // Bingo card methods
  getBingoCard() {
    return api.get('/bingo/card')
      .then(response => {
        if (response.data.success) {
          console.log('📋 Loaded bingo card:', response.data);
          return response.data;
        }
        throw new Error(response.data.message || 'Failed to load bingo card');
      })
      .catch(error => {
        console.error('❌ Error loading bingo card:', error);
        throw error;
      });
  },

  saveBingoCard(cardData) {
    return api.post('/bingo/card', cardData)
      .then(response => {
        if (response.data.success) {
          console.log('💾 Saved bingo card:', response.data);
          return response.data;
        }
        throw new Error(response.data.message || 'Failed to save bingo card');
      })
      .catch(error => {
        console.error('❌ Error saving bingo card:', error);
        throw error;
      });
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
  },

  // User statistics methods
  getUserStats() {
    return api.get('/users/stats').then(response => response.data);
  },

  // Subscription methods
  getSubscriptionDetails() {
    return api.get('/subscription').then(response => response.data);
  },

  cancelSubscription() {
    return api.post('/subscription/cancel').then(response => response.data);
  },
  
  // Admin subscription methods
  getUserSubscription(userId) {
    return api.get(`/users/${userId}/subscription`).then(response => response.data);
  },
  
  adminCancelSubscription(userId) {
    return api.post(`/users/${userId}/subscription/cancel`).then(response => response.data);
  },
  
  adminAddSubscriptionTime(userId, plan) {
    return api.post(`/users/${userId}/subscription/add`, { plan }).then(response => response.data);
  },
  
  adminSetSubscriptionEndDate(userId, endDate) {
    return api.post(`/users/${userId}/subscription/set-date`, { endDate }).then(response => response.data);
  },

  // Trade methods
  async get(endpoint) {
    try {
      console.log('🔍 GET request to:', endpoint);
      const response = await api.get(endpoint);
      return response;
    } catch (error) {
      console.error('❌ GET request failed:', error);
      throw error;
    }
  },

  async post(endpoint, data) {
    try {
      console.log('📝 POST request to:', endpoint);
      const response = await api.post(endpoint, data);
      return response;
    } catch (error) {
      console.error('❌ POST request failed:', error);
      throw error;
    }
  },

  async put(endpoint, data) {
    try {
      console.log('📝 PUT request to:', endpoint);
      const response = await api.put(endpoint, data);
      return response;
    } catch (error) {
      console.error('❌ PUT request failed:', error);
      throw error;
    }
  },

  async delete(endpoint) {
    try {
      console.log('🗑️ DELETE request to:', endpoint);
      const response = await api.delete(endpoint);
      return response;
    } catch (error) {
      console.error('❌ DELETE request failed:', error);
      throw error;
    }
  },
};