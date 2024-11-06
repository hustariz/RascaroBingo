<template>

  <div class="page-container">
    <!-- Import the sidebar component -->
    <RiskManagementSidebar 
      @save-settings="handleSaveSettings"
      @sidebar-toggle="handleSidebarToggle"
    />
    <div class="main-content" :class="{ 'expanded': isSidebarCollapsed }">
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
  </div>
</template>

<script>
import RiskManagementSidebar from '@/components/RiskManagementSidebar.vue'
  export default {
    name: 'BingoPage',
    components: {
      RiskManagementSidebar
    },
    data() {
      return {
        isSidebarCollapsed: false
      }
    },
    methods: {
      handleSaveSettings(settings) {
        console.log('Settings saved:', settings);
        // Handle the saved settings here
      },
      handleSidebarToggle(isCollapsed) {
      this.isSidebarCollapsed = isCollapsed;
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
  padding: 60px 20px 20px 20px;
}

.main-content {
  flex-grow: 1;
  padding: 20px;
  transition: margin-left 0.3s ease; 
}

.main-content.expanded {
  margin-left: 40px; 
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

/* Add these new styles for the trade idea section */
.trade-idea {
  width: 80%;
  margin: 0 auto;
  margin-bottom: 20px;
}

.trade-idea-input {
  width: 100%;
  min-width: 300px;
  max-width: 600px;
  padding: 12px;
  border: 1px solid rgb(238, 175, 17);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: 4px;
  font-family: inherit;
  resize: vertical;
  margin-top: 10px;
}

.trade-idea-input:focus {
  outline: none;
  border-color: rgb(238, 175, 17);
  box-shadow: 0 0 5px rgba(238, 175, 17, 0.3);
}

.trade-idea-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}
</style>