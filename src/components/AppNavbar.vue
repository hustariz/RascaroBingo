<!-- src/components/AppNavbar.vue -->
<template>
  <nav class="navbar">
    <router-link to="/" class="navbar-brand">RascaroBingo</router-link>
    <div class="navbar-menu">
      <router-link to="/bingo" class="navbar-item">
        <font-awesome-icon icon="dice" class="icon" /> Bingo
      </router-link>
      <a href="#" class="navbar-item" @click.prevent="showContactForm">
        <font-awesome-icon icon="envelope" class="icon" /> Contact
      </a>
      <div v-if="isLoggedIn" class="dropdown">
        <a href="#" class="navbar-item" @click.prevent="toggleDropdown">
          <font-awesome-icon icon="user" class="icon" /> {{ username }}
        </a>
        <div v-if="isDropdownOpen" class="dropdown-menu">
          <router-link to="/profile" class="dropdown-item">
            <font-awesome-icon icon="user" class="icon" /> Profile
          </router-link>
          <router-link to="/analytics" class="dropdown-item">
            <font-awesome-icon icon="chart-bar" class="icon" /> Analytics
          </router-link>
          <a href="#" class="dropdown-item" @click.prevent="logout">
            <font-awesome-icon icon="sign-out-alt" class="icon" /> Logout
          </a>
        </div>
      </div>
      <a v-else href="#" class="navbar-item" @click.prevent="showLoginForm">
        <font-awesome-icon icon="user" class="icon" /> Login
      </a>
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
      isRegisterFormOpen: false,
      isDropdownOpen: false
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
    },
    toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }
  }
}
</script>