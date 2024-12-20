<!-- AppNavbar.vue -->
<template>
  <nav class="rb-navbar">
    <router-link to="/" class="rb-navbar-brand">RascaroBingo</router-link>
    
    <!-- Hamburger Menu Button -->
    <div class="rb-hamburger-menu" :class="{ 'active': isMenuOpen }" @click="toggleMenu">
      <span></span>
      <span></span>
      <span></span>
    </div>

    <div class="rb-navbar-menu" :class="{ 'active': isMenuOpen }">
      <router-link to="/bingo" class="rb-navbar-item" @click="closeMenu">
        <font-awesome-icon icon="dice" class="rb-icon" /> Bingo
      </router-link>
      <router-link to="/leaderboard" class="rb-navbar-item" @click="closeMenu">
        <font-awesome-icon icon="trophy" class="rb-icon" /> Leaderboard
      </router-link>
      <router-link to="/shop" class="rb-navbar-item" @click="closeMenu">
        <font-awesome-icon icon="store" class="rb-icon" /> Shop
      </router-link>
      <a href="#" class="rb-navbar-item" @click.prevent="showContactForm(); closeMenu()">
        <font-awesome-icon icon="envelope" class="rb-icon" /> Contact
      </a>

      <div v-if="isAuthenticated" class="rb-dropdown">
        <a href="#" class="rb-navbar-item" @click.prevent="toggleDropdown">
          <font-awesome-icon icon="user" class="rb-icon" /> {{ username }}
        </a>
        <div v-if="isDropdownOpen" class="rb-dropdown-menu">
          <router-link to="/profile" class="rb-dropdown-item" @click="closeMenu">
            <font-awesome-icon icon="user" class="rb-icon" /> Profile
          </router-link>
          <router-link to="/analytics" class="rb-dropdown-item" @click="closeMenu">
            <font-awesome-icon icon="chart-bar" class="rb-icon" /> Analytics
          </router-link>
          <a href="#" class="rb-dropdown-item" @click.prevent="handleLogout(); closeMenu()">
            <font-awesome-icon icon="sign-out-alt" class="rb-icon" /> Logout
          </a>
        </div>
        <router-link to="/about" class="rb-navbar-item" @click="closeMenu">
          <font-awesome-icon icon="info-circle" class="rb-icon" />
        </router-link>
      </div>
      <a v-else href="#" class="rb-navbar-item" @click.prevent="showLoginForm(); closeMenu()">
        <font-awesome-icon icon="user" class="rb-icon" /> Login
      </a>
    </div>

    <!-- Overlay -->
    <div class="rb-menu-overlay" :class="{ 'active': isMenuOpen }" @click="closeMenu"></div>

    <!-- Forms -->
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
    RegisterForm,
  },
  setup() {
    const router = useRouter();
    const isContactFormOpen = ref(false);
    const isLoginFormOpen = ref(false);
    const isRegisterFormOpen = ref(false);
    const isDropdownOpen = ref(false);
    const isMenuOpen = ref(false);
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

    const toggleMenu = () => {
      isMenuOpen.value = !isMenuOpen.value;
      document.body.style.overflow = isMenuOpen.value ? 'hidden' : '';
    };

    const closeMenu = () => {
      isMenuOpen.value = false;
      document.body.style.overflow = '';
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
      isMenuOpen,
      isAuthenticated,
      username,
      showContactForm,
      closeContactForm,
      showLoginForm,
      closeLoginForm,
      showRegisterForm,
      closeRegisterForm,
      toggleDropdown,
      toggleMenu,
      closeMenu,
      handleLogout,
      handleLoginSuccess
    };
  }
};
</script>