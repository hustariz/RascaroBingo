<!-- LoginForm.vue -->
<template>
  <div class="login-form-overlay" 
     :class="{ visible: isOpen }" 
     @click.self="closeForm">
    <div class="login-form-container">
      <h2 class="login-form-title">Login</h2>
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="login-form-group">
          <label class="login-form-label" for="login-username">Username:</label>
          <input class="login-form-input" 
                 type="text" 
                 id="login-username" 
                 v-model="username" 
                 required>
        </div>
        <div class="login-form-group">
          <label class="login-form-label" for="login-password">Password:</label>
          <input class="login-form-input" 
                 type="password" 
                 id="login-password" 
                 v-model="password" 
                 required>
          <div class="forgot-password">
            <a href="#" @click.prevent="showForgotPasswordModal = true">Forgot Password?</a>
          </div>
        </div>
        <div class="login-form-actions">
          <button class="login-form-submit" 
                  type="submit" 
                  :disabled="isLoading">
            {{ isLoading ? 'Logging in...' : 'Login' }}
          </button>
          <button class="login-form-close" 
                  type="button" 
                  @click="closeForm" 
                  :disabled="isLoading">Close</button>
        </div>
      </form>
      <p v-if="errorMessage" class="login-form-error">{{ errorMessage }}</p>
      <p class="login-form-signup">
        Don't have an account yet? 
        <a href="#" @click.prevent="openRegisterForm">Sign up now!</a>
      </p>

      <!-- Forgot Password Modal -->
      <div v-if="showForgotPasswordModal" class="modal">
        <div class="modal-content">
          <h3>Reset Password</h3>
          <div v-if="resetError" class="error-message">
            {{ resetError }}
          </div>
          <div v-if="resetSuccess" class="success-message">
            {{ resetSuccess }}
          </div>
          <div class="form-group">
            <label for="resetEmail">Email</label>
            <input
              type="email"
              id="resetEmail"
              v-model="resetEmail"
              required
              placeholder="Enter your email"
            />
          </div>
          <div class="modal-actions">
            <button 
              @click="requestPasswordReset" 
              :disabled="resetLoading"
              class="submit-button"
            >
              {{ resetLoading ? 'Sending...' : 'Send Reset Link' }}
            </button>
            <button 
              @click="showForgotPasswordModal = false"
              class="cancel-button"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import '@/assets/styles/LoginForm.css';
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import api from '@/services/api';

export default {
  name: 'LoginForm',
  props: {
    prefillUsername: {
      type: String,
      default: ''
    },
    isOpen: {
      type: Boolean,
      required: true
    },
    onClose: {
      type: Function,
      default: () => {}
    }
  },
  setup(props, { emit }) {
    const router = useRouter();
    const auth = useAuth();  
    const username = ref(props.prefillUsername);
    const password = ref('');
    const isLoading = ref(false);
    const errorMessage = ref('');
    const showForgotPasswordModal = ref(false);
    const resetEmail = ref('');
    const resetLoading = ref(false);
    const resetError = ref('');
    const resetSuccess = ref('');

    // Watch for changes in the prefillUsername prop
    watch(() => props.prefillUsername, (newValue) => {
      if (newValue) {
        username.value = newValue;
      }
    });

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
        
        // Navigate to bingo page and refresh
        await router.push('/bingo');
        console.log(' Refreshing page to ensure proper state...');
        window.location.reload();
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
      props.onClose();
      username.value = '';
      password.value = '';
      errorMessage.value = '';
    };

    const openRegisterForm = () => {
      emit('openRegister');
      closeForm();
    };

    const requestPasswordReset = async () => {
      if (!resetEmail.value) {
        resetError.value = 'Please enter your email';
        return;
      }

      resetLoading.value = true;
      resetError.value = '';
      resetSuccess.value = '';

      try {
        await api.requestPasswordReset(resetEmail.value);
        resetSuccess.value = 'Password reset link has been sent to your email';
        setTimeout(() => {
          showForgotPasswordModal.value = false;
          resetEmail.value = '';
          resetSuccess.value = '';
        }, 3000);
      } catch (err) {
        resetError.value = err.response?.data?.message || 'Failed to send reset link';
      } finally {
        resetLoading.value = false;
      }
    };

    return {
      username,
      password,
      isLoading,
      errorMessage,
      handleLogin,
      closeForm,
      openRegisterForm,
      showForgotPasswordModal,
      resetEmail,
      resetLoading,
      resetError,
      resetSuccess,
      requestPasswordReset
    };
  }
};
</script>