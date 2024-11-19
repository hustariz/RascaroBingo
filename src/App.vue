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