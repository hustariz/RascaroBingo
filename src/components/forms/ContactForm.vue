<!-- src/components/ContactForm.vue -->
<template>
  <div class="contact-form-overlay" 
       :class="{ visible: isOpen }" 
       @click.self="closeForm">
    <div class="contact-form-container">
      <h2 class="contact-form-title">Contact Us</h2>
      <form @submit.prevent="submitForm">
        <div class="contact-form-group">
          <label class="contact-form-label" for="name">Name:</label>
          <input class="contact-form-input" type="text" id="name" v-model="name" required>
        </div>
        <div class="contact-form-group">
          <label class="contact-form-label" for="email">Email:</label>
          <input class="contact-form-input" type="email" id="email" v-model="email" required>
        </div>
        <div class="contact-form-group">
          <label class="contact-form-label" for="message">Message:</label>
          <textarea class="contact-form-textarea" id="message" v-model="message" required></textarea>
        </div>
        <div class="contact-form-actions">
          <button class="contact-form-submit" type="submit">Send</button>
          <button class="contact-form-close" type="button" @click="closeForm">Close</button>
        </div>
      </form>
    </div>
  </div>
</template>
  
  <script>
  import '@/assets/styles//forms/ContactForm.css';

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
