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
  
    // Always set initial state from localStorage
    token.value = localStorage.getItem('token');
    user.value = localStorage.getItem('username');
    isAuthenticated.value = true;
  
    try {
      const userData = await api.checkAuth();
      if (userData) {
        console.log('✅ Auth valid, user:', userData.username);
        user.value = userData.username || localStorage.getItem('username');
        localStorage.setItem('username', user.value);
        return true;
      }
    } catch (error) {
      console.error('❌ Auth check error:', error);
      if (error.response?.status === 401) {
        console.log('⚠️ Backend validation failed, keeping local state');
        // Keep using stored credentials on 401
        user.value = localStorage.getItem('username');
        return true;
      }
      // Only throw for non-401 errors
      if (error.response?.status !== 401) {
        throw error;
      }
    }
  
    // If we get here, keep using stored credentials
    console.log('⚠️ Using stored credentials:', localStorage.getItem('username'));
    user.value = localStorage.getItem('username');
    return isAuthenticated.value;
  };

  const login = async (credentials) => {
    try {
      console.log('🔑 Attempting login...');
      const response = await api.login(credentials);
      
      // Store auth data with metadata
      const loginTime = new Date().toISOString();
      const expiresAt = new Date().getTime() + (24 * 60 * 60 * 1000);
      
      // Store all auth data atomically
      localStorage.setItem('token', response.token);
      localStorage.setItem('username', response.username);
      localStorage.setItem('tokenExpires', expiresAt.toString());
      localStorage.setItem('loginTime', loginTime);
      localStorage.setItem('lastActive', new Date().toISOString());
      
      // Store complete user data
      localStorage.setItem('user', JSON.stringify({
        username: response.username,
        email: response.email,
        isPaidUser: response.isPaidUser,
        role: response.role
      }));

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
    if (!isAuthenticated.value) {
      console.log('⚠️ Already logged out');
      return;
    }

    console.log('🚪 Logging out...');
    
    // Store last session info before clearing
    const lastSession = {
      username: user.value,
      loginTime: localStorage.getItem('loginTime'),
      logoutTime: new Date().toISOString()
    };
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('tokenExpires');
    localStorage.removeItem('loginTime');
    localStorage.removeItem('lastActive');
    localStorage.removeItem('bingoState'); // Clear bingo state on logout
    localStorage.removeItem('user'); // Clear user data on logout
    
    // Store last session
    localStorage.setItem('lastSession', JSON.stringify(lastSession));
    
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
      
      // Update last active timestamp
      localStorage.setItem('lastActive', new Date().toISOString());
      
      // Keep using stored credentials even if backend check fails
      try {
        await checkAuthStatus();
        console.log('✅ Auth initialized successfully');
      } catch (error) {
        console.error('❌ Init auth error:', error);
        if (error.response?.status !== 401) {
          logout();
        } else {
          console.log('⚠️ Using stored credentials despite backend error');
        }
      }
    } else {
      console.log('ℹ️ No stored credentials found');
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