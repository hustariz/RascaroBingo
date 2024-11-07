<template>
  <div class="page-container">
    <RiskManagementSidebar 
      @save-settings="handleSaveSettings"
      @sidebar-toggle="handleSidebarToggle"
    />
    <div class="main-content" :class="{ 'expanded': isSidebarCollapsed }">
      <h2 class="page-title">RascaroBingo V1.0</h2>
      
      <div class="two-column-layout">
        <!-- Left Column: Trade Sections -->
        <div class="left-column">
          <!-- Trade's Idea Section -->
          <div class="section-container">
            <div class="section-header">
              <h2>Trade's Idea</h2>
            </div>
            <div class="section-content">
              <textarea 
                v-model="tradeIdea" 
                placeholder="Enter your trade ideas here..." 
                rows="4"
                class="trade-idea-input"
              ></textarea>
            </div>
          </div>

          <!-- Trade Details Section -->
          <div class="section-container">
            <div class="section-header">
              <h2>Trade's Details</h2>
            </div>
            <div class="section-content">
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

        <!-- Right Column: Bingo Sections -->
        <div class="right-column">
          <div class="section-container">
            <div class="section-header">
              <h2>Bingo Section</h2>
            </div>
            <div class="section-content">
              <!-- Bingo Grid -->
              <div class="bingo-grid">
                <div v-for="(number, index) in bingoNumbers" 
                     :key="index" 
                     :class="['bingo-cell', { 'selected': selectedNumbers.includes(number) }]"
                     @click="toggleNumber(number)">
                  {{ number }}
                </div>
              </div>

              <!-- Risk/Reward Section -->
              <div class="risk-reward-area">
                <h3>Points Bingo: Risk/Reward</h3>
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
            </div>
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
      },
      bingoNumbers: Array.from({ length: 25 }, (_, i) => i + 1),
      selectedNumbers: []
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
    },
    toggleNumber(number) {
      if (this.selectedNumbers.includes(number)) {
        this.selectedNumbers = this.selectedNumbers.filter(n => n !== number);
      } else {
        this.selectedNumbers.push(number);
      }
    }
  }
}
</script>
