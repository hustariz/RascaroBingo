<template>
  <div class="tradeidea-section-container">
    <div class="tradeidea-section-content">
      <div class="tradeidea-textarea-wrapper">
        <textarea
          v-model="tradeIdea"
          placeholder="Enter your trade ideas here..."
          class="tradeidea-section-input"
          @input="emitTradeIdea"
        ></textarea>
      </div>
      <button class="tradeidea-chart-button" @click="checkChart">
        <span class="tradeidea-chart-icon">📈</span>
        Check Chart
      </button>
    </div>
    
    <!-- TradingView Chart Modal -->
    <div v-if="showChart" class="tradeidea-chart-modal">
      <div class="tradeidea-chart-container">
        <button class="tradeidea-close-button" @click="closeChart">×</button>
        <div id="tradingview_widget"></div>
      </div>
    </div>
  </div>
</template>

<script>
import '../assets/styles/TradeIdeaSection.css'

export default {
  name: 'TradeIdeaSection',
  data() {
    return {
      tradeIdea: '',
      showChart: false,
      widget: null,
      scriptLoaded: false
    }
  },
  mounted() {
    // Load TradingView script
    if (!document.getElementById('tradingview-script')) {
      const script = document.createElement('script');
      script.id = 'tradingview-script';
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        console.log('📊 TradingView script loaded');
        this.scriptLoaded = true;
        if (this.showChart) {
          this.initTradingViewWidget();
        }
      };
      document.body.appendChild(script);
    }
  },
  methods: {
    emitTradeIdea() {
      this.$emit('trade-idea-update', this.tradeIdea);
    },
    checkChart() {
      console.log('📈 Opening chart');
      this.showChart = true;
      this.$nextTick(() => {
        if (this.scriptLoaded) {
          this.initTradingViewWidget();
        }
      });
    },
    closeChart() {
      console.log('📉 Closing chart');
      this.showChart = false;
      if (this.widget) {
        // Clean up widget if necessary
        this.widget = null;
      }
    },
    initTradingViewWidget() {
      if (typeof TradingView !== 'undefined') {
        console.log('🔄 Initializing TradingView widget');
        this.widget = new window.TradingView.widget({
          container_id: "tradingview_widget",
          autosize: true,
          symbol: "BTCUSD",
          interval: "D",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#1e222d",
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          height: "100%",
          width: "100%",
          studies: ["RSI@tv-basicstudies", "MASimple@tv-basicstudies"],
          save_image: true,
          hideideas: true
        });
      } else {
        console.error('❌ TradingView script not loaded');
      }
    }
  }
}
</script>

<style scoped>
.tradeidea-chart-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 50%;
  height: 60%;
  margin: auto;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.tradeidea-chart-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: #1e222d;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid rgba(238, 175, 17, 0.4);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

.tradeidea-close-button {
  position: absolute;
  right: 10px;
  top: 10px;
  background: none;
  border: none;
  color: rgb(238, 175, 17);
  font-size: 24px;
  cursor: pointer;
  z-index: 1001;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.tradeidea-close-button:hover {
  background: rgba(238, 175, 17, 0.1);
  transform: scale(1.1);
}

#tradingview_widget {
  width: 100%;
  height: 100%;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .tradeidea-chart-container {
    width: 95%;
    height: 70%;
    padding: 15px;
  }
}
</style>