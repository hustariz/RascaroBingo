<template>
    <div class="trade-section-container">
      <div class="trade-content">
        <div class="trade-horizontal-layout">
          <!-- Left Side: Trade's Idea -->
          <div class="trade-idea-section">
            <h3>Trade's Idea</h3>
            <textarea
              v-model="tradeIdea"
              placeholder="Enter your trade ideas here..."
              class="trade-idea-input"
            ></textarea>
          </div>
  
          <!-- Right Side: Trade's Details -->
          <div class="trade-details-section">
            <h3>Trade's Details</h3>
            
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
  
            <button 
              class="save-button" 
              :class="{ 'long': isLong, 'short': !isLong }"
              @click="saveTrade"
            >
              Save {{ isLong ? 'Long' : 'Short' }}
            </button>
  
            <div class="buttons-container">
              <button class="history-button" @click="checkTradeHistory">
                <span class="history-icon">📊</span>
                Trade History
              </button>
              <button class="chart-button" @click="checkChart">
                <span class="chart-icon">📈</span>
                Check Chart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>

  <script>
  import '../assets/styles/TradeSection.css'
  
  export default {
    name: 'TradeSection',
    data() {
      return {
        tradeIdea: '',
        stoploss: null,
        entry: null,
        target: null,
        isLong: true,
        isTargetEditable: false 
      }
    },
    methods: {
      saveTrade() {
        console.log('💾 Saving trade:', {
          type: this.isLong ? 'Long' : 'Short',
          stoploss: this.stoploss,
          entry: this.entry,
          target: this.target,
          idea: this.tradeIdea
        });
      },
      checkTradeHistory() {
        console.log('📊 Checking trade history');
      },
      checkChart() {
        console.log('📈 Checking chart');
      },
      enableTargetEdit() {
        this.isTargetEditable = true;
        console.log('Target input enabled');
      },
      disableTargetEdit() {
        this.isTargetEditable = false;
        console.log('Target input disabled');
      }
    }
  }
  </script>