<template>
    <div class="trade-idea-container">
      <div class="trade-idea-content">
        <h3>Trade's Idea</h3>
        
        <div class="textarea-container">
          <textarea
            v-model="tradeIdea"
            placeholder="Enter your trade ideas here..."
            class="trade-idea-input"
          ></textarea>
        </div>
        
        <div class="buttons-container">
          <button class="chart-button" @click="checkChart">
            <span class="chart-icon">📈</span>
            Check Chart
          </button>
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
        tradeIdea: ''
      }
    },
    methods: {
      checkChart() {
        console.log('📈 Checking chart');
      }
    }
  }
  </script>