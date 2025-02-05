<template>
  <div class="email-verification">
    <div class="verification-container">
      <div v-if="loading" class="verification-status">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Verifying your email...</p>
      </div>
      
      <div v-else-if="verified" class="verification-status success">
        <i class="fas fa-check-circle"></i>
        <h2>Email Verified!</h2>
        <p>Your email has been successfully verified. Please log in to access your account.</p>
        <button @click="openLoginForm" class="btn-primary">
          Log In
        </button>
      </div>
      
      <div v-else class="verification-status error">
        <i class="fas fa-exclamation-circle"></i>
        <h2>Verification Failed</h2>
        <p>{{ errorMessage }}</p>
        <button v-if="canResend" @click="handleResend" class="btn-primary">
          Resend Verification Email
        </button>
      </div>
    </div>

    <!-- Login Form -->
    <LoginForm 
      :isOpen="isLoginFormOpen" 
      @close="closeLoginForm"
      @openRegister="showRegisterForm"
      @login-success="handleLoginSuccess"
    />
  </div>
</template>

<script>
import '@/assets/styles/EmailVerification.css';
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/services/api';
import LoginForm from './LoginForm.vue';

export default {
  name: 'EmailVerification',
  components: {
    LoginForm
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const loading = ref(true);
    const verified = ref(false);
    const errorMessage = ref('');
    const canResend = ref(false);
    const isLoginFormOpen = ref(false);

    const verifyEmail = async (token) => {
      try {
        await api.verifyEmail(token);
        verified.value = true;
      } catch (error) {
        errorMessage.value = error.response?.data?.message || 'Verification failed. Please try again.';
        canResend.value = true;
      } finally {
        loading.value = false;
      }
    };

    const handleResend = async () => {
      try {
        loading.value = true;
        await api.resendVerification(route.query.email);
        errorMessage.value = 'A new verification email has been sent. Please check your inbox.';
      } catch (error) {
        errorMessage.value = 'Failed to resend verification email. Please try again later.';
      } finally {
        loading.value = false;
      }
    };

    const openLoginForm = () => {
      isLoginFormOpen.value = true;
    };

    const closeLoginForm = () => {
      isLoginFormOpen.value = false;
    };

    const handleLoginSuccess = () => {
      router.push('/');
    };

    onMounted(() => {
      const token = route.params.token;
      if (token) {
        verifyEmail(token);
      } else {
        loading.value = false;
        errorMessage.value = 'Invalid verification link.';
      }
    });

    return {
      loading,
      verified,
      errorMessage,
      canResend,
      handleResend,
      isLoginFormOpen,
      openLoginForm,
      closeLoginForm,
      handleLoginSuccess
    };
  }
};
</script>
