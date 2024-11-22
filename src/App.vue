<template>
  <div id="app">
    <Navbar />
    <router-view></router-view>
  </div>
</template>

<script>
import Navbar from './components/AppNavbar.vue'

export default {
  name: 'App',
  async beforeMount() {
    // Check if auth state exists before accessing token
    if (this.$store.state.auth?.token) {
      try {
        await this.$store.dispatch('riskManagement/fetchRiskManagement');
        console.log('Risk management data initialized');
      } catch (error) {
        console.error('Error loading risk management data:', error);
      }
    }
  },
  components: {
    Navbar
  }
}
</script>

<style>
body {
  margin: 0;
  padding: 0;
  background-image: url('./assets/images/BingoBackgroundClassy.png');
  background-size: cover;
  background-size: 76%;
  background-position: center;
  background-attachment: fixed;
  min-height: 100vh;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #ffffff;
}
</style>