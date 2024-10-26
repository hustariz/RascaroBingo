<template>

  <div class="page-container">
    <!-- Import the sidebar component -->
    <RiskManagementSidebar @save-settings="handleSaveSettings" />

    <!-- Main Content -->
    <div class="main-content">
      <div class="rascaro-bingo">
        <h2>RascaroBingo V1.0</h2>


          <div class="trade-idea">
            <h2>Trade's idea:</h2>
            <textarea 
              v-model="tradeIdea" 
              placeholder="Enter your trade ideas here..." 
              rows="4"
              class="trade-idea-input"
            ></textarea>
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