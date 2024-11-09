// composables/useAuth.js
import { ref, readonly } from 'vue';
import api from '@/services/api';

// State
const user = ref(localStorage.getItem('username'));
const token = ref(localStorage.getItem('token'));
const isAuthenticated = ref(!!token.value);
const tokenExpires = ref(localStorage.getItem('tokenExpires'));

export function useAuth() {
  const checkToken = () => {
    console.log('🔍 Checking token...');
    const currentToken = localStorage.getItem('token');
    const currentUser = localStorage.getItem('username');
    const expiresAt = localStorage.getItem('tokenExpires');

    console.log('📊 Auth State:', {
      hasToken: !!currentToken,
      hasUser: !!currentUser,
      expiresAt: expiresAt ? new Date(parseInt(expiresAt)).toLocaleString() : 'none'
    });

    if (!currentToken || !currentUser) {
      console.log('❌ Missing auth data');
      logout();
      return false;
    }

    if (expiresAt && new Date().getTime() > parseInt(expiresAt)) {
      console.log('❌ Token expired');
      logout();
      return false;
    }

    token.value = currentToken;
    user.value = currentUser;
    isAuthenticated.value = true;
    console.log('✅ Token valid');
    return true;
  };

  const checkAuthStatus = async () => {
    console.log('🔄 Checking auth status...');
    try {
      if (!checkToken()) {
        return false;
      }

      const userData = await api.checkAuth();
      console.log('👤 User data:', userData);
      
      if (userData) {
        user.value = userData.username;
        isAuthenticated.value = true;
        return true;
      }
      
      logout();
      return false;
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      if (error.response?.status === 401) {
        logout();
      }
      return false;
    }
  };

  const login = async (credentials) => {
    try {
      const response = await api.login(credentials);
      
      // Set both localStorage and reactive refs
      localStorage.setItem('token', response.token);
      localStorage.setItem('username', response.username);
      const expiresAt = new Date().getTime() + (24 * 60 * 60 * 1000);
      localStorage.setItem('tokenExpires', expiresAt.toString());

      token.value = response.token;
      user.value = response.username;
      tokenExpires.value = expiresAt.toString();
      isAuthenticated.value = true;

      return response;
    } catch (error) {
      console.error('❌ Login error:', error);
      logout();
      throw error;
    }
  };

  const logout = () => {
    // Clear both localStorage and reactive refs
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('tokenExpires');
    
    token.value = null;
    user.value = null;
    tokenExpires.value = null;
    isAuthenticated.value = false;
    
    console.log('🚪 Logged out');
  };

  // Initialize auth state
  const initAuth = async () => {
    console.log('🔧 Initializing auth...');
    if (token.value) {
      await checkAuthStatus();
    }
  };

  // Call initAuth when the composable is first used
  initAuth();

  return {
    user: readonly(user),
    isAuthenticated: readonly(isAuthenticated),
    token: readonly(token),
    tokenExpires: readonly(tokenExpires),
    login,
    logout,
    checkAuthStatus,
    checkToken  // Export checkToken
  };
}