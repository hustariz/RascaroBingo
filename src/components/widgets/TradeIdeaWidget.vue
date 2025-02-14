<template>
  <div class="trade-idea-widget">
    <div class="tradeidea-section-content">
      <div class="tradeidea-textarea-wrapper">
        <textarea
          v-model="tradeIdea"
          class="tradeidea-textarea"
          placeholder="Enter your trade idea here..."
          @input="$emit('update:tradeIdea', tradeIdea)"
        ></textarea>
      </div>
      <div class="tradeidea-controls">
        <input
          v-model="symbol"
          class="tradeidea-symbol-input"
          placeholder="Enter symbol (e.g., BTCUSDT)"
          @input="$emit('update:symbol', symbol)"
        />
        <button class="tradeidea-chart-button" @click="openChart">
          <i class="fas fa-chart-line tradeidea-chart-icon"></i>
          View Chart
        </button>
      </div>
      <div class="tradeidea-info" v-if="!isPremium">
        <PremiumLock />
      </div>
    </div>

    <div v-if="showChart" class="tradeidea-chart-modal">
      <div class="tradeidea-chart-container">
        <div class="drag-handle">
          <button class="tradeidea-close-button" @click="closeChart">&times;</button>
        </div>
        <div id="tradingview_widget"></div>
        <div class="resize-handle resize-handle-se"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import PremiumLock from '@/components/app/PremiumLock.vue';

export default defineComponent({
  name: 'TradeIdeaWidget',
  components: {
    PremiumLock
  },
  props: {
    isPremium: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      tradeIdea: '',
      symbol: '',
      showChart: false,
      tradingViewWidget: null
    };
  },
  methods: {
    openChart() {
      if (!this.symbol) {
        alert('Please enter a symbol first');
        return;
      }
      this.showChart = true;
      this.$nextTick(() => {
        this.initTradingViewWidget();
      });
    },
    closeChart() {
      this.showChart = false;
      if (this.tradingViewWidget) {
        this.tradingViewWidget = null;
      }
    },
    initTradingViewWidget() {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        /* global TradingView */
        this.tradingViewWidget = new TradingView.widget({
          symbol: this.symbol,
          width: '100%',
          height: '100%',
          container_id: 'tradingview_widget',
          theme: 'dark',
          style: '1',
          toolbar_bg: '#1e222d',
          enable_publishing: false,
          hide_top_toolbar: false,
          save_image: false,
          hideideas: true
        });
      };
      document.head.appendChild(script);
    }
  }
});
</script>

<style scoped>
@import '@/assets/styles/widgets/TradeIdeaWidget.css';
</style>
