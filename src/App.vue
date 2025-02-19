<template>
  <div id="app">
    <Navbar />
    <TradeHistorySection 
      v-if="showTradeHistory"
      :is-visible="showTradeHistory"
      :is-sidebar-collapsed="false"
      @close="showTradeHistory = false"
    />
    <router-view 
      @open-login-form="showLoginForm = true"
      @open-register-form="showRegisterForm = true"
      @open-trade-history="showTradeHistory = true"
    ></router-view>
  </div>
</template>

<script>
import Navbar from '@/components/app/AppNavbar.vue'
import TradeHistorySection from '@/components/app/TradeHistorySection.vue'
import { mapActions } from 'vuex'

export default {
  name: 'App',
  components: {
    Navbar,
    TradeHistorySection
  },
  data() {
    return {
      showTradeHistory: false,
      showLoginForm: false,
      showRegisterForm: false
    }
  },
  methods: {
    ...mapActions('user', ['getCurrentUser'])
  },
  async created() {
    // Check if auth state exists before accessing token
    if (localStorage.getItem('token')) {
      try {
        // Load user data first
        const userData = await this.getCurrentUser();
        console.log('👤 User data initialized:', userData);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    }
  }
}
</script>

<style>
body {
  margin: 0;
  padding: 0;
  background-image: url('./assets/images/BingoBackgroundClassy.png');
  background-color: #000; /* Fallback color */
  background-attachment: fixed;
  background-size: cover;
  min-height: 100vh;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #ffffff;
  min-height: 100vh;
}

/* Desktop styles */
@media screen and (min-width: 769px) {
  body {
    background-size: 100%;
    background-position: center 80%;
  }
}

/* Mobile styles */
@media screen and (max-width: 768px) {
  body {
    background-size: cover;
    background-position: center center;
    background-attachment: scroll;
    background-repeat: no-repeat;
  }
}

/* Small phones */
@media screen and (max-width: 380px) {
  body {
    background-size: auto 100vh;
  }
}
</style>