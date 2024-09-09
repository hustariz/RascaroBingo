<!-- src/components/LoginForm.vue -->
<template>
  <div class="form-overlay" v-if="isOpen" @click.self="closeForm">
    <div class="form">
      <h2>Login</h2>
      <form @submit.prevent="submitForm">
        <div class="form-group">
          <label for="username">Username:</label>
          <input type="text" id="username" v-model="username" required>
        </div>
        <div class="form-group">
          <label for="password">Password:</label>
          <input type="password" id="password" v-model="password" required>
        </div>
        <div class="form-actions">
          <button type="submit" :disabled="isLoading">
            {{ isLoading ? 'Logging in...' : 'Login' }}
          </button>
          <button type="button" @click="closeForm" :disabled="isLoading">Close</button>
        </div>
      </form>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      <p class="sign-in-link">Don't have an account yet? <a href="#" @click.prevent="openRegisterForm">Sign up now!</a></p>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  name: 'LoginForm',
  props: {
    isOpen: {
      type: Boolean,
      required: true
    }
  },
  setup(props, { emit }) {
    const store = useStore();
    const router = useRouter();
    const username = ref('');
    const password = ref('');
    const isLoading = ref(false);
    const errorMessage = ref('');

    const submitForm = async () => {
      isLoading.value = true;
      errorMessage.value = '';

  try {
    console.log('Attempting login...');
    const response = await store.dispatch('login', {
      username: username.value,
      password: password.value
    });
      console.log('Login response:', response);
      closeForm();
      router.push('/'); // Redirect to home page or dashboard
    } catch (error) {
      if (error.response && error.response.data && error.response.data.msg) {
        errorMessage.value = error.response.data.msg;
    } else {
        errorMessage.value = 'Login failed. Please try again.';
    }
    console.error('Login error:', error);
      } finally {
        isLoading.value = false;
      }
    };

    const closeForm = () => {
      emit('close');
      username.value = '';
      password.value = '';
      errorMessage.value = '';
    };

    const openRegisterForm = () => {
      emit('openRegister');
      closeForm();
    };

    return {
      username,
      password,
      isLoading,
      errorMessage,
      submitForm,
      closeForm,
      openRegisterForm
    };
  }
};
</script>