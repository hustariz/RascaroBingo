<!-- src/components/RiskManagementSidebar.vue -->
<template>
  <div class="sidebar">
    <h2>Risk Settings</h2>
    <div class="settings-group">
      <div class="setting-item">
        <label>Account Size:</label>
        <input type="number" v-model="accountSize"/>
      </div>
      <div class="setting-item">
        <label>Trade's Streak:</label>
        <div class="streak-slider-container">
          <div class="streak-info">
            <span class="streak-value" :style="{ color: streakColor }">{{ streakLabel }}</span>
          </div>
          <input 
            type="range" 
            v-model="tradeStreak" 
            min="-2" 
            max="2" 
            step="1"
            class="streak-slider"
          />
        </div>
      </div>
    </div>
    
    <div class="settings-group">
      <h2>Risk Limits</h2>
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
      tradeStreak: 0,
      maxDailyLoss: 500,
      maxTradesPerDay: 3
    }
  },
  computed: {
    streakLabel() {
      const labels = {
        '-2': 'Cold streak (3.3%)',
        '-1': 'Malus streak (5%)',
        '0': 'Normal trade (10%)',
        '1': 'Bonus streak (15%)',
        '2': 'HOT streak (20%)'
      };
      return labels[this.tradeStreak];
    },
    streakColor() {
      const colors = {
        '-2': '#ff4444',
        '-1': '#ff8844',
        '0': 'rgb(238, 175, 17)',
        '1': '#44ff44',
        '2': '#00ff00'
      };
      return colors[this.tradeStreak];
    }
  },
  methods: {
    saveSettings() {
      this.$emit('save-settings', {
        accountSize: this.accountSize,
        tradeStreak: this.tradeStreak,
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

.setting-item input[type="number"] {
  width: 100%;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 4px;
}

.streak-info {
  text-align: center;
  margin-bottom: 10px;
}

.streak-value {
  font-size: 1.2rem;
  font-weight: bold;
  transition: color 0.3s ease;
}

.streak-slider-container {
  position: relative;
  padding: 10px 0;
  margin: 10px 0;
}

.streak-slider {
  -webkit-appearance: none;
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
  border-radius: 2px;
}

.streak-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: rgb(238, 175, 17);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.streak-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: rgb(238, 175, 17);
  border-radius: 50%;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.streak-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  background: rgb(255, 190, 25);
}

.streak-slider::-moz-range-thumb:hover {
  transform: scale(1.2);
  background: rgb(255, 190, 25);
}

.streak-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  padding: 0 8px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
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