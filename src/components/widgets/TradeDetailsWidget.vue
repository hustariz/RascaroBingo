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
          <span>R/R:{{ currentRR }}</span>
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
              placeholder="0.00"
              @input="calculateTarget"
            >
          </div>
        </div>
        <div class="tradedetails-input-group">
          <div class="tradedetails-label-tooltip">
            <h4>Target:</h4>
            <div class="tradedetails-tooltip-icon">
              <span>i</span>
              <div class="tradedetails-tooltip-content">
                <div class="tooltip-content">
                  Would you like to manually set it? 
                  <span class="tooltip-button" @click.stop="enableTargetEdit">✓</span>
                  <span class="tooltip-button" @click.stop="disableTargetEdit">✗</span>
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

      <!-- Action Buttons -->
      <div class="tradedetails-actions">
        <button 
          class="tradedetails-save-button"
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
        </button>
      </div>
    </div>
    <div class="vue-resizable-handle"></div>
  </div>
</template>

<script>
import '@/assets/styles/widgets/TradeDetailsWidget.css';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'TradeDetailsWidget',
  emits: ['open-trade-history'],
  data() {
    return {
      stoploss: '',
      entry: '',
      target: '',
      isTargetEditable: false,
      previousTarget: '',
      trades: [],
      isLong: false,
      isResizing: false
    }
  },
  computed: {
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
    openTradesCount() {
      return this.trades.length;
    }
  },
  watch: {
    stoploss: {
      handler: 'calculateTarget',
      immediate: true
    },
    entry: {
      handler: 'calculateTarget',
      immediate: true
    },
    isLong: {
      handler: 'calculateTarget',
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

      let targetPrice;
      const rr = 2; // Default R:R ratio

      if (this.isLong) {
        if (ep <= sl) {
          this.target = '';
          return;
        }
        const risk = ep - sl;
        targetPrice = ep + (risk * rr);
      } else {
        if (ep >= sl) {
          this.target = '';
          return;
        }
        const risk = sl - ep;
        targetPrice = ep - (risk * rr);
      }

      this.target = targetPrice.toFixed(4);
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
      if (!this.validateTrade()) return;

      const trade = {
        id: Date.now(),
        type: this.isLong ? 'LONG' : 'SHORT',
        stoploss: parseFloat(this.stoploss),
        entry: parseFloat(this.entry),
        target: parseFloat(this.target),
        rr: this.calculateActualRR(),
        timestamp: new Date().toISOString()
      };

      this.trades.push(trade);
      this.$emit('trade-saved', trade);
      this.clearForm();
    },
    clearForm() {
      this.stoploss = '';
      this.entry = '';
      this.target = '';
      this.isTargetEditable = false;
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

<style>
</style>
