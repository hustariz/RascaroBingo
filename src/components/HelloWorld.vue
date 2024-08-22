<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <p>
      Rascarobingo is a web application designed to help you manage your emotion and risk management during your trading session, <br> by providing a playful & stimulant frame!
    </p>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  props: {
    msg: String
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
</style>
