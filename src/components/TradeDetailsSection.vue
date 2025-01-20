<template>
  <div class="tradedetails-section-container" :class="{ 'long-mode': isLong }">
    <div class="tradedetails-content">
      <!-- Long/Short Toggle -->
      <div class="tradedetails-type-toggle">
        <button 
          class="tradedetails-toggle-button" 
          :class="{ active: isLong }"
          @click="isLong = true"
        >
          Long
        </button>
        <button 
          class="tradedetails-toggle-button" 
          :class="{ active: !isLong }"
          @click="isLong = false"
        >
          Short
        </button>
      </div>

      <div class="tradedetails-price-inputs">
        <div class="tradedetails-input-group">
          <h4>Stoploss:</h4>
          <div class="tradedetails-input-wrapper">
            <span class="tradedetails-input-prefix">$</span>
            <input
              class="tradedetails-input"
              type="number"
              v-model="stoploss"
              step="1"
              placeholder="0"
            >
          </div>
        </div>
        <div class="tradedetails-input-group">
          <h4>Entry:</h4>
          <div class="tradedetails-input-wrapper">
            <span class="tradedetails-input-prefix">$</span>
            <input
              class="tradedetails-input"
              type="number"
              v-model="entry"
              step="1"
              placeholder="0"
            >
          </div>
        </div>
        <div class="tradedetails-input-group">
          <div class="tradedetails-label-tooltip">
            <h4>Target:</h4>
            <div class="tradedetails-tooltip-icon">
              <span>i</span>
              <div class="tradedetails-tooltip-content">
                Target will be calculated following the Risk/Reward you have access from the number of points you scored in the Bingo!
                <div class="tradedetails-tooltip-action">
                  <p>Would you like to set it?</p>
                  <div class="tradedetails-tooltip-buttons">
                    <button class="tradedetails-tooltip-btn check" @click.stop="enableTargetEdit">✓</button>
                    <button class="tradedetails-tooltip-btn cross" @click.stop="disableTargetEdit">✗</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="tradedetails-input-wrapper">
            <span class="tradedetails-input-prefix">$</span>
            <input
              class="tradedetails-input"
              :class="{ 'editable': isTargetEditable }"
              type="number"
              v-model="target"
              step="1"
              placeholder="0"
              :readonly="!isTargetEditable"
            >
          </div>
        </div>
      </div>

      <!-- Trade History Section -->
      <TradeHistorySection 
        v-if="showHistory"
        :is-visible="showHistory"
        :is-sidebar-collapsed="isSidebarCollapsed"
        @close="showHistory = false"
      />

      <div class="tradedetails-buttons">
        <button 
          class="tradedetails-save-button" 
          :class="{ 'long': isLong, 'short': !isLong }"
          @click="saveTrade"
        >
          {{ isLong ? 'Long' : 'Short' }}
        </button>
        
        <button class="tradedetails-history-button" @click="checkTradeHistory">
          <span class="tradedetails-history-icon">📊</span>
          Trade History
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import '../assets/styles/TradeDetailsSection.css';
import TradeHistorySection from './TradeHistorySection.vue';
import { useAuth } from '@/composables/useAuth';

export default {
  name: 'TradeDetailsSection',
  setup() {
    const auth = useAuth();
    console.log('Auth state:', auth.isAuthenticated.value); // Debug log
    console.log('Token:', localStorage.getItem('token')); // Debug log
    return { auth };
  },
  components: {
    TradeHistorySection
  },
  props: {
    rrChecks: {
      type: Object,
      required: true,
      default: () => ({
        sixPoints: false,      // 2R/R
        elevenPoints: false,   // 3R/R
        sixteenPoints: false,  // 4R/R
        twentyPoints: false    // 5R/R (Hidden Bingo)
      })
    },
    tradeIdea: {
      type: String,
      default: ''
    },
    tradingSymbol: {
      type: String,
      default: ''
    },
    isSidebarCollapsed: {
    type: Boolean,
    default: false
  }
  },
  data() {
    return {
      stoploss: null,
      entry: null,
      target: null,
      isLong: false,
      isTargetEditable: false,
      showHistory: false,
      actualRR: 0
    }
  },
  computed: {
    currentRR() {
      // Log the current points and checks
      console.log('Current R/R checks:', {
        points: this.rrChecks,
        twentyPoints: this.rrChecks.twentyPoints,
        sixteenPoints: this.rrChecks.sixteenPoints,
        elevenPoints: this.rrChecks.elevenPoints,
        sixPoints: this.rrChecks.sixPoints
      });

      // Hidden Bingo (≥20 points) - 5R/R
      if (this.rrChecks.twentyPoints) {
        console.log('Using 5R/R (Hidden Bingo)');
        return 5;
      }
      
      // ≥16 points - 4R/R
      if (this.rrChecks.sixteenPoints) {
        console.log('Using 4R/R (16+ points)');
        return 4;
      }
      
      // ≥11 points - 3R/R
      if (this.rrChecks.elevenPoints) {
        console.log('Using 3R/R (11+ points)');
        return 3;
      }
      
      // ≥6 points - 2R/R
      if (this.rrChecks.sixPoints) {
        console.log('Using 2R/R (6+ points)');
        return 2;
      }

      // Default - 1R/R
      console.log('Using default 1R/R');
      return 1;
    }
  },
  watch: {
    stoploss: {
      handler: 'calculateTarget',
      immediate: true
    },
    entry: {
      handler() {
        if (this.entry && this.stoploss && !this.isTargetEditable) {
          this.calculateTarget();
        }
      },
      immediate: true
    },
    target: {
      handler() {
        // Only recalculate R/R when target changes, don't move stoploss
        if (this.entry && this.stoploss && this.target) {
          this.calculateActualRR();
        }
      }
    },
    isLong: {
      handler: 'calculateTarget',
      immediate: true
    }
  },
  methods: {
    calculateTarget() {
      if (!this.entry || !this.stoploss || this.isTargetEditable) return;

      // For Short positions (isLong = false)
      if (!this.isLong) {
        // Calculate risk (distance from entry to stoploss)
        const risk = Number(this.stoploss) - Number(this.entry);
        // Calculate reward based on R/R level from bingo
        const reward = risk * this.currentRR;
        // For shorts: target = entry - reward (target is below entry)
        this.target = Number(Math.max(0, (Number(this.entry) - reward)).toFixed(2));
      } 
      // For Long positions (isLong = true)
      else {
        // Calculate risk (distance from entry to stoploss)
        const risk = Number(this.entry) - Number(this.stoploss);
        // Calculate reward based on R/R level from bingo
        const reward = risk * this.currentRR;
        // For longs: target = entry + reward (target is above entry)
        this.target = Number((Number(this.entry) + reward).toFixed(2));
      }

      // Calculate actual R/R after setting target
      this.calculateActualRR();
    },

    calculateActualRR() {
      if (!this.entry || !this.stoploss || !this.target) return;

      let risk, reward;
      
      if (this.isLong) {
        risk = Math.abs(Number(this.entry) - Number(this.stoploss));
        reward = Math.abs(Number(this.target) - Number(this.entry));
      } else {
        risk = Math.abs(Number(this.stoploss) - Number(this.entry));
        reward = Math.abs(Number(this.entry) - Number(this.target));
      }

      this.actualRR = risk > 0 ? Number((reward / risk).toFixed(2)) : 0;

      console.log('Actual R/R calculation:', {
        isLong: this.isLong,
        entry: this.entry,
        stoploss: this.stoploss,
        target: this.target,
        risk,
        reward,
        actualRR: this.actualRR
      });
    },
    
    async saveTrade() {
      if (!this.validateTrade()) return;

      // Get current trade size from risk management store
      const tradeSize = this.$store.state.riskManagement.adjustedTradeSize;
      
      // Calculate potential profit and loss based on actual prices
      let potentialProfit = 0;
      let potentialLoss = 0;
      
      if (this.isLong) {
        const risk = Math.abs(Number(this.entry) - Number(this.stoploss));
        const reward = Math.abs(Number(this.target) - Number(this.entry));
        potentialProfit = reward * (tradeSize / risk);
        potentialLoss = -tradeSize;
      } else {
        const risk = Math.abs(Number(this.stoploss) - Number(this.entry));
        const reward = Math.abs(Number(this.entry) - Number(this.target));
        potentialProfit = reward * (tradeSize / risk);
        potentialLoss = -tradeSize;
      }

      const trade = {
        pair: this.tradingSymbol,
        isLong: this.isLong,
        entryPrice: Number(this.entry),
        stopLoss: Number(this.stoploss),
        takeProfit: Number(this.target),
        notes: this.tradeIdea || '',
        status: 'OPEN',
        potentialProfit,
        potentialLoss,
        riskRewardRatio: this.actualRR // Use actual calculated R/R instead of bingo R/R
      };

      try {
        await this.$store.dispatch('trades/saveTrade', trade);
        console.log(' Saving trade:', trade);
        
        // Refresh trade history after saving
        await this.$store.dispatch('trades/fetchTrades');
        
        this.clearForm();
      } catch (error) {
        console.error('Error saving trade:', error);
      }
    },
    clearForm() {
      this.stoploss = null;
      this.entry = null;
      this.target = null;
      this.isTargetEditable = false;
    },
    validateTrade() {
      // Check if values are null, undefined, or empty string
      if (this.stoploss === null || this.entry === null || this.target === null || 
          this.stoploss === undefined || this.entry === undefined || this.target === undefined || 
          this.stoploss === '' || this.entry === '' || this.target === '') {
        console.error('All fields must be filled');
        return false;
      }

      if (this.isLong) {
        // Validate Long position
        if (Number(this.entry) <= Number(this.stoploss)) {
          console.error('For Long positions, Entry must be higher than Stoploss');
          return false;
        }
        if (Number(this.target) <= Number(this.entry)) {
          console.error('For Long positions, Target must be higher than Entry');
          return false;
        }
      } else {
        // Validate Short position
        if (Number(this.entry) >= Number(this.stoploss)) {
          console.error('For Short positions, Entry must be lower than Stoploss');
          return false;
        }
        if (Number(this.target) >= Number(this.entry)) {
          console.error('For Short positions, Target must be lower than Entry');
          return false;
        }
      }
      return true;
    },
    checkTradeHistory() {
      this.showHistory = true;
    },
    enableTargetEdit() {
      this.isTargetEditable = true;
      console.log('Target input enabled');
    },
    disableTargetEdit() {
      this.isTargetEditable = false;
      this.calculateTarget(); // Recalculate target when disabling manual edit
      console.log('Target input disabled');
    }
  }
}
</script>