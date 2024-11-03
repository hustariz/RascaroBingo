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
        <label>Number of Stoploss Taken:</label>
        <div class="streak-slider-container">
          <div class="streak-info">
            <span class="streak-value" :style="{ color: slColor }" v-html="slLabel"></span>
          </div>
          <input 
            type="range" 
            v-model="slTaken" 
            min="0" 
            max="3" 
            step="1"
            class="streak-slider"
          />
          <div class="streak-labels">
            <span>0</span>
            <span>1</span>
            <span>2</span>
            <span>3</span>
          </div>
        </div>
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
      slTaken: 0,
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
        '-2': '#0066cc', // Dark blue
      '-1': '#66b3ff', // Light blue
      '0': '#FFFFFF', // wh
      '1': '#ffb366', // Light orange
      '2': '#f57c00' // Red
      };
      return colors[this.tradeStreak];
    },
    slLabel() {
      const labels = {
        '0': 'No SL taken',
        '1': '1 SL taken',
        '2': '2 SL taken',
        '3': '3 SL taken <br> Session ended'
      };
      return labels[this.slTaken];
    },
    slColor() {
      const colors = {
        '0': '#4CAF50', // Green
        '1': '#FFC107', // Yellow
        '2': '#FF9800', // Orange
        '3': '#f44336'  // Red
      };
      return colors[this.slTaken];
    }
  }
  ,
  methods: {
    saveSettings() {
      this.$emit('save-settings', {
        accountSize: this.accountSize,
        tradeStreak: this.tradeStreak,
        slTaken: this.slTaken,
        maxDailyLoss: this.maxDailyLoss,
        maxTradesPerDay: this.maxTradesPerDay
      });
    }
  }
}
</script>

<style scoped>
.sidebar {
  width: 270px;
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
.streak-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  padding: 0 8px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.streak-labels span {
  position: relative;
  text-align: center;
}


.streak-value {
  transition: color 0.3s ease;
}
</style>