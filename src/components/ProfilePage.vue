<template>
    <div class="profile-page">
      <h1>Profile Page</h1>
      <p>
            Change your profile settings here
      </p>
    </div>
  </template>
  
  <script>
  import '../assets/styles/HomePage.css';
  
  export default {
    name: 'ProfilePage',
    data() {
      return {
        welcomeMessage: 'Welcome to the Profile Settings'
      }
    }
  }
  </script>

<style scoped>
.profile-page {
    margin-top: 60px; /* This matches the navbar height */
}
</style>

  