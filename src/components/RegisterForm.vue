<!-- src/components/RegisterForm.vue -->
<template>
  <div class="register-form-overlay" 
       :class="{ visible: isOpen }" 
       @click.self="closeForm">
    <div class="register-form-container">
      <h2 class="register-form-title">Register</h2>
      <form @submit.prevent="handleRegister">
        <div class="register-form-group">
          <label class="register-form-label" for="register-username">Username:</label>
          <input class="register-form-input" 
                 type="text" 
                 id="register-username" 
                 v-model="username" 
                 required>
        </div>
        <div class="register-form-group">
          <label class="register-form-label" for="register-email">Email:</label>
          <input class="register-form-input" 
                 :class="{ 'error': emailError }"
                 type="email" 
                 id="register-email" 
                 v-model="email" 
                 required>
          <span class="register-form-error-text" v-if="emailError">{{ emailError }}</span>
        </div>
        <div class="register-form-group">
          <label class="register-form-label" for="register-password">Password:</label>
          <input class="register-form-input" 
                 type="password" 
                 id="register-password" 
                 v-model="password" 
                 required>
        </div>
        <div class="register-form-actions">
          <button class="register-form-submit" 
                  type="submit" 
                  :disabled="isLoading">
            {{ isLoading ? 'Registering...' : 'Register' }}
          </button>
          <button class="register-form-close" 
                  type="button" 
                  @click="closeForm" 
                  :disabled="isLoading">Close</button>
        </div>
      </form>
      <p v-if="message" 
         :class="{ 
           'register-form-error': isError, 
           'register-form-success': !isError 
         }">
        {{ message }}
      </p>
    </div>
  </div>
</template>
<script>
import '../assets/styles/RegisterForm.css';
import { ref, computed } from 'vue';
import api from '@/services/api'; 

export default {
  name: 'RegisterForm',
  props: {
    isOpen: {
      type: Boolean,
      required: true
    }
  },
  setup(props, { emit }) {
    const username = ref('');
    const email = ref('');
    const password = ref('');
    const isLoading = ref(false);
    const message = ref('');
    const isError = ref(false);
    const emailError = ref('');

    const isValidEmail = computed(() => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email.value);
    });

    const validateEmail = async () => {
      emailError.value = '';
      
      if (!isValidEmail.value) {
        emailError.value = 'Please enter a valid email address';
        return false;
      }

      try {
        const { exists } = await api.checkEmail(email.value);
        if (exists) {
          emailError.value = 'This email is already registered';
          return false;
        }
        return true;
      } catch (error) {
        console.error('Email validation error:', error);
        emailError.value = 'Error checking email availability';
        return false;
      }
    };

    const handleRegister = async () => {
      isLoading.value = true;
      message.value = '';
      isError.value = false;

      // Validate email before proceeding
      if (!await validateEmail()) {
        isLoading.value = false;
        isError.value = true;
        message.value = emailError.value;
        return;
      }

      try {
        await api.register({
          username: username.value,
          email: email.value,
          password: password.value
        });
        
        message.value = 'Registration successful! Please check your email to verify your account.';
        
        // Don't redirect immediately, wait for email verification
        setTimeout(() => {
          closeForm();
        }, 2000);
      } catch (error) {
        console.error('Registration error:', error);
        isError.value = true;
        message.value = error.response?.data?.msg || 'Registration failed';
      } finally {
        isLoading.value = false;
      }
    };

    const closeForm = () => {
      username.value = '';
      email.value = '';
      password.value = '';
      message.value = '';
      isError.value = false;
      emailError.value = '';
      emit('close');
    };

    return {
      username,
      email,
      password,
      isLoading,
      message,
      isError,
      emailError,
      handleRegister,
      closeForm
    };
  }
};
</script>
<style scoped>
.register-form-input.error {
  border-color: #ff4444;
}

.register-form-error-text {
  color: #ff4444;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}
</style>