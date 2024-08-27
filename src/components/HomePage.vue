<template>
  <div class="hello">
    <h1>{{ welcomeMessage }}</h1>
    <p>
      Rascarobingo is a web application designed to help you manage your emotion and risk management during your trading session, <br> by providing a playful & stimulant frame !
    </p>
    <img alt="Kakul logo" src="../assets/Mini_Kakul_Transp.png">
  </div>
</template>

<script>
export default {
  name: 'HomePage',
  data() {
    return {
      welcomeMessage: 'Welcome to RascaroBingo'
    }
  }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #ff0000;
}
.hello {
  margin-top: 60px; /* This matches the navbar height */
}
</style>
