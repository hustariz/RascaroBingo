<template>
  <div class="form-overlay" v-if="isOpen" @click.self="closeForm">
    <div class="form">
      <h2>Login</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">Username:</label>
          <input type="text" id="username" v-model="username" required>
        </div>
        <div class="form-group">
          <label for="password">Password:</label>
          <input type="password" id="password" v-model="password" required>
        </div>
        <div class="form-actions">
          <button type="submit" :disabled="isLoading">
            {{ isLoading ? 'Logging in...' : 'Login' }}
          </button>
          <button type="button" @click="closeForm" :disabled="isLoading">Close</button>
        </div>
      </form>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      <p class="sign-in-link">Don't have an account yet? <a href="#" @click.prevent="openRegisterForm">Sign up now!</a></p>
    </div>
  </div>
</template>

<script>
import '../assets/styles/LoginForm.css';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';
import { useAuth } from '@/composables/useAuth';  // Import the composable

export default {
  name: 'LoginForm',
  props: {
    isOpen: {
      type: Boolean,
      required: true
    }
  },
  setup(props, { emit }) {
    const router = useRouter();
    const auth = useAuth();  // Call the composable to get the auth methods
    const username = ref('');
    const password = ref('');
    const isLoading = ref(false);
    const errorMessage = ref('');

    const handleLogin = async () => {
      isLoading.value = true;
      errorMessage.value = '';

      try {
        const response = await api.login({
          username: username.value,
          password: password.value
        });
        
        console.log('Login successful:', response);

        // Use auth.login instead of auth.setToken
        await auth.login({
          username: username.value,
          password: password.value
        });

        // Emit login-success event with user data
        emit('login-success', response);
        closeForm();
        router.push('/bingo');
      } catch (error) {
        console.error('Login error:', error);
        errorMessage.value = error.msg || 'Login failed';
        auth.logout(); // Clear any existing auth data on error
      } finally {
        isLoading.value = false;
      }
    };

    const closeForm = () => {
      emit('close');
      username.value = '';
      password.value = '';
      errorMessage.value = '';
    };

    const openRegisterForm = () => {
      emit('openRegister');
      closeForm();
    };

    return {
      username,
      password,
      isLoading,
      errorMessage,
      handleLogin,
      closeForm,
      openRegisterForm
    };
  }
};
</script>