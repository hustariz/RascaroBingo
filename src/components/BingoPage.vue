<template>
  <div class="rascaro-bingo">
    <h1>RascaroBingo V1.0</h1>

    <!-- Risk Management Section -->
    <div class="risk-management">
      <h2>Risk Management</h2>
      <div>
        <span>Trade's streak: </span>
      </div>
      <div>
        <span>Number of SL taken: </span>
      </div>
      <div>
        <h2>Trade's idea:</h2>
      </div>
    </div>


    <!-- Bingo Section -->
    <div class="bingo-section">
      <h2>Here we cooking da Bingo</h2>
    </div>
        <!-- Risk/Reward Section -->
        <div class="risk-reward">
      <h2>Points Bingo: Risk/Reward</h2>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomePage',
  data() {
    return {
      welcomeMessage: 'Welcome to the BingoPage'
    }
  }
}
</script>

<style scoped>
.rascaro-bingo {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.risk-management, .risk-reward, .bingo-section {
  margin-bottom: 20px;
}

.bingo-case {
  margin-bottom: 10px;
}
</style>