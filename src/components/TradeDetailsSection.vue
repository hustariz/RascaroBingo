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
      showHistory: false
    }
  },
  computed: {
    currentRR() {
      if (this.rrChecks.twentyPoints) return 5;    // Hidden Bingo (≥20 points)
      if (this.rrChecks.sixteenPoints) return 4;   // ≥16 points
      if (this.rrChecks.elevenPoints) return 3;    // ≥11 points
      if (this.rrChecks.sixPoints) return 2;       // ≥6 points
      return 1; // default R/R
    }
  },
  watch: {
    stoploss: {
      handler: 'calculateTarget',
      immediate: true
    },
    tradeIdea: {
      handler(newIdea) {
        console.log('Trade idea received:', newIdea);
      },
      immediate: true
    },
    entry: {
      handler() {
        if (this.isTargetEditable) {
          this.calculateStoploss();
        } else {
          this.calculateTarget();
        }
      },
      immediate: true
    },
    target: {
      handler() {
        if (this.isTargetEditable) {
          this.calculateStoploss();
        }
      }
    },
    isLong: {
      handler: 'calculateTarget',
      immediate: true
    },
    currentRR: {
      handler: 'calculateTarget',
      immediate: true
    }
  },
  methods: {
    calculateTarget() {
      if (!this.entry || !this.stoploss || this.isTargetEditable) return;

      // For Short positions (isLong = false)
      if (!this.isLong) {
        // For shorts: risk is stoploss - entry (stoploss is above entry)
        const risk = Number(this.stoploss) - Number(this.entry);
        const reward = risk * this.currentRR;
        this.target = Number(this.entry) - reward;
      } 
      // For Long positions (isLong = true)
      else {
        // For longs: risk is entry - stoploss (stoploss is below entry)
        const risk = Number(this.entry) - Number(this.stoploss);
        const reward = risk * this.currentRR;
        this.target = Number(this.entry) + reward;
      }
    },
    
    // Add new method for reverse calculation
    calculateStoploss() {
      if (!this.entry || !this.target || !this.isTargetEditable) return;

      // For Short positions
      if (!this.isLong) {
        const reward = Number(this.entry) - Number(this.target);
        const risk = reward / this.currentRR;
        this.stoploss = Number(this.entry) + risk;
      }
      // For Long positions
      else {
        const reward = Number(this.target) - Number(this.entry);
        const risk = reward / this.currentRR;
        this.stoploss = Number(this.entry) - risk;
      }
    },
    
    async saveTrade() {
        if (!this.validateTrade()) return;

        // Get current trade size from risk management store
        const tradeSize = this.$store.state.riskManagement.adjustedTradeSize;
        
        // Calculate potential profit and loss
        let potentialProfit = 0;
        if (this.isLong) {
          const risk = Number(this.entry) - Number(this.stoploss);
          const reward = Number(this.target) - Number(this.entry);
          potentialProfit = reward * (tradeSize / risk);
        } else {
          const risk = Number(this.stoploss) - Number(this.entry);
          const reward = Number(this.entry) - Number(this.target);
          potentialProfit = reward * (tradeSize / risk);
        }

        const trade = {
          type: this.isLong ? 'Long' : 'Short',
          stoploss: Number(this.stoploss),
          entry: Number(this.entry),
          target: Number(this.target),
          riskReward: this.currentRR,
          tradeIdea: this.tradeIdea,
          timestamp: new Date().toISOString(),
          tradeSize,
          potentialProfit,
          potentialLoss: -tradeSize // Maximum loss is always the trade size
        };

        try {
          await this.$store.dispatch('trades/saveTrade', trade);
          console.log('💾 Saving trade:', trade);
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
      if (!this.stoploss || !this.entry || !this.target) {
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
        if (Number(this.entry) >= Number(this.stoploss)) { // Changed this condition
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