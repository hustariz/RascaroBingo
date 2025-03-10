<template>
  <div class="trade-details-widget grid-item trade-details" :class="{ resizing: isResizing }">
    <div class="tradedetails-content" :class="{ 'long-mode': isLong }">
      <!-- Header with Long/Short Toggle and R:R -->
      <div class="tradedetails-header">
        <div class="header-left"></div>
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
          <div>R/R:</div>
          <div>{{ currentRR }}</div>
        </div>
      </div>

      <!-- Price Inputs -->
      <div class="tradedetails-price-inputs">
        <div class="tradedetails-input-group">
          <h4>Stoploss:</h4>
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
        </div>
        <div class="tradedetails-input-group">
          <h4>Entry:</h4>
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
        </div>
        <div class="tradedetails-input-group">
          <div class="tradedetails-label-tooltip">
            <h4>Target:</h4>
            <TargetTooltip 
              @enable="enableTargetEdit"
              @disable="disableTargetEdit"
            />
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

      <!-- Action Buttons -->
      <div class="tradedetails-actions">
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
  emits: ['open-trade-history'],
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
      if (this.isTargetEditable) return;
      
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

      // Calculate target based on R:R from score
      if (this.isLong) {
        if (ep <= sl) {
          this.target = '';
          return;
        }
        const risk = ep - sl;
        this.target = (ep + (risk * this.targetRR)).toFixed(4);
      } else {
        if (ep >= sl) { // For shorts, entry should be BELOW stoploss
          this.target = '';
          return;
        }
        const risk = sl - ep;
        const calculatedTarget = ep - (risk * this.targetRR);
        
        // If target would be negative, set to 0
        this.target = calculatedTarget <= 0 ? '0.00' : calculatedTarget.toFixed(4);
      }
    },

    async saveTrade() {
      if (!this.validateTrade()) {
        console.error('❌ Trade validation failed');
        return;
      }

      const trade = {
        isLong: this.isLong,
        entryPrice: parseFloat(this.entry),
        stopLoss: parseFloat(this.stoploss),
        takeProfit: parseFloat(this.target),
        size: this.baseTradeSize,
        rr: parseFloat(this.currentRR),
        timestamp: new Date().toISOString(),
        pair: this.pair
      };

      console.log('📝 Saving trade:', trade);
      console.log('🔑 Auth token:', localStorage.getItem('token'));

      try {
        // Save trade to store
        await this.$store.dispatch('trades/saveTrade', trade);
        console.log('✅ Trade saved successfully');
        
        // Update risk management stats
        this.$store.dispatch('riskManagement/updateFromTradeResult', {
          type: this.isLong ? 'LONG' : 'SHORT',
          entry: trade.entryPrice,
          size: trade.size,
          rr: trade.rr
        });

        // Clear form after successful save
        this.stoploss = '';
        this.entry = '';
        this.target = '';
        this.isTargetEditable = false;
      } catch (error) {
        console.error('❌ Failed to save trade:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data
        });
      }
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
      this.isTargetEditable = true;
      this.previousTarget = this.target;
    },
    disableTargetEdit() {
      this.isTargetEditable = false;
      this.calculateTarget();
    }
  }
});
</script>

<style scoped>
@import '@/assets/styles/widgets/common.css';
@import '@/assets/styles/widgets/TradeDetailsWidget.css';

</style>
