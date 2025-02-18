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
  emits: ['openLoginForm'],
  setup(props, { emit }) {
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
          emit('openLoginForm');
          router.push('/');
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
@import '@/assets/styles/forms/ResetPasswordForm.css';
</style>
