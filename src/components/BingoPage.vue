<template>

  <div class="page-container">
    <!-- Import the sidebar component -->
    <RiskManagementSidebar @save-settings="handleSaveSettings" />

    <!-- Main Content -->
    <div class="main-content">
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
    </div>
  </div>
</template>

<script>
import RiskManagementSidebar from '@/components/RiskManagementSidebar.vue'
  export default {
    name: 'BingoPage',
    components: {
      RiskManagementSidebar
    },
    methods: {
      handleSaveSettings(settings) {
        console.log('Settings saved:', settings);
        // Handle the saved settings here
      }
    }
  }
  </script>

<style scoped>
.page-container {
  display: flex;
  min-height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 20px 20px 20px; /* Top Right Bottom Left */
}

.main-content {
  flex-grow: 1;
  padding: 20px;
}

.rascaro-bingo {
  max-width: 1200px;
  margin: 0 auto;
}

.risk-management, .risk-reward, .bingo-section {
  margin-bottom: 20px;
}

.bingo-case {
  margin-bottom: 10px;
}
</style>