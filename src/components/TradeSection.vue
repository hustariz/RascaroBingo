<template>
    <div class="section-container">
      <div class="section-header">
        <h2>Trade's Section</h2>
      </div>
      <div class="section-content">
        <!-- Trade's Idea Subsection -->
        <div class="trade-subsection">
          <h3>Trade's Idea</h3>
          <textarea
            v-model="tradeIdea"
            placeholder="Enter your trade ideas here..."
            rows="4"
            class="trade-idea-input"
          ></textarea>
        </div>
  
        <!-- Trade's Details Subsection -->
        <div class="trade-subsection">
          <h3>Trade's Details</h3>
          <div class="price-inputs">
            <div class="price-input-group">
              <label class="price-label">Stoploss:</label>
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
              <label class="price-label">Entry:</label>
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
              <label class="price-label">Target:</label>
              <div class="input-with-prefix">
                <span class="prefix">$</span>
                <input
                  type="number"
                  v-model="target"
                  step="1"
                  placeholder="0"
                >
              </div>
            </div>
            <button class="save-button" @click="saveTrade">Save</button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import '../assets/styles/TradeSection.css';
  
  export default {
    name: 'TradeSection',
    data() {
      return {
        tradeIdea: '',
        stoploss: null,
        entry: null,
        target: null
      }
    },
    methods: {
      saveTrade() {
        console.log('💾 Saving trade:', {
          stoploss: this.stoploss,
          entry: this.entry,
          target: this.target,
          idea: this.tradeIdea
        });
      }
    }
  }
  </script>