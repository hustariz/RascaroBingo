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
                 type="email" 
                 id="register-email" 
                 v-model="email" 
                 required>
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
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
    const router = useRouter();
    const username = ref('');
    const email = ref('');
    const password = ref('');
    const isLoading = ref(false);
    const message = ref('');
    const isError = ref(false);

    const handleRegister = async () => {
      isLoading.value = true;
      message.value = '';
      isError.value = false;

      try {
        const response = await api.register({
          username: username.value,
          email: email.value,
          password: password.value
        });
        
        console.log('Registration successful:', response);
        message.value = 'Registration successful!';
        
        setTimeout(() => {
          closeForm();
          router.push('/');
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
      emit('close');
      username.value = '';
      email.value = '';
      password.value = '';
      message.value = '';
      isError.value = false;
    };

    return {
      username,
      email,
      password,
      isLoading,
      message,
      isError,
      handleRegister,
      closeForm
    };
  }
};
</script>