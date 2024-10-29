<!-- src/components/RegisterForm.vue -->
<template>
  <div class="form-overlay" v-if="isOpen" @click.self="closeForm">
    <div class="form">
      <h2>Register</h2>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="username">Username:</label>
          <input type="text" id="username" v-model="username" required>
        </div>
        <div class="form-group">
          <label for="email">Email:</label>
          <input type="email" id="email" v-model="email" required>
        </div>
        <div class="form-group">
          <label for="password">Password:</label>
          <input type="password" id="password" v-model="password" required>
        </div>
        <div class="form-actions">
          <button type="submit" :disabled="isLoading">
            {{ isLoading ? 'Registering...' : 'Register' }}
          </button>
          <button type="button" @click="closeForm" :disabled="isLoading">Close</button>
        </div>
      </form>
      <p v-if="message" :class="{ 'error-message': isError, 'success-message': !isError }">
        {{ message }}
      </p>
    </div>
  </div>
</template>

<script>
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