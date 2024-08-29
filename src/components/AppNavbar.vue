<!-- src/components/AppNavbar.vue -->
<template>
  <nav class="navbar">
    <router-link to="/" class="navbar-brand">RascaroBingo</router-link>
    <div class="navbar-menu">
      <router-link to="/bingo" class="navbar-item">Bingo</router-link>
      <a href="#" class="navbar-item" @click.prevent="showContactForm">Contact</a>
      <a href="#" class="navbar-item">Login</a>
    </div>
    <ContactForm :isOpen="isContactFormOpen" @close="closeContactForm" />
  </nav>
</template>

<script>
import '../assets/styles/AppNavbar.css';
import ContactForm from './ContactForm.vue';

export default {
  name: 'AppNavbar',
  components: {
    ContactForm
  },
  data() {
    return {
      isContactFormOpen: false
    }
  },
  methods: {
    showContactForm() {
      this.isContactFormOpen = true;
    },
    closeContactForm() {
      this.isContactFormOpen = false;
    }
  }
}
</script>