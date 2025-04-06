<template>
  <div class="trade-details-widget grid-item trade-details" :class="{ resizing: isResizing }">
    <!-- Simple fixed layout structure -->
    <div class="tradedetails-content" :class="{ 'long-mode': isLong }">
      <!-- Header with Long/Short Toggle and R:R -->
      <div class="tradedetails-header">
        <div class="tradedetails-type-toggle">
          <button 
            class="tradedetails-toggle-button"
            :class="{ 'active long': isLong }"
            @click="isLong = true"
          >
            Long
          </button>
          <button 
            class="tradedetails-toggle-button"
            :class="{ 'active short': !isLong }"
            @click="isLong = false"
          >
            Short
          </button>
        </div>
        <div class="tradedetails-rr-display">
          <span>R/R: {{ currentRR }}</span>
        </div>
      </div>

      <!-- Simple 3-field layout -->
      <div class="tradedetails-fields">
        <!-- Labels row -->
        <div class="tradedetails-labels-row">
          <div class="tradedetails-label">Stoploss:</div>
          <div class="tradedetails-label">Entry:</div>
          <div class="tradedetails-label-with-tooltip">
            <div>Target:</div>
            <TargetTooltip 
              @enable="enableTargetEdit"
              @disable="disableTargetEdit"
            />
          </div>
        </div>
        
        <!-- Inputs row -->
        <div class="tradedetails-inputs-row">
          <div class="tradedetails-input-wrapper">
            <span class="tradedetails-input-prefix">$</span>
            <input
              class="tradedetails-input"
              type="number"
              v-model="stoploss"
              step="0.0001"
              min="0"
              placeholder="0.00"
              @input="calculateTarget"
            >
          </div>
          <div class="tradedetails-input-wrapper">
            <span class="tradedetails-input-prefix">$</span>
            <input
              class="tradedetails-input"
              type="number"
              v-model="entry"
              step="0.0001"
              min="0"
              placeholder="0.00"
              @input="calculateTarget"
            >
          </div>
          <div class="tradedetails-input-wrapper">
            <span class="tradedetails-input-prefix">$</span>
            <input
              class="tradedetails-input"
              :class="{ 'editable': isTargetEditable }"
              type="number"
              v-model="target"
              step="0.0001"
              min="0"
              placeholder="0.00"
              :readonly="!isTargetEditable"
            >
          </div>
        </div>
      </div>

      <!-- Action Buttons at bottom -->
      <div class="tradedetails-buttons">
        <button 
          class="tradedetails-save-button"
          :class="{ 'long': isLong, 'short': !isLong }"
          @click="saveTrade"
          :disabled="!validateTrade()"
        >
          {{ isLong ? 'Long' : 'Short' }}
        </button>
        <button 
          class="tradedetails-history-button"
          :class="{ 'long': isLong, 'short': !isLong }"
          @click="$emit('open-trade-history')"
        >
          <span class="tradedetails-history-icon">📊</span>
          Trade History
          <TradeCountBubble />
        </button>
      </div>
    </div>
    <div class="vue-resizable-handle"></div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { mapState } from 'vuex';
import TargetTooltip from '../little_components/TargetTooltip.vue';
import TradeCountBubble from '@/components/little_components/TradeCountBubble.vue';

export default defineComponent({
  name: 'TradeDetailsWidget',
  components: { 
    TargetTooltip,
    TradeCountBubble
  },
  emits: ['open-trade-history', 'trade-saved'],
  props: {
    score: {
      type: Number,
      required: true,
      default: 0
    }
  },
  data() {
    return {
      stoploss: '',
      entry: '',
      target: '',
      previousTarget: '',
      trades: [],
      isLong: false,
      isResizing: false,
      isTargetEditable: false,
      pair: 'BTCUSDT', // Default trading pair
      baseRR: 1 // Base R:R ratio
    }
  },
  computed: {
    ...mapState('riskManagement', [
      'accountSize',
      'baseTradeSize',
      'tradeStreak',
      'slTaken'
    ]),
    
    // Calculate R:R based on bingo score
    targetRR() {
      // 0-5 points: No risk/reward
      // 6-10 points: 2R/R
      // 11-15 points: 3R/R
      // 16-19 points: 4R/R
      // 20+ points: 5R/R (Hidden Bingo)
      if (this.score >= 20) return 5;
      if (this.score >= 16) return 4;
      if (this.score >= 11) return 3;
      if (this.score >= 6) return 2;
      return this.baseRR;
    },

    currentRR() {
      if (!this.stoploss || !this.entry || !this.target) {
        return '0.00';
      }

      const sl = parseFloat(this.stoploss);
      const ep = parseFloat(this.entry);
      const tp = parseFloat(this.target);

      if (isNaN(sl) || isNaN(ep) || isNaN(tp)) {
        return '0.00';
      }

      if (this.isLong) {
        if (ep <= sl || tp <= ep) {
          return '0.00';
        }

        const risk = ep - sl;
        const reward = tp - ep;

        if (risk === 0) {
          return '0.00';
        }

        return (reward / risk).toFixed(2);
      } else {
        if (ep >= sl || tp >= ep) { 
          return '0.00';
        }

        const risk = sl - ep; 
        const reward = ep - tp; 

        if (risk === 0) {
          return '0.00';
        }

        return (reward / risk).toFixed(2);
      }
    }
  },
  watch: {
    stoploss: {
      handler() {
        this.calculateTarget();
      },
      immediate: true
    },
    entry: {
      handler() {
        this.calculateTarget();
      },
      immediate: true
    },
    isLong: {
      handler() {
        this.calculateTarget();
      },
      immediate: true
    },
    score: {
      handler() {
        this.calculateTarget();
      },
      immediate: true
    },
    targetRR: {
      handler() {
        this.calculateTarget();
      },
      immediate: true
    }
  },
  methods: {
    calculateTarget() {
      if (!this.stoploss || !this.entry) {
        this.target = '';
        return;
      }

      const sl = parseFloat(this.stoploss);
      const ep = parseFloat(this.entry);

      if (isNaN(sl) || isNaN(ep)) {
        this.target = '';
        return;
      }

      // Only auto-calculate if target is not being manually edited
      if (!this.isTargetEditable) {
        if (this.isLong) {
          if (ep <= sl) {
            this.target = '';
            return;
          }
          
          const risk = ep - sl;
          const reward = risk * this.targetRR;
          this.target = (ep + reward).toFixed(4);
        } else {
          if (ep >= sl) {
            this.target = '';
            return;
          }
          
          const risk = sl - ep;
          const reward = risk * this.targetRR;
          this.target = (ep - reward).toFixed(4);
        }
      }
    },
    
    saveTrade() {
      if (!this.validateTrade()) {
        return;
      }

      const trade = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        pair: this.pair,
        type: this.isLong ? 'LONG' : 'SHORT',
        entry: parseFloat(this.entry),
        stoploss: parseFloat(this.stoploss),
        target: parseFloat(this.target),
        rr: parseFloat(this.currentRR),
        score: this.score,
        status: 'OPEN',
        accountSize: this.accountSize,
        baseTradeSize: this.baseTradeSize,
        tradeStreak: this.tradeStreak,
        slTaken: this.slTaken
      };

      // Add trade to local storage
      const existingTrades = JSON.parse(localStorage.getItem('trades') || '[]');
      const updatedTrades = [...existingTrades, trade];
      localStorage.setItem('trades', JSON.stringify(updatedTrades));

      // Update local trades array
      this.trades = updatedTrades;

      // Reset form
      this.stoploss = '';
      this.entry = '';
      this.target = '';
      this.isTargetEditable = false;

      // Emit event to parent
      this.$emit('trade-saved', trade);
    },
    
    validateTrade() {
      if (!this.stoploss || !this.entry || !this.target) {
        return false;
      }

      const sl = parseFloat(this.stoploss);
      const ep = parseFloat(this.entry);
      const tp = parseFloat(this.target);

      if (isNaN(sl) || isNaN(ep) || isNaN(tp)) {
        return false;
      }

      if (this.isLong) {
        return ep > sl && tp > ep;
      } else {
        return ep < sl && tp < ep;
      }
    },
    
    enableTargetEdit() {
      this.previousTarget = this.target;
      this.isTargetEditable = true;
    },
    
    disableTargetEdit() {
      this.isTargetEditable = false;
      this.calculateTarget();
    }
  }
});
</script>

<style scoped>
@import '@/assets/styles/widgets/TradeDetailsWidget.css';

/* Simple fixed layout styles */
.tradedetails-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1rem;
  gap: 0.75rem;
}

.tradedetails-header {
  margin-bottom: 0.5rem;
}

.tradedetails-fields {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tradedetails-labels-row {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

.tradedetails-label, 
.tradedetails-label-with-tooltip {
  flex: 1;
  font-weight: bold;
  color: rgb(238, 175, 17);
  font-size: 0.9rem;
}

.tradedetails-label-with-tooltip {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.tradedetails-inputs-row {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

.tradedetails-input-wrapper {
  flex: 1;
  position: relative;
}

.tradedetails-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 0.75rem; /* Reduced from auto to a fixed value */
  padding-top: 0.5rem; /* Reduced padding */
}

.tradedetails-save-button,
.tradedetails-history-button {
  flex: 1;
  min-height: 35px;
  padding: 0.25rem 0.5rem;
}
</style>
