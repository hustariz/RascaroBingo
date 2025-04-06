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
  watch: {
    '$route.path': {
      immediate: true,
      handler(newPath) {
        // Remove any previous route classes
        document.body.classList.remove('route-bingo');
        document.body.classList.remove('route-home');
        
        // Add current route class
        if (newPath === '/bingo') {
          document.body.classList.add('route-bingo');
        } else if (newPath === '/') {
          document.body.classList.add('route-home');
        }
      }
    }
  },
  methods: {
    ...mapActions('user', ['getCurrentUser']),
    ...mapActions('trades', ['fetchTrades'])
  },
  async created() {
    // Check if auth state exists before accessing token
    if (localStorage.getItem('token')) {
      try {
        // Load user data first
        const userData = await this.getCurrentUser();
        console.log('👤 User data initialized:', userData);
        
        // Then fetch trades
        await this.fetchTrades();
        console.log('📊 Trades initialized');
      } catch (error) {
        console.error('Error loading initial data:', error);
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
  background-repeat: no-repeat;
  background-position: center center;
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
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
    background-size: cover;
  }
}

/* Mobile styles */
@media screen and (max-width: 768px) {
  body {
    background-size: cover;
    background-position: center center;
    background-attachment: fixed;
  }
}

/* Small phones and portrait orientation */
@media screen and (max-width: 380px), (orientation: portrait) {
  body {
    background-size: cover;
  }
}

/* Custom Scrollbar Styling */
::-webkit-scrollbar {
  width: 10px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #d4af37, #f2d272, #d4af37);
  border-radius: 10px;
  border: 2px solid rgba(0, 0, 0, 0.5);
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, #f2d272, #d4af37, #f2d272);
}

/* Firefox scrollbar */
* {
  scrollbar-width: thin;
  scrollbar-color: #d4af37 rgba(0, 0, 0, 0.5);
}

/* Route-specific styles */
body.route-bingo {
  overflow: hidden !important; /* Prevent scrollbars on bingo page */
}

body.route-home {
  overflow-y: auto !important; /* Ensure scrollbars on homepage */
}

/* Fix for navbar overlap on Bingo page */
body.route-bingo #app {
  padding-top: 1.5rem; /* Match the original margin-top value */
}
</style>