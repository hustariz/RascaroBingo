<template>
  <div class="page-container">
    <RiskManagementSidebar 
      @save-settings="handleSaveSettings"
      @sidebar-toggle="handleSidebarToggle"
    />
    <div class="main-content" :class="{ 'expanded': isSidebarCollapsed }">
      <div class="rascaro-bingo">
        <h2>RascaroBingo V1.0</h2>
        
        <!-- Trade's Idea Section -->
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
          <div class="rr-checkboxes">
            <label class="rr-checkbox">
              <input type="checkbox" v-model="rrChecks.threeToTen">
              <span class="checkbox-text">3/10 : 2R/R</span>
            </label>
            <label class="rr-checkbox">
              <input type="checkbox" v-model="rrChecks.fiveToTen">
              <span class="checkbox-text">5/10 : 3R/R</span>
            </label>
            <label class="rr-checkbox">
              <input type="checkbox" v-model="rrChecks.sevenToTen">
              <span class="checkbox-text">7/10 : 4R/R</span>
            </label>
          </div>
        </div>

        <!-- Trade Details Section -->
        <div class="trade-details">
          <div class="price-inputs">
            <div class="price-input-group">
              <label class="price-label">Stoploss:</label>
              <div class="input-with-prefix">
                <span class="prefix">$</span>
                <input 
                  type="number" 
                  v-model="stoploss" 
                  step="0.01" 
                  placeholder="0.00"
                >
              </div>
            </div>
            <div class="price-input-group">
              <label class="price-label">Entry:</label>
              <div class="input-with-prefix">
                <span class="prefix">$</span>
                <input 
                  type="number" 
                  v-model="entry" 
                  step="0.01" 
                  placeholder="0.00"
                >
              </div>
            </div>
            <div class="price-input-group">
              <label class="price-label">Target:</label>
              <div class="input-with-prefix">
                <span class="prefix">$</span>
                <input 
                  type="number" 
                  v-model="target" 
                  step="0.01" 
                  placeholder="0.00"
                >
              </div>
            </div>
            <button class="save-button" @click="saveTrade">Save</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import '../assets/styles/BingoPage.css';
import RiskManagementSidebar from '@/components/RiskManagementSidebar.vue'

export default {
  name: 'BingoPage',
  components: {
    RiskManagementSidebar
  },
  data() {
    return {
      isSidebarCollapsed: false,
      tradeIdea: '',
      stoploss: null,
      entry: null,
      target: null,
      rrChecks: {
        threeToTen: false,
        fiveToTen: false,
        sevenToTen: false
      }
    }
  },
  methods: {
    handleSaveSettings(settings) {
      console.log('Settings saved:', settings);
    },
    handleSidebarToggle(isCollapsed) {
      this.isSidebarCollapsed = isCollapsed;
    },
    saveTrade() {
      console.log('Trade details:', {
        stoploss: this.stoploss,
        entry: this.entry,
        target: this.target,
        idea: this.tradeIdea,
        riskRewardChecks: this.rrChecks
      });
    }
  }
}
</script>