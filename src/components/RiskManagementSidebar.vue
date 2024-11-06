<template>
  <div class="sidebar" :class="{ 'collapsed': isCollapsed }">
    <button class="toggle-button" @click="toggleSidebar">
      {{ isCollapsed ? '>' : '<' }}
    </button>
    <div class="sidebar-content" v-show="!isCollapsed">
      <h2>Risk Settings</h2>
      <div class="settings-group">
        <div class="setting-item">
          <label>Account Size:</label>
          <span class="account-size-value">{{ formatAccountSize }}</span>
        </div>
        <div class="setting-item">
          <label>Trade Size:</label>
          <span class="trade-size-value">{{ formatTradeSize }}</span>
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
          </div>
        </div>
      </div>
    </div>
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
      maxTradesPerDay: 3,
      isCollapsed: false
    }
  },
  computed: {
    tradeSize() {
      const percentages = {
        '-2': 3.3, // Cold streak
        '-1': 5,   // Malus streak
        '0': 10,   // Normal trade
        '1': 15,   // Bonus streak
        '2': 20    // HOT streak
      };
      const percentage = percentages[this.tradeStreak] || 10;
      return Math.round((this.accountSize * percentage) / 100);
    },
    formatTradeSize() {
      return `$${this.tradeSize.toLocaleString()}`;
    },
    formatAccountSize() {
      return `$${this.accountSize.toLocaleString()}`;
    },
    streakLabel() {
      const labels = {
        '-2': `Cold streak (3.3%)`,
        '-1': `Malus streak (5%)`,
        '0': `Normal trade (10%)`,
        '1': `Bonus streak (15%)`,
        '2': `HOT streak (20%)`
      };
      return labels[this.tradeStreak];
    },
    streakColor() {
      const colors = {
        '-2': '#0066cc', // Dark blue
        '-1': '#66b3ff', // Light blue
        '0': '#FFFFFF',  // White
        '1': '#ffb366',  // Light orange
        '2': '#f57c00'   // Orange
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
  },
  methods: {
    toggleSidebar() {
      this.isCollapsed = !this.isCollapsed;
      this.$emit('sidebar-toggle', this.isCollapsed);
    },
    saveSettings() {
      this.$emit('save-settings', {
        accountSize: this.accountSize,
        tradeStreak: this.tradeStreak,
        tradeSize: this.tradeSize,
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
  padding: 80px 20px 20px 20px;
  color: white;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  overflow: visible;
  transition: all 0.3s ease;
  z-index: 100;
}

.sidebar.collapsed {
  width: 40px;
  padding: 80px 0 20px 0;
}

.toggle-button {
  position: absolute;
  right: -30px; /* Increased to make room for larger button */
  top: 90px;
  width: 30px; /* Increased width */
  height: 50px; /* Increased height */
  background-color: rgba(0, 0, 0, 0.9); /* Darker background */
  border: 2px solid rgb(238, 175, 17); /* Golden border */
  border-left: none; /* Remove left border to blend with sidebar */
  border-radius: 0 8px 8px 0; /* Smoother corners */
  color: rgb(238, 175, 17); /* Golden text color */
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px; /* Larger font */
  z-index: 1000;
  transition: all 0.3s ease;
  box-shadow: 2px 2px 5px rgb(238, 175, 17); /* Subtle shadow */
}

.toggle-button:hover {
  background-color: rgba(238, 175, 17, 0.1); /* Subtle golden highlight */
  width: 35px; /* Slightly wider on hover */
  right: -35px; /* Adjust position for wider width */
  box-shadow: 3px 3px 8px rgb(238, 175, 17); /* Enhanced shadow on hover */
}

/* Optional: Add a subtle glow effect on hover */
.toggle-button:hover::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 0 8px 8px 0;
  box-shadow: 0 0 15px rgb(238, 175, 17);
  pointer-events: none;
}

.sidebar-content {
  height: calc(100vh - 100px);
  overflow-y: auto;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.settings-group {
  margin-bottom: 20px;
}

.setting-item {
  margin-bottom: 15px;
}

.setting-item label {
  display: block;
  margin-bottom: 5px;
  color: #ffffff;
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

.account-size-value,
.trade-size-value {
  color: rgb(238, 175, 17);
  font-weight: bold;
  margin-left: 8px;
  font-size: 1.1rem;
}

h2 {
  font-family: 'Legendarie', sans-serif;
  color: rgb(238, 175, 17);
  margin-bottom: 20px;
}
</style>