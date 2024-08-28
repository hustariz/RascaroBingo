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
import '../assets/styles/AppNavbar.css';

export default {
  name: 'AppNavbar'
}
</script>
