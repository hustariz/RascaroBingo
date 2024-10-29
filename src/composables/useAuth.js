import { ref, readonly } from 'vue';
import api from '@/services/api';

// State
const user = ref(null);
const token = ref(localStorage.getItem('token'));
const isAuthenticated = ref(!!token.value);

// Composable
export function useAuth() {
  // Login
  const login = async (credentials) => {
    try {
      const response = await api.login(credentials);
      user.value = response.username;
      token.value = response.token;
      localStorage.setItem('token', response.token);
      isAuthenticated.value = true;
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Register
  const register = async (userData) => {
    try {
      const response = await api.register(userData);
      user.value = response.username;
      token.value = response.token;
      localStorage.setItem('token', response.token);
      isAuthenticated.value = true;
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  // Logout
  const logout = () => {
    user.value = null;
    token.value = null;
    localStorage.removeItem('token');
    isAuthenticated.value = false;
  };

  return {
    user: readonly(user),
    isAuthenticated: readonly(isAuthenticated),
    login,
    register,
    logout
  };
}