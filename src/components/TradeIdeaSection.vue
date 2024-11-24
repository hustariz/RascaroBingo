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
  </div>
</template>
  
  <script>
  import '../assets/styles/TradeIdeaSection.css'
  
  export default {
    name: 'TradeIdeaSection',
    data() {
      return {
        tradeIdea: ''
      }
    },
    methods: {
      emitTradeIdea() {
        this.$emit('trade-idea-update', this.tradeIdea);
      },
      checkChart() {
        console.log('📈 Checking chart');
      }
    }
  }
  </script>