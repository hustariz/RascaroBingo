<!-- src/components/RiskManagementSidebar.vue -->
<template>
    <div class="sidebar">
      <h2>Risk Settings</h2>
      <div class="settings-group">
        <h3>Account Settings</h3>
        <div class="setting-item">
          <label>Account Size:</label>
          <input type="number" v-model="accountSize"/>
        </div>
        <div class="setting-item">
          <label>Risk per Trade (%):</label>
          <input type="number" v-model="riskPercentage" step="0.1" min="0" max="100" />
        </div>
      </div>
      
      <div class="settings-group">
        <h3>Risk Limits</h3>
        <div class="setting-item">
          <label>Max Daily Loss:</label>
          <input type="number" v-model="maxDailyLoss" />
        </div>
        <div class="setting-item">
          <label>Max Trades/Day:</label>
          <input type="number" v-model="maxTradesPerDay" />
        </div>
      </div>
      <button class="save-settings" @click="saveSettings">Save Settings</button>
    </div>
  </template>
  
  <script>
  export default {
    name: 'RiskManagementSidebar',
    data() {
      return {
        accountSize: 10000,
        riskPercentage: 1,
        maxDailyLoss: 500,
        maxTradesPerDay: 3
      }
    },
    methods: {
      saveSettings() {
        // Emit event to parent component
        this.$emit('save-settings', {
          accountSize: this.accountSize,
          riskPercentage: this.riskPercentage,
          maxDailyLoss: this.maxDailyLoss,
          maxTradesPerDay: this.maxTradesPerDay
        });
      }
    }
  }
  </script>
  
  <style scoped>
.sidebar {
  width: 250px;
  background-color: rgba(0, 0, 0, 0.8);
  padding: 80px 20px 20px 20px; /* Top Right Bottom Left */
  color: white;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  height: 100vh; /* Full viewport height */
  position: fixed; /* Keep sidebar fixed while scrolling */
  left: 0;
  top: 0;
  overflow-y: auto; /* Add scrollbar if content is too long */
}
  
  .settings-group {
    margin-bottom: 20px;
  }
  
  .settings-group h3 {
    font-family: 'Legendarie', sans-serif;
    color: rgb(238, 175, 17);
    margin-bottom: 10px;
  }
  
  .setting-item {
    margin-bottom: 15px;
  }
  
  .setting-item label {
    display: block;
    margin-bottom: 5px;
    color: #ffffff;
  }
  
  .setting-item input {
    width: 100%;
    padding: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
    border-radius: 4px;
  }
  
  .save-settings {
    width: 100%;
    padding: 10px;
    background-color: rgb(238, 175, 17);
    border: none;
    border-radius: 4px;
    color: white;
    cursor: pointer;
    font-family: 'Legendarie', sans-serif;
    font-size: 1.1rem;
  }
  
  .save-settings:hover {
    background-color: rgb(255, 190, 25);
  }
  
  h2 {
    font-family: 'Legendarie', sans-serif;
    color: rgb(238, 175, 17);
    margin-bottom: 20px;
  }
  </style>
  