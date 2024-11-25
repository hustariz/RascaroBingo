<template>
  <div class="home-page">
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
      welcomeMessage: 'Welcome to RascaroBingo'
    }
  }
}
</script>
