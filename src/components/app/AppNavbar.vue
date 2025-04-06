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
      </div>
      <a v-else href="#" class="rb-navbar-item" @click.prevent="showLoginForm(); closeMenu()">
        <font-awesome-icon icon="user" class="rb-icon" /> Login
      </a>
    </div>
    <div class="rb-dropdown">
      <a href="#" class="rb-navbar-item" @click.prevent="toggleToolbox">
        <font-awesome-icon icon="toolbox" class="rb-icon" />
      </a>
      <div v-if="isToolboxOpen" class="rb-dropdown-menu toolbox-dropdown-menu">
        <div class="toolbox-grid">
          <div 
            class="toolbox-item" 
            :class="{ 'toolbox-item-active': isWidgetActive('bingo') }" 
            @click="toggleWidget('bingo')" 
            title="Bingo Grid"
          >
            <font-awesome-icon icon="dice" class="toolbox-icon" />
          </div>
          <div 
            class="toolbox-item" 
            :class="{ 'toolbox-item-active': isWidgetActive('risk-reward') }" 
            @click="toggleWidget('risk-reward')" 
            title="Risk/Reward Calculator"
          >
            <font-awesome-icon icon="chart-line" class="toolbox-icon" />
          </div>
          <div 
            class="toolbox-item" 
            :class="{ 'toolbox-item-active': isWidgetActive('trade-details') }" 
            @click="toggleWidget('trade-details')" 
            title="Trade Details"
          >
            <font-awesome-icon icon="edit" class="toolbox-icon" />
          </div>
          <div 
            class="toolbox-item" 
            :class="{ 'toolbox-item-active': isWidgetActive('trade-idea') }" 
            @click="toggleWidget('trade-idea')" 
            title="Trade Idea"
          >
            <font-awesome-icon icon="lightbulb" class="toolbox-icon" />
          </div>
        </div>
      </div>
    </div>
    <router-link to="/about" class="rb-navbar-item" @click="closeMenu">
      <font-awesome-icon icon="circle-question" class="rb-icon" />
    </router-link>

    <!-- Overlay -->
    <div class="rb-menu-overlay" :class="{ 'active': isMenuOpen }" @click="closeMenu"></div>

    <!-- Forms -->
    <ContactForm :isOpen="isContactFormOpen" @close="closeContactForm" />
    <LoginForm 
      :isOpen="isLoginFormOpen" 
      :prefillUsername="prefillUsername"
      @close="closeLoginForm" 
      @openRegister="showRegisterForm"
      @login-success="handleLoginSuccess"
    />
    <RegisterForm 
      :isOpen="isRegisterFormOpen" 
      @close="closeRegisterForm"
      @register-success="handleLoginSuccess"
      @email-exists="handleEmailExists"
    />
  </nav>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import '@/assets/styles/AppNavbar.css';
import ContactForm from '../forms/ContactForm.vue';
import LoginForm from '../forms/LoginForm.vue';
import RegisterForm from '../forms/RegisterForm.vue';
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
    const isToolboxOpen = ref(false);
    const isMenuOpen = ref(false);
    const username = ref('');
    const isAuthenticated = ref(false);
    const prefillUsername = ref('');
    const activeWidgets = ref([]);

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
    const closeLoginForm = () => {
      isLoginFormOpen.value = false;
      prefillUsername.value = '';
    };
    const showRegisterForm = () => isRegisterFormOpen.value = true;
    const closeRegisterForm = () => isRegisterFormOpen.value = false;
    const toggleDropdown = () => isDropdownOpen.value = !isDropdownOpen.value;
    
    const toggleToolbox = () => isToolboxOpen.value = !isToolboxOpen.value;
    
    // Check for active widgets when component is created
    const checkActiveWidgets = () => {
      // Get active widgets from localStorage or initialize empty array
      const storedWidgets = localStorage.getItem('activeWidgets');
      if (storedWidgets) {
        activeWidgets.value = JSON.parse(storedWidgets);
        console.log('Loaded active widgets from localStorage:', activeWidgets.value);
      }
    };
    
    // Call this function when component is created
    checkActiveWidgets();
    
    // Set up a watcher to check localStorage for changes
    const checkLocalStorageForChanges = () => {
      const storedWidgets = localStorage.getItem('activeWidgets');
      if (storedWidgets) {
        const parsedWidgets = JSON.parse(storedWidgets);
        if (JSON.stringify(parsedWidgets) !== JSON.stringify(activeWidgets.value)) {
          console.log('Active widgets changed in localStorage:', parsedWidgets);
          activeWidgets.value = parsedWidgets;
        }
      }
    };
    
    // Check localStorage every second for changes
    setInterval(checkLocalStorageForChanges, 1000);
    
    // Function to check if a widget is active based on its type
    const isWidgetActive = (widgetType) => {
      // For most widgets, just check if they're in the activeWidgets array
      if (widgetType === 'risk-reward') {
        // Special case for risk-reward widget
        // First check if it's in the activeWidgets array
        const isInArray = activeWidgets.value.includes(widgetType);
        console.log('Checking if risk-reward is active:', isInArray, 'Active widgets:', activeWidgets.value);
        return isInArray;
      }
      
      // For all other widgets, just check the activeWidgets array
      return activeWidgets.value.includes(widgetType);
    };
    
    // Check for URL parameters that might indicate widget state changes
    onMounted(() => {
      const query = router.currentRoute.value.query;
      
      // If we're adding a widget via URL parameter
      if (query.addWidget && !activeWidgets.value.includes(query.addWidget)) {
        activeWidgets.value.push(query.addWidget);
        localStorage.setItem('activeWidgets', JSON.stringify(activeWidgets.value));
      }
      
      // If we're removing a widget via URL parameter
      if (query.removeWidget) {
        activeWidgets.value = activeWidgets.value.filter(type => type !== query.removeWidget);
        localStorage.setItem('activeWidgets', JSON.stringify(activeWidgets.value));
      }
    });
    
    const toggleWidget = (widgetType) => {
      // Check if widget is already active
      const isActive = isWidgetActive(widgetType);
      console.log(`Toggling widget ${widgetType}, currently active: ${isActive}`);
      
      if (isActive) {
        // Remove widget
        activeWidgets.value = activeWidgets.value.filter(type => type !== widgetType);
        console.log(`Removed ${widgetType} from active widgets:`, activeWidgets.value);
        
        // Save to localStorage
        localStorage.setItem('activeWidgets', JSON.stringify(activeWidgets.value));
        
        // Tell BingoPage to remove the widget
        router.push({ 
          path: '/bingo',
          query: { removeWidget: widgetType }
        });
      } else {
        // Add widget to active list
        activeWidgets.value.push(widgetType);
        console.log(`Added ${widgetType} to active widgets:`, activeWidgets.value);
        
        // Save to localStorage
        localStorage.setItem('activeWidgets', JSON.stringify(activeWidgets.value));
        
        // Tell BingoPage to add the widget
        router.push({ 
          path: '/bingo',
          query: { addWidget: widgetType }
        });
      }
    };

    const handleEmailExists = ({ username: existingUsername }) => {
      console.log('Email exists, username:', existingUsername);
      prefillUsername.value = existingUsername;
      // Close register form and open login form with prefilled username after the register form closes
      setTimeout(() => {
        isLoginFormOpen.value = true;
      }, 3500); // Wait a bit longer than the register form close delay
    };

    onMounted(() => {
      checkAuth();
    });

    return {
      isContactFormOpen,
      isLoginFormOpen,
      isRegisterFormOpen,
      isDropdownOpen,
      isToolboxOpen,
      isMenuOpen,
      isAuthenticated,
      username,
      prefillUsername,
      activeWidgets,
      showContactForm,
      closeContactForm,
      showLoginForm,
      closeLoginForm,
      showRegisterForm,
      closeRegisterForm,
      toggleDropdown,
      toggleToolbox,
      toggleWidget,
      isWidgetActive,
      toggleMenu,
      closeMenu,
      handleLogout,
      handleLoginSuccess,
      handleEmailExists
    };
  }
};
</script>