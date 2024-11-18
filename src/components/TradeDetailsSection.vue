<template>
    <div class="trade-details-container">
      <div class="trade-details-content">
        <!-- Long/Short Toggle -->
        <div class="trade-type-toggle">
          <button 
            class="trade-toggle-button" 
            :class="{ active: isLong }"
            @click="isLong = true"
          >
            Long
          </button>
          <button 
            class="trade-toggle-button" 
            :class="{ active: !isLong }"
            @click="isLong = false"
          >
            Short
          </button>
        </div>
  
        <div class="price-inputs">
          <div class="price-input-group">
            <h4>Stoploss:</h4>
            <div class="input-with-prefix">
              <span class="prefix">$</span>
              <input
                type="number"
                v-model="stoploss"
                step="1"
                placeholder="0"
              >
            </div>
          </div>
          <div class="price-input-group">
            <h4>Entry:</h4>
            <div class="input-with-prefix">
              <span class="prefix">$</span>
              <input
                type="number"
                v-model="entry"
                step="1"
                placeholder="0"
              >
            </div>
          </div>
          <div class="price-input-group">
            <div class="label-with-tooltip">
              <h4>Target:</h4>
              <div class="tooltip-icon">
                <span>i</span>
                <div class="tooltip-content">
                  Target will be calculated following the Risk/Reward you have access from the number of points you scored in the Bingo!
                  <div class="tooltip-action">
                    <p>Would you like to manually set it?</p>
                    <div class="tooltip-buttons">
                      <button class="tooltip-btn check" @click.stop="enableTargetEdit">✓</button>
                      <button class="tooltip-btn cross" @click.stop="disableTargetEdit">✗</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="input-with-prefix">
              <span class="prefix">$</span>
              <input
                type="number"
                v-model="target"
                step="1"
                placeholder="0"
                :readonly="!isTargetEditable"
                :class="{ 'editable': isTargetEditable }"
              >
            </div>
          </div>
        </div>
        <div>
          <TradeHistorySection 
            v-if="showHistory"
            :is-visible="showHistory"
            :is-sidebar-collapsed="isSidebarCollapsed"
            @close="showHistory = false"
          />
        </div>
  
        <div class="buttons-container">
          <button 
            class="save-button" 
            :class="{ 'long': isLong, 'short': !isLong }"
            @click="saveTrade"
          >
            Save {{ isLong ? 'Long' : 'Short' }}
          </button>
          
          <button class="history-button" @click="checkTradeHistory">
            <span class="history-icon">📊</span>
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
    }
  },
  data() {
    return {
      stoploss: null,
      entry: null,
      target: null,
      isLong: true,
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
    
    async saveTrade() {  // Add async here
      if (!this.validateTrade()) return;

      const trade = {
        type: this.isLong ? 'Long' : 'Short',
        stoploss: Number(this.stoploss),
        entry: Number(this.entry),
        target: Number(this.target),
        riskReward: this.currentRR,
        tradeIdea: this.tradeIdea,
        timestamp: new Date().toISOString()
      };

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        await this.$store.dispatch('trades/saveTrade', { trade, token });
        console.log('💾 Saving trade:', trade);
        this.clearForm();
      } catch (error) {
        console.error('Error saving trade:', error);
        // Handle error (show error message to user)
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