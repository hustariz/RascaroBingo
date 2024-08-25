<template>
  <div id="app">
    <Navbar />
    <HelloWorld msg="Welcome to RascaroBingo"/>
    <img alt="Vue logo" src="./assets/Mini-Kakul.jpg">
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'
import Navbar from './components/AppNavbar.vue'

export default {
  name: 'App',
  components: {
    HelloWorld,
    Navbar
  }
}
</script>

<style>
body {
  margin: 0;
  padding: 0;
  background-image: url('./assets/Temporary_background.jpg');
  background-size: cover;
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