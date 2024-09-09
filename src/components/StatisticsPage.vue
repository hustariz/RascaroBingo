<template>
    <div class="stats-page">
      <h1>Statistics Page</h1>
      <p>
            Check your trading statistics here!
      </p>
    </div>
  </template>
  
  <script>
  import '../assets/styles/HomePage.css';
  
  export default {
    name: 'ProfilePage',
    data() {
      return {
        welcomeMessage: 'Welcome to your stats summary'
      }
    }
  }
  </script>

<style scoped>
.stats-page {
    margin-top: 60px; /* This matches the navbar height */
}
</style>

  