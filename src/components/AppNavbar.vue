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
      <div v-if="isAuthenticated" class="dropdown">
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
          <a href="#" class="dropdown-item" @click.prevent="handleLogout">
            <font-awesome-icon icon="sign-out-alt" class="icon" /> Logout
          </a>
        </div>
      </div>
      <a v-else href="#" class="navbar-item" @click.prevent="showLoginForm">
        <font-awesome-icon icon="user" class="icon" /> Login
      </a>
    </div>
    <ContactForm :isOpen="isContactFormOpen" @close="closeContactForm" />
    <LoginForm 
      :isOpen="isLoginFormOpen" 
      @close="closeLoginForm" 
      @openRegister="showRegisterForm"
      @login-success="handleLoginSuccess"
    />
    <RegisterForm 
      :isOpen="isRegisterFormOpen" 
      @close="closeRegisterForm"
      @register-success="handleLoginSuccess"
    />
  </nav>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import '../assets/styles/AppNavbar.css';
import ContactForm from './ContactForm.vue';
import LoginForm from './LoginForm.vue';
import RegisterForm from './RegisterForm.vue';
import api from '@/services/api';

export default {
  name: 'AppNavbar',
  components: {
    ContactForm,
    LoginForm,
    RegisterForm
  },
  setup() {
    const router = useRouter();
    const isContactFormOpen = ref(false);
    const isLoginFormOpen = ref(false);
    const isRegisterFormOpen = ref(false);
    const isDropdownOpen = ref(false);
    const username = ref('');
    const isAuthenticated = ref(false);

    const checkAuth = async () => {
      try {
        if (api.isAuthenticated()) {
          isAuthenticated.value = true;
          username.value = localStorage.getItem('username') || '';
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        handleLogout();
      }
    };

    const handleLoginSuccess = (userData) => {
      console.log('Login success:', userData);
      username.value = userData.username;
      isAuthenticated.value = true;
      isLoginFormOpen.value = false;
      isRegisterFormOpen.value = false;
    };

    const handleLogout = () => {
      api.logout();
      username.value = '';
      isAuthenticated.value = false;
      isDropdownOpen.value = false;
      router.push('/');
    };

    const showContactForm = () => isContactFormOpen.value = true;
    const closeContactForm = () => isContactFormOpen.value = false;
    const showLoginForm = () => isLoginFormOpen.value = true;
    const closeLoginForm = () => isLoginFormOpen.value = false;
    const showRegisterForm = () => isRegisterFormOpen.value = true;
    const closeRegisterForm = () => isRegisterFormOpen.value = false;
    const toggleDropdown = () => isDropdownOpen.value = !isDropdownOpen.value;

    onMounted(() => {
      checkAuth();
    });

    return {
      isContactFormOpen,
      isLoginFormOpen,
      isRegisterFormOpen,
      isDropdownOpen,
      isAuthenticated,
      username,
      showContactForm,
      closeContactForm,
      showLoginForm,
      closeLoginForm,
      showRegisterForm,
      closeRegisterForm,
      toggleDropdown,
      handleLogout,
      handleLoginSuccess
    };
  }
};
</script>