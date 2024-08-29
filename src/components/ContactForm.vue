<!-- src/components/ContactForm.vue -->
<template>
    <div class="contact-form-overlay" v-if="isOpen" @click.self="closeForm">
      <div class="contact-form">
        <h2>Contact Us</h2>
        <form @submit.prevent="submitForm">
          <div class="form-group">
            <label for="name">Name:</label>
            <input type="text" id="name" v-model="name" required>
          </div>
          <div class="form-group">
            <label for="email">Email:</label>
            <input type="email" id="email" v-model="email" required>
          </div>
          <div class="form-group">
            <label for="message">Message:</label>
            <textarea id="message" v-model="message" required></textarea>
          </div>
          <div class="form-actions">
            <button type="submit">Send</button>
            <button type="button" @click="closeForm">Close</button>
          </div>
        </form>
      </div>
    </div>
  </template>
  
  <script>
  import '../assets/styles/ContactForm.css';

  export default {
    name: 'ContactForm',
    props: {
      isOpen: {
        type: Boolean,
        required: true
      }
    },
    data() {
      return {
        name: '',
        email: '',
        message: ''
      }
    },
    methods: {
      submitForm() {
        // Handle form submission here
        console.log('Form submitted:', { name: this.name, email: this.email, message: this.message });
        this.closeForm();
      },
      closeForm() {
        this.$emit('close');
      }
    }
  }
  </script>
