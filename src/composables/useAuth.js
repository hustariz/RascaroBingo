// composables/useAuth.js
import { ref, readonly } from 'vue';
import api from '@/services/api';

// State with proper initialization from localStorage
const user = ref(localStorage.getItem('username'));
const token = ref(localStorage.getItem('token'));
const isAuthenticated = ref(!!token.value && !!user.value);
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

    // Set initial state from localStorage
    if (currentToken && currentUser) {
      token.value = currentToken;
      user.value = currentUser;
      isAuthenticated.value = true;
      console.log('✅ Token valid');
      return true;
    }

    console.log('❌ Missing auth data');
    return false;
  };

  const checkAuthStatus = async () => {
    console.log('🔄 Checking auth status...');
    
    if (!checkToken()) {
      console.log('❌ Token check failed');
      return false;
    }

    try {
      const userData = await api.checkAuth();
      if (userData) {
        console.log('✅ Auth valid, user:', userData.username);
        user.value = userData.username;
        localStorage.setItem('username', userData.username);
        return true;
      }
    } catch (error) {
      console.error('❌ Auth check error:', error);
      if (error.response?.status === 401) {
        console.log('⚠️ Auth check failed, using stored credentials');
        // Don't logout on 401, keep using stored credentials
        return true;
      }
      throw error;
    }

    return isAuthenticated.value;
  };

  const login = async (credentials) => {
    try {
      console.log('🔑 Attempting login...');
      const response = await api.login(credentials);
      
      // Store auth data
      localStorage.setItem('token', response.token);
      localStorage.setItem('username', response.username);
      const expiresAt = new Date().getTime() + (24 * 60 * 60 * 1000);
      localStorage.setItem('tokenExpires', expiresAt.toString());

      // Update reactive refs
      token.value = response.token;
      user.value = response.username;
      tokenExpires.value = expiresAt.toString();
      isAuthenticated.value = true;

      console.log('✅ Login successful');
      return response;
    } catch (error) {
      console.error('❌ Login error:', error);
      logout();
      throw error;
    }
  };

  const logout = () => {
    if (!isAuthenticated.value) return; // Prevent multiple logouts

    console.log('🚪 Logging out...');
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('tokenExpires');
    localStorage.removeItem('bingoState'); // Clear bingo state on logout
    
    // Clear reactive refs
    token.value = null;
    user.value = null;
    tokenExpires.value = null;
    isAuthenticated.value = false;
    
    console.log('✅ Logout complete');
  };

  // Initialize auth state
  const initAuth = async () => {
    console.log('🔧 Initializing auth...');
    if (token.value && user.value) {
      // Set initial state before checking with backend
      isAuthenticated.value = true;
      
      // Keep using stored credentials even if backend check fails
      try {
        await checkAuthStatus();
      } catch (error) {
        console.error('❌ Init auth error:', error);
        if (error.response?.status !== 401) {
          logout();
        }
      }
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
    checkToken
  };
}