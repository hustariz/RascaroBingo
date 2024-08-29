<!-- src/components/LoginForm.vue -->
<template>
    <div class="form-overlay" v-if="isOpen" @click.self="closeForm">
      <div class="form">
        <h2>Login</h2>
        <form @submit.prevent="submitForm">
          <div class="form-group">
            <label for="username">Username:</label>
            <input type="text" id="username" v-model="username" required>
          </div>
          <div class="form-group">
            <label for="password">Password:</label>
            <input type="password" id="password" v-model="password" required>
          </div>
          <div class="form-actions">
            <button type="submit">Login</button>
            <button type="button" @click="closeForm">Close</button>
          </div>
        </form>
        <p class="sign-in-link">Don't have an account yet? <a href="#" @click.prevent="openRegisterForm">Sign in now!</a></p>
      </div>
    </div>
  </template>
  
  <script>

  import '../assets/styles/LoginForm.css' 
  export default {
    name: 'LoginForm',
    props: {
      isOpen: {
        type: Boolean,
        required: true
      }
    },
    data() {
      return {
        username: '',
        password: ''
      }
    },
    methods: {
      submitForm() {
        // Handle login logic here
        console.log('Login submitted:', { username: this.username, password: this.password });
        this.closeForm();
      },
      closeForm() {
        this.$emit('close');
      },
      openRegisterForm() {
        this.$emit('openRegister');
        this.closeForm();
      }
    }
  }
  </script>
  