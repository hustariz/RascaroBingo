<template>
  <div class="home-page">
    <h1>{{ welcomeMessage }}</h1><br>
    <p>
      Rascarobingo is a <strong>trading application</strong> with a bingo-style scoring system and <strong>risk management</strong> features.<br>
       It is designed to help you manage your <strong>emotions</strong>  by providing a <strong>playful & stimulant frame</strong>,<br>
        while also providing <strong>stats</strong> of your trading sessions.
         
    </p>
    <!--
      <div class="bg-blue-500 text-white p-4">
        Hello Tailwind CSS in Vue!
      </div>
      <h1 class="text-3xl font-bold underline">
        Hello world!
      </h1>
      Testing Tailwind
    --> 
    <!--
      <div class="logo-container">
        <router-link to="/bingo"> 
          <img alt="Kakul logo" class="kakul-img" src="../assets/images/Mini_Kakul_Transp.png">
          <span class="tooltip">Start Here</span>
        </router-link>
    </div>
    -->
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
