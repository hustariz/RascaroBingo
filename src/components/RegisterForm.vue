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
            <button type="submit">Register</button>
            <button type="button" @click="closeForm">Close</button>
          </div>
        </form>
      </div>
    </div>
  </template>
  
  <script>
  import '../assets/styles/LoginForm.css'

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
        password: ''
      }
    },
    methods: {
      submitForm() {
        // Handle registration logic here
        console.log('Registration submitted:', { username: this.username, email: this.email, password: this.password });
        this.closeForm();
      },
      closeForm() {
        this.$emit('close');
      }
    }
  }
  </script>