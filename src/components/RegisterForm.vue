<!-- src/components/RegisterForm.vue -->
<template>
  <div class="form-overlay" v-if="isOpen" @click.self="closeForm">
    <div class="form">
      <h2>Register</h2>
      <form @submit.prevent="submitForm">
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
import '../assets/styles/LoginForm.css'
import api from '@/api'

export default {
  name: 'RegisterForm',
  props: {
    isOpen: {
      type: Boolean,
      required: true
    }
  },
  data() {
    return {
      username: '',
      email: '',
      password: '',
      isLoading: false,
      message: '',
      isError: false
    }
  },
  methods: {
    async submitForm() {
      this.isLoading = true;
      this.message = '';
      this.isError = false;

      try {
        const response = await api.register({
          username: this.username,
          email: this.email,
          password: this.password
        });
        
        this.message = 'Registration successful!';
        console.log('Registration response:', response.data);
        
        // You might want to store the token or user data in your app's state management
        // For example, if using Vuex:
        // this.$store.commit('setToken', response.data.token);
        
        setTimeout(() => {
          this.closeForm();
        }, 2000);
      } catch (error) {
        this.isError = true;
        this.message = error.response?.data?.msg || 'Registration failed. Please try again.';
        console.error('Registration error:', error);
      } finally {
        this.isLoading = false;
      }
    },
    closeForm() {
      this.$emit('close');
      // Reset form data
      this.username = '';
      this.email = '';
      this.password = '';
      this.message = '';
      this.isError = false;
    }
  }
}
</script>

<style scoped>
.error-message {
  color: red;
}
.success-message {
  color: rgb(238, 175, 17);
}
</style>