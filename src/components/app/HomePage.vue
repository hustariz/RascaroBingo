<template>
  <div class="home-page">
    <div v-if="$route.query.error" class="error-box">
      <font-awesome-icon icon="exclamation-circle" class="error-icon" />
      {{ $route.query.error }}
    </div>

    <div class="hero-section">
      <h2 class="welcome-title" data-text="Welcome to RascaroBingo">Welcome to RascaroBingo</h2>
    </div>
    <p class="hero-subtitle">Transform Your Trading Journey<br>with Fun and Discipline</p>
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">
          <font-awesome-icon icon="dice" />
        </div>
        <h3>Bingo Trading System</h3>
        <p>Turn your trading sessions into an engaging game of strategy and patience with our unique bingo-style scoring system.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">
          <font-awesome-icon icon="chart-line" />
        </div>
        <h3>Risk Management</h3>
        <p>Advanced risk management tools to protect your capital and optimize your trading performance.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">
          <font-awesome-icon icon="brain" />
        </div>
        <h3>Emotional Control</h3>
        <p>Master your trading psychology and develop the patience needed for successful trading.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">
          <font-awesome-icon icon="chart-bar" />
        </div>
        <h3>Analytics Dashboard</h3>
        <p>Track your progress with detailed analytics and insights into your trading performance.</p>
      </div>
    </div>

    <div class="presentation-box">
      <h3 class="section-title">Why RascaroBingo?</h3>
      <div class="benefits-list">
        <div class="benefit-item">
          <font-awesome-icon icon="check-circle" class="benefit-icon" />
          <span>Gamified trading experience to keep you engaged and focused</span>
        </div>
        <div class="benefit-item">
          <font-awesome-icon icon="check-circle" class="benefit-icon" />
          <span>Built-in risk management to protect your capital</span>
        </div>
        <div class="benefit-item">
          <font-awesome-icon icon="check-circle" class="benefit-icon" />
          <span>Real-time performance tracking and analytics</span>
        </div>
        <div class="benefit-item">
          <font-awesome-icon icon="check-circle" class="benefit-icon" />
          <span>Community features to share and learn from others</span>
        </div>
      </div>
    </div>
    <p class="hero-subtitle">Get Addicted To Good Practices!</p>


    <div class="cta-section">
      <router-link to="/bingo" class="start-button"> 
        <span class="button-content">
          <span class="button-text">Start Trading Now</span>
          <span class="button-border"></span>
        </span>
      </router-link>
      <p class="cta-subtext">Join traders who are transforming their trading journey with RascaroBingo</p>
    </div>
  </div>
</template>

<script>
import '@/assets/styles/HomePage.css';

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

<style>
@import '@/assets/styles/HomePage.css';
</style>
