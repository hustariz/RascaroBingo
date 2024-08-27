<!-- src/components/AppNavbar.vue -->
<template>
  <nav class="navbar">
    <router-link to="/" class="navbar-brand">RascaroBingo</router-link>
    <div class="navbar-menu">
      <router-link to="/bingo" class="navbar-item">Bingo</router-link>
      <a href="#" class="navbar-item">Contact</a>
      <a href="#" class="navbar-item">Login</a>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'AppNavbar'
}
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-image: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(255,255,255,0));
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.navbar-brand {
  font-size: 1.5rem;
  font-weight: bold;
  color: red;
  text-decoration: none; /* Remove underline from link */
  cursor: pointer; /* Change cursor to pointer on hover */
}

.navbar-menu { 
  display: flex;
}

.navbar-item {
  margin-left: 1rem;
  text-decoration: none;
  color: #ffffff;
}
</style>