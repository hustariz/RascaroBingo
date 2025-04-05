<template>
  <div class="trade-idea-widget">
    <div class="tradeidea-section-content">
      <div class="tradeidea-textarea-wrapper">
        <textarea
          v-model="tradeIdea"
          class="tradeidea-textarea"
          placeholder="Enter your trade ideas here..."
          @input="handleTradeIdeaUpdate"
        ></textarea>
        <PremiumLock 
          v-if="!isPremium"
          :show="showPremiumLock" 
          :message="premiumMessage"
          @upgradePremium="handleUpgradePremium"
        />
      </div>
      <div class="tradeidea-controls">
        <input
          v-model="symbol"
          class="tradeidea-symbol-input"
          placeholder="Enter trading pair (e.g BTCUSD)"
          type="text"
          @input="handleSymbolUpdate"
        >
        <button class="tradeidea-chart-button" @click="checkChart">
          <span class="tradeidea-chart-icon">📈</span>
          Check Chart
        </button>
      </div>
    </div>

    <!-- TradingView Chart Modal -->
    <div v-if="showChart" class="tradeidea-chart-modal" ref="chartModal">
      <div class="tradeidea-chart-container">
        <div class="drag-handle" @mousedown="startDragging">
          <button class="tradeidea-close-button" @click="closeChart">×</button>
        </div>
        <div id="tradingview_widget"></div>
        <div class="resize-handle resize-handle-se" @mousedown="startResizing"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import PremiumLock from '@/components/little_components/PremiumLock.vue';

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
      chartPosition: { x: 100, y: 100 },
      chartSize: { width: 800, height: 600 },
      isDragging: false,
      isResizing: false,
      showPremiumLock: false,
      premiumMessage: '',
      widget: null,
      scriptLoaded: false,
      dragOffset: { x: 0, y: 0 },
      initialSize: { width: 0, height: 0 },
      initialPos: { x: 0, y: 0 }
    };
  },
  mounted() {
    this.loadTradingViewScript();
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    const savedSymbol = localStorage.getItem('lastSymbol');
    this.symbol = savedSymbol || 'BTCUSD';
    this.$emit('update:symbol', this.symbol);
  },
  beforeUnmount() {
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
  },
  methods: {
    handleTradeIdeaUpdate() {
      this.$emit('update:tradeIdea', this.tradeIdea);
    },
    handleSymbolUpdate() {
      this.symbol = this.symbol.toUpperCase();
      localStorage.setItem('lastSymbol', this.symbol);
      this.$emit('update:symbol', this.symbol);
      if (this.widget) {
        this.widget.setSymbol(this.symbol);
      }
      if (this.showChart) {
        this.initTradingViewWidget();
      }
    },
    loadTradingViewScript() {
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
    checkChart() {
      if (!this.symbol) {
        alert('Please enter a trading pair first');
        return;
      }
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
      this.widget = null;
    },
    initTradingViewWidget() {
      if (typeof window.TradingView !== 'undefined') {
        console.log('🔄 Initializing TradingView widget');
        const defaultSymbol = this.symbol.trim() === '' ? 'BTCUSD' : this.symbol;

        this.widget = new window.TradingView.widget({
          container_id: "tradingview_widget",
          autosize: true,
          symbol: defaultSymbol,
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
    },
    startDragging(e) {
      if (e.target.classList.contains('tradeidea-close-button')) return;
      
      this.isDragging = true;
      const rect = this.$refs.chartModal.getBoundingClientRect();
      
      const currentLeft = parseInt(this.$refs.chartModal.style.left) || rect.left;
      const currentTop = parseInt(this.$refs.chartModal.style.top) || rect.top;
      
      this.dragOffset = {
        x: e.clientX - currentLeft,
        y: e.clientY - currentTop
      };
    },
    startResizing(e) {
      this.isResizing = true;
      const rect = this.$refs.chartModal.getBoundingClientRect();
      this.initialSize = {
        width: rect.width,
        height: rect.height
      };
      this.initialPos = {
        x: e.clientX,
        y: e.clientY
      };
    },
    onMouseMove(e) {
      if (this.isDragging) {
        const x = e.clientX - this.dragOffset.x;
        const y = e.clientY - this.dragOffset.y;
        this.$refs.chartModal.style.left = `${x}px`;
        this.$refs.chartModal.style.top = `${y}px`;
      } else if (this.isResizing) {
        const dx = e.clientX - this.initialPos.x;
        const dy = e.clientY - this.initialPos.y;
        const newWidth = this.initialSize.width + dx;
        const newHeight = this.initialSize.height + dy;
        this.$refs.chartModal.style.width = `${newWidth}px`;
        this.$refs.chartModal.style.height = `${newHeight}px`;
      }
    },
    onMouseUp() {
      this.isDragging = false;
      this.isResizing = false;
    },
    handleUpgradePremium() {
      this.$emit('upgrade-premium');
    }
  }
});
</script>

<style>
@import '@/assets/styles/widgets/TradeIdeaWidget.css';
</style>
