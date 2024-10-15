<template>
    <div class="analytics-page">
      <h1>Analytics Page</h1>
      <p>
            Check your trading analytics here!
      </p>
    </div>
  </template>
  
  <script>
  import '../assets/styles/HomePage.css';
  
  export default {
    name: 'ProfilePage',
    data() {
      return {
        welcomeMessage: 'Welcome to your analytics summary'
      }
    }
  }
  </script>

<style scoped>
.analytics-page {
    margin-top: 60px; /* This matches the navbar height */
}
</style>

  