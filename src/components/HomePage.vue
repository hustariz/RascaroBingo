<template>
  <div class="home-page">
    <div v-if="$route.query.error" class="error-box">
      <font-awesome-icon icon="exclamation-circle" class="error-icon" />
      {{ $route.query.error }}
    </div>
    <h2 class="welcome-title">{{ welcomeMessage }}</h2>
    <div class="presentation-box">
      <p>
        Rascarobingo is a <strong>trading application</strong> with a bingo-style scoring system and <strong>risk management</strong> features.
      </p>
      <p>
        It is designed to help you to be a <strong>better trader</strong>, by managing your <strong>emotions</strong> and most importantly teaching you <br><strong>PATIENCE!</strong>
      </p>
      <p>
        All of this in a <strong>playful & stimulant frame</strong> while also providing <strong>analytics</strong> of your <strong>trading sessions</strong>.
      </p>
    </div>
    <div class="logo-container">
      <router-link to="/bingo" class="start-button"> 
        <span class="button-content">
          <span class="button-text">Start Here</span>
          <span class="button-border"></span>
        </span>
      </router-link>
    </div>
  </div>
</template>

<script>
import '../assets/styles/HomePage.css';

export default {
  name: 'HomePage',
  data() {
    return {
      welcomeMessage: 'Welcome to RascaroBingo',
      error: this.$route.query.error || null
    }
  },
  watch: {
    '$route.query.error'(newError) {
      this.error = newError;
    }
  }
}
</script>

<style scoped>
.error-box {
  background: linear-gradient(45deg, #e31837, #ff1f1f);
  color: white;
  padding: 1rem;
  border-radius: 15px;
  margin: 1rem auto;
  max-width: 600px;
  text-align: center;
  font-weight: 500;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  animation: slideIn 0.3s ease-out;
}

.error-icon {
  font-size: 1.2em;
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
