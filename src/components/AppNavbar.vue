<!-- src/components/AppNavbar.vue -->
<template>
  <nav class="navbar">
    <router-link to="/" class="navbar-brand">RascaroBingo</router-link>
    <div class="navbar-menu">
      <router-link to="/bingo" class="navbar-item">Bingo</router-link>
      <a href="#" class="navbar-item" @click.prevent="showContactForm">Contact</a>
      <a href="#" class="navbar-item" @click.prevent="showLoginForm">Login</a>
    </div>
    <ContactForm :isOpen="isContactFormOpen" @close="closeContactForm" />
    <LoginForm :isOpen="isLoginFormOpen" @close="closeLoginForm" @openRegister="showRegisterForm" />
    <RegisterForm :isOpen="isRegisterFormOpen" @close="closeRegisterForm" />
  </nav>
</template>

<script>
import '../assets/styles/AppNavbar.css';
import ContactForm from './ContactForm.vue';
import LoginForm from './LoginForm.vue';
import RegisterForm from './RegisterForm.vue';

export default {
  name: 'AppNavbar',
  components: {
    ContactForm,
    LoginForm,
    RegisterForm
  },
  data() {
    return {
      isContactFormOpen: false,
      isLoginFormOpen: false,
      isRegisterFormOpen: false
    }
  },
  methods: {
    showContactForm() {
      this.isContactFormOpen = true;
    },
    closeContactForm() {
      this.isContactFormOpen = false;
    },
    showLoginForm() {
      this.isLoginFormOpen = true;
    },
    closeLoginForm() {
      this.isLoginFormOpen = false;
    },
    showRegisterForm() {
      this.isRegisterFormOpen = true;
    },
    closeRegisterForm() {
      this.isRegisterFormOpen = false;
    }
  }
}
</script>