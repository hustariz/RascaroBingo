<template>
  <div class="home-page">
    <h1>{{ welcomeMessage }}</h1>
    <p>
      Rascarobingo is a web application designed to help you manage your emotion and risk management during your trading session, <br> by providing a playful & stimulant frame !
    </p>
    <div class="logo-container">
      <router-link to="/bingo"> 
        <img alt="Kakul logo" class="kakul-img" src="../assets/Mini_Kakul_Transp.png">
        <span class="tooltip">Start Here</span>
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
