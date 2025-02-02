<template>
  <div class="reset-password-container">
    <div class="reset-password-form">
      <h2>Reset Password</h2>
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      <div v-if="success" class="success-message">
        {{ success }}
      </div>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="password">New Password</label>
          <input
            type="password"
            id="password"
            v-model="password"
            required
            minlength="6"
            placeholder="Enter your new password"
          />
        </div>
        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            v-model="confirmPassword"
            required
            minlength="6"
            placeholder="Confirm your new password"
          />
        </div>
        <button type="submit" :disabled="loading" class="submit-button">
          <span v-if="loading" class="loading-spinner">
            <font-awesome-icon icon="circle-notch" spin />
          </span>
          <span v-else>Reset Password</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import api from '@/services/api';

export default {
  name: 'ResetPassword',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const token = route.params.token;

    const password = ref('');
    const confirmPassword = ref('');
    const error = ref('');
    const success = ref('');
    const loading = ref(false);

    const handleSubmit = async () => {
      error.value = '';
      success.value = '';

      // Validate password
      if (password.value.length < 6) {
        error.value = 'Password must be at least 6 characters long';
        return;
      }

      if (password.value !== confirmPassword.value) {
        error.value = 'Passwords do not match';
        return;
      }

      loading.value = true;

      try {
        console.log('Attempting to reset password with token:', token);
        await api.resetPassword(token, password.value);
        success.value = 'Password reset successful! Redirecting to login...';
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } catch (err) {
        console.error('Password reset error:', err);
        error.value = err.response?.data?.message || 'Failed to reset password';
      } finally {
        loading.value = false;
      }
    };

    // Validate token on mount
    onMounted(() => {
      if (!token) {
        error.value = 'Invalid reset token';
        console.error('No token provided in URL');
      }
    });

    return {
      password,
      confirmPassword,
      error,
      success,
      loading,
      handleSubmit
    };
  }
};
</script>

<style>
.reset-password-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 1rem;
}

.reset-password-form {
  background: rgba(0, 0, 0, 0.8);
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 400px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(238, 177, 17, 0.3);
}

h2 {
  text-align: center;
  color: #eeb111;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #ffffff;
  font-size: 0.9rem;
}

input {
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(238, 177, 17, 0.3);
  border-radius: 4px;
  font-size: 1rem;
  color: #ffffff;
  transition: border-color 0.2s;
}

input:focus {
  outline: none;
  border-color: #eeb111;
  background: rgba(255, 255, 255, 0.15);
}

input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.submit-button {
  width: 100%;
  padding: 0.75rem;
  background-color: #eeb111;
  color: black;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
}

.submit-button:hover:not(:disabled) {
  background-color: #d49f0f;
}

.submit-button:disabled {
  background-color: rgba(238, 177, 17, 0.3);
  cursor: not-allowed;
}

.error-message {
  color: #ff4444;
  margin-bottom: 1rem;
  text-align: center;
  padding: 0.75rem;
  background: rgba(255, 68, 68, 0.1);
  border: 1px solid rgba(255, 68, 68, 0.3);
  border-radius: 4px;
}

.success-message {
  color: #00C851;
  margin-bottom: 1rem;
  text-align: center;
  padding: 0.75rem;
  background: rgba(0, 200, 81, 0.1);
  border: 1px solid rgba(0, 200, 81, 0.3);
  border-radius: 4px;
}

.loading-spinner {
  margin-right: 0.5rem;
}
</style>
