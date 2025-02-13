<template>
  <div class="trade-details-widget">
    <div class="tradedetails-content" :class="{ 'long-mode': isLong }">
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
            <div class="tradedetails-tooltip-icon"
                 @mouseenter="showTargetTooltip"
                 @mouseleave="hideTargetTooltip"
                 @mousemove="updateTooltipPosition">
              <i class="fas fa-info-circle"></i>
              <div class="tradedetails-tooltip" v-show="tooltipVisible" :style="tooltipStyle">
                Target price is automatically calculated based on your R/R level.
                <br>
                Click to edit manually.
              </div>
            </div>
          </div>
          <div class="tradedetails-input-wrapper">
            <span class="tradedetails-input-prefix">$</span>
            <input
              class="tradedetails-input"
              type="number"
              v-model="target"
              :readonly="!targetEditable"
              @click="enableTargetEdit"
              @blur="disableTargetEdit"
              step="1"
              placeholder="0"
            >
          </div>
        </div>
      </div>

      <div class="tradedetails-rr-display">
        <h3>Current R/R: {{ currentRR }}</h3>
      </div>

      <div class="tradedetails-actions">
        <button 
          class="tradedetails-save-button"
          @click="saveTrade"
          :disabled="!validateTrade()"
        >
          Save Trade
        </button>
        <button 
          class="tradedetails-clear-button"
          @click="clearForm"
        >
          Clear
        </button>
      </div>
    </div>

    <TradeHistorySection 
      :trades="trades"
      @check-trade="checkTradeHistory"
    />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import TradeHistorySection from '@/components/app/TradeHistorySection.vue';

export default defineComponent({
  name: 'TradeDetailsWidget',
  components: {
    TradeHistorySection
  },
  props: {
    rrChecks: {
      type: Object,
      default() {
        return {
          sixPoints: false,
          elevenPoints: false,
          sixteenPoints: false,
          twentyPoints: false
        }
      }
    },
    tradeIdea: {
      type: String,
      default: ''
    },
    score: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      isLong: true,
      stoploss: '',
      entry: '',
      target: '',
      targetEditable: false,
      trades: [],
      tooltipVisible: false,
      tooltipX: 0,
      tooltipY: 0
    }
  },
  computed: {
    openTradesCount() {
      return this.trades.length;
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
    },
    tooltipStyle() {
      return {
        left: `${this.tooltipX}px`,
        top: `${this.tooltipY}px`
      }
    }
  },
  watch: {
    stoploss: {
      handler: 'calculateTarget',
      immediate: true
    },
    entry: {
      handler() {
        if (!this.targetEditable) {
          this.calculateTarget();
        }
      },
      immediate: true
    },
    target: {
      handler() {
        if (!this.targetEditable) {
          this.calculateTarget();
        }
      },
      immediate: true
    },
    isLong: {
      handler: 'calculateTarget',
      immediate: true
    }
  },
  methods: {
    calculateTarget() {
      if (this.targetEditable) return;

      const sl = parseFloat(this.stoploss);
      const ep = parseFloat(this.entry);

      if (isNaN(sl) || isNaN(ep)) {
        this.target = '';
        return;
      }

      let targetRR = 2; // Default R/R

      if (this.rrChecks.twentyPoints) {
        targetRR = 5;
      } else if (this.rrChecks.sixteenPoints) {
        targetRR = 4;
      } else if (this.rrChecks.elevenPoints) {
        targetRR = 3;
      } else if (this.rrChecks.sixPoints) {
        targetRR = 2;
      }

      if (this.isLong) {
        if (ep <= sl) {
          this.target = '';
          return;
        }
        const risk = ep - sl;
        this.target = (ep + (risk * targetRR)).toString();
      } else {
        if (ep >= sl) {
          this.target = '';
          return;
        }
        const risk = sl - ep;
        this.target = (ep - (risk * targetRR)).toString();
      }
    },
    calculateActualRR() {
      if (!this.stoploss || !this.entry || !this.target) {
        return 0;
      }

      const sl = parseFloat(this.stoploss);
      const ep = parseFloat(this.entry);
      const tp = parseFloat(this.target);

      if (isNaN(sl) || isNaN(ep) || isNaN(tp)) {
        return 0;
      }

      if (this.isLong) {
        if (ep <= sl || tp <= ep) {
          return 0;
        }

        const risk = ep - sl;
        const reward = tp - ep;

        if (risk === 0) {
          return 0;
        }

        return reward / risk;
      } else {
        if (ep >= sl || tp >= ep) {
          return 0;
        }

        const risk = sl - ep;
        const reward = ep - tp;

        if (risk === 0) {
          return 0;
        }

        return reward / risk;
      }
    },
    saveTrade() {
      if (!this.validateTrade()) {
        return;
      }

      const trade = {
        id: Date.now(),
        type: this.isLong ? 'Long' : 'Short',
        stoploss: parseFloat(this.stoploss),
        entry: parseFloat(this.entry),
        target: parseFloat(this.target),
        rr: this.calculateActualRR(),
        score: this.score,
        idea: this.tradeIdea,
        date: new Date().toISOString(),
        status: 'open'
      };

      // Add trade to history
      this.trades.unshift(trade);

      // Save to localStorage
      this.saveToLocalStorage();

      // Clear form
      this.clearForm();

      // Emit event
      this.$emit('trade-saved', trade);
    },
    clearForm() {
      this.stoploss = '';
      this.entry = '';
      this.target = '';
      this.targetEditable = false;
    },
    validateTrade() {
      const sl = parseFloat(this.stoploss);
      const ep = parseFloat(this.entry);
      const tp = parseFloat(this.target);

      if (isNaN(sl) || isNaN(ep) || isNaN(tp)) {
        return false;
      }

      if (this.isLong) {
        // For long positions
        if (ep <= sl) return false; // Entry must be above stoploss
        if (tp <= ep) return false; // Target must be above entry
      } else {
        // For short positions
        if (ep >= sl) return false; // Entry must be below stoploss
        if (tp >= ep) return false; // Target must be below entry
      }

      // Check if R:R is at least the minimum required based on score
      const currentRR = this.calculateActualRR();
      
      if (this.rrChecks.twentyPoints && currentRR < 5) return false;
      if (this.rrChecks.sixteenPoints && currentRR < 4) return false;
      if (this.rrChecks.elevenPoints && currentRR < 3) return false;
      if (this.rrChecks.sixPoints && currentRR < 2) return false;

      return true;
    },
    checkTradeHistory() {
      this.$emit('check-trade-history');
    },
    enableTargetEdit() {
      this.targetEditable = true;
    },
    disableTargetEdit() {
      this.targetEditable = false;
      this.calculateTarget();
    },
    showTargetTooltip(event) {
      this.tooltipVisible = true;
      this.updateTooltipPosition(event);
    },
    hideTargetTooltip() {
      this.tooltipVisible = false;
    },
    updateTooltipPosition(event) {
      if (this.tooltipVisible) {
        this.tooltipX = event.clientX;
        this.tooltipY = event.clientY;
      }
    }
  }
});
</script>

<style scoped>
.trade-details-widget {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
}

.tradedetails-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.tradedetails-type-toggle {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.tradedetails-toggle-button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  background-color: #f0f0f0;
  cursor: pointer;
}

.tradedetails-toggle-button.active {
  background-color: #007bff;
  color: #ffffff;
}

.tradedetails-price-inputs {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}

.tradedetails-input-group {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.tradedetails-input-group h4 {
  margin-right: 10px;
}

.tradedetails-input-wrapper {
  display: flex;
  align-items: center;
}

.tradedetails-input-prefix {
  margin-right: 5px;
}

.tradedetails-input {
  padding: 10px;
  border: none;
  border-radius: 4px;
  width: 100%;
}

.tradedetails-rr-display {
  margin-bottom: 20px;
}

.tradedetails-rr-display h3 {
  margin-bottom: 10px;
}

.tradedetails-actions {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.tradedetails-save-button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: #ffffff;
  cursor: pointer;
}

.tradedetails-clear-button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  background-color: #f0f0f0;
  cursor: pointer;
}

.tradedetails-tooltip-icon {
  position: relative;
  cursor: pointer;
}

.tradedetails-tooltip {
  position: absolute;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 4px;
  z-index: 1;
}

.tradedetails-tooltip::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 100%;
  transform: translateY(-50%);
  border-top: 10px solid transparent;
  border-left: 10px solid #f0f0f0;
  border-bottom: 10px solid transparent;
}

.long-mode {
  background-color: #f0f0f0;
}
</style>
