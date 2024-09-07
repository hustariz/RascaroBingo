<!-- src/components/AppNavbar.vue -->
<template>
  <nav class="navbar">
    <router-link to="/" class="navbar-brand">RascaroBingo</router-link>
    <div class="navbar-menu">
      <router-link to="/bingo" class="navbar-item">Bingo</router-link>
      <a href="#" class="navbar-item" @click.prevent="showContactForm">Contact</a>
      <template v-if="isLoggedIn">
        <span class="navbar-item">Welcome, {{ username }}</span>
        <a href="#" class="navbar-item" @click.prevent="logout">Logout</a>
      </template>
      <a v-else href="#" class="navbar-item" @click.prevent="showLoginForm">Login</a>
    </div>
    <ContactForm :isOpen="isContactFormOpen" @close="closeContactForm" />
    <LoginForm :isOpen="isLoginFormOpen" @close="closeLoginForm" @openRegister="showRegisterForm" />
    <RegisterForm :isOpen="isRegisterFormOpen" @close="closeRegisterForm" />
  </nav>
</template>

<script>
import { mapState, mapActions } from 'vuex';
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
  computed: {
    ...mapState({
      isLoggedIn: state => state.auth.isLoggedIn,
      username: state => state.auth.user?.username
    })
  },
  data() {
    return {
      isContactFormOpen: false,
      isLoginFormOpen: false,
      isRegisterFormOpen: false
    }
  },
  methods: {
    ...mapActions(['logout']),
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