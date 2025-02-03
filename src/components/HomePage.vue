<template>
  <div class="home-page">
    <div v-if="$route.query.error" class="error-box">
      <font-awesome-icon icon="exclamation-circle" class="error-icon" />
      {{ $route.query.error }}
    </div>

    <div class="hero-section">
      <h2 class="welcome-title">{{ welcomeMessage }}</h2>
      <p class="hero-subtitle">Transform Your Trading Journey with <br> Fun and Discipline</p>
    </div>

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

.hero-section {
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem;
  background: radial-gradient(circle at center, rgba(238, 175, 17, 0.2) 0%, transparent 70%);
  border-radius: 20px;
}

.welcome-title {
  font-family: 'Legendarie', sans-serif;
  color: rgb(238, 175, 17);
  font-size: 4rem;
  text-shadow: 
    3px 3px 0 rgba(0, 0, 0, 0.8),
    -3px -3px 0 rgba(0, 0, 0, 0.8),
    3px -3px 0 rgba(0, 0, 0, 0.8),
    -3px 3px 0 rgba(0, 0, 0, 0.8),
    0 0 20px rgba(238, 175, 17, 0.7);
  margin-bottom: 1.5rem;
  letter-spacing: 2px;
  transform: scale(1);
}

@keyframes titlePulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
  }
}

.hero-subtitle {
  color: rgb(238, 175, 17);
  font-size: 1.8rem;
  margin-top: 1.5rem;
  font-weight: 600;
  text-shadow: 
    2px 2px 0 rgba(0, 0, 0, 0.8),
    -2px -2px 0 rgba(0, 0, 0, 0.8),
    2px -2px 0 rgba(0, 0, 0, 0.8),
    -2px 2px 0 rgba(0, 0, 0, 0.8);
  letter-spacing: 1px;
  line-height: 1.4;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  width: 90%;
  margin: 0 auto 3rem;
}

.feature-card {
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid rgb(238, 175, 17);
  border-radius: 15px;
  padding: 2rem;
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 20px rgba(238, 175, 17, 0.3);
}

.feature-icon {
  font-size: 2.5rem;
  color: rgb(238, 175, 17);
  margin-bottom: 1rem;
}

.feature-card h3 {
  color: rgb(238, 175, 17);
  font-size: 1.4rem;
  margin-bottom: 1rem;
}

.feature-card p {
  color: white;
  font-size: 1rem;
  line-height: 1.5;
}

.section-title {
  color: rgb(238, 175, 17);
  font-size: 2rem;
  text-align: center;
  margin-bottom: 2rem;
}

.benefits-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: white;
  font-size: 1.1rem;
}

.benefit-icon {
  color: rgb(238, 175, 17);
  font-size: 1.3rem;
}

.cta-section {
  text-align: center;
  margin: 4rem 0;
}

.cta-subtext {
  color: white;
  margin-top: 1rem;
  font-size: 1.1rem;
  opacity: 0.8;
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

@media (max-width: 768px) {
  .features-grid {
    grid-template-columns: 1fr;
  }

  .benefits-list {
    grid-template-columns: 1fr;
  }

  .hero-subtitle {
    font-size: 1.1rem;
  }

  .feature-card {
    padding: 1.5rem;
  }
}
</style>
