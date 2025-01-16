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
        <p>Your email has been successfully verified. You can now access all features of your account.</p>
        <button @click="goToHome" class="verification-button">
          Go to Homepage
        </button>
      </div>
      
      <div v-else class="verification-status error">
        <i class="fas fa-exclamation-circle"></i>
        <h2>Verification Failed</h2>
        <p>{{ errorMessage }}</p>
        <button v-if="canResend" @click="handleResend" class="verification-button">
          Resend Verification Email
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/services/api';

export default {
  name: 'EmailVerification',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const loading = ref(true);
    const verified = ref(false);
    const errorMessage = ref('');
    const canResend = ref(false);

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

    const goToHome = () => {
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
      goToHome
    };
  }
};
</script>

<style scoped>
.email-verification {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.8);
}

.verification-container {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgb(238, 175, 17);
  border-radius: 15px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  text-align: center;
  box-shadow: 0 0 20px rgba(238, 175, 17, 0.2);
}

.verification-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: white;
}

.verification-status i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.verification-status.success i {
  color: #4CAF50;
}

.verification-status.error i {
  color: #ff4444;
}

.verification-status h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: rgb(238, 175, 17);
}

.verification-button {
  background: rgba(238, 175, 17, 0.8);
  color: black;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 25px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
}

.verification-button:hover {
  background: rgb(238, 175, 17);
  transform: translateY(-2px);
}
</style>
