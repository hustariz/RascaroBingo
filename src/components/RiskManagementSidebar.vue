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
          <div class="input-with-prefix">
            <span class="prefix">$</span>
            <input 
              type="number" 
              v-model.number="localAccountSize"
              @change="updateAccountSize"
              placeholder="Enter account size"
              class="risk-input"
            />
          </div>
        </div>
        <div class="setting-item">
          <label>Trade Size:</label>
          <div class="input-with-prefix">
            <span class="prefix">$</span>
            <input 
              type="number" 
              v-model.number="localTradeSize"
              @change="updateTradeSize"
              placeholder="Enter trade size"
              class="risk-input"
            />
          </div>
          <span class="percentage-display">
            ({{ calculatePercentage }}% of account)
          </span>
        </div>
        <h2>Risk Limits</h2>
        <div class="setting-item">
          <label>Trade's Streak:</label>
          <div class="streak-slider-container">
            <div class="streak-info">
              <span class="streak-value" :style="{ color: streakColor }">{{ streakLabel }}</span>
            </div>
            <input 
              type="range" 
              :value="tradeStreak"
              min="-2" 
              max="2" 
              step="1"
              class="streak-slider"
              disabled
            />
          </div>
        </div>
        <div class="setting-item">
          <label>Number of Stoploss Taken:</label>
          <div class="streak-slider-container">
            <div class="streak-info">
              <span class="streak-value" :style="{ color: slColor }" v-html="slLabel"></span>
            </div>
            <input 
              type="range" 
              :value="slTaken"
              min="0" 
              max="3" 
              step="1"
              class="streak-slider"
              disabled
            />
          </div>
        </div>
      </div>

      <div class="settings-group">
        <h2>Daily Stats</h2>
        <div class="setting-item">
          <label>Daily Net P/L:</label>
          <span class="net-value" :class="{
            'positive': dailyNet > 0,
            'negative': dailyNet < 0
          }">
            ${{ (dailyNet || 0).toLocaleString() }}
          </span>
        </div>
        <div class="setting-item">
          <label>Trades Today:</label>
          <span class="trades-count">{{ dailyStats?.dailyTradeCount || 0 }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import '../assets/styles/RiskManagementSidebar.css';
import { mapState } from 'vuex';

export default {
  name: 'RiskManagementSidebar',
  data() {
    return {
      isCollapsed: false,
      localAccountSize: 10000,
      localTradeSize: 1000,
    }
  },
  computed: {
    ...mapState('riskManagement', [
      'accountSize',
      'baseTradeSize',
      'adjustedTradeSize',
      'tradeStreak',
      'slTaken',
      'dailyStats',
    ]),

    dailyNet() {
    const profit = this.dailyStats?.dailyProfit || 0;
    const loss = this.dailyStats?.dailyLoss || 0;
    return profit - loss;
  },
    
    calculatePercentage() {
      return ((this.localTradeSize / this.localAccountSize) * 100).toFixed(1);
    },

    streakLabel() {
      const labels = {
        '-2': `Cold streak (${(this.calculatePercentage * 0.33).toFixed(1)}%)`,
        '-1': `Malus streak (${(this.calculatePercentage * 0.5).toFixed(1)}%)`,
        '0': `Normal trade (${this.calculatePercentage}%)`,
        '1': `Bonus streak (${(this.calculatePercentage * 1.5).toFixed(1)}%)`,
        '2': `HOT streak (${(this.calculatePercentage * 2).toFixed(1)}%)`
      };
      return labels[this.tradeStreak] || labels['0'];
    },

    streakColor() {
      const colors = {
        '-2': '#0066cc',
        '-1': '#66b3ff',
        '0': '#FFFFFF',
        '1': '#ffb366',
        '2': '#f57c00'
      };
      return colors[this.tradeStreak] || colors['0'];
    },

    slLabel() {
      const labels = {
        '0': 'No SL taken',
        '1': '1 SL taken',
        '2': '2 SL taken',
        '3': '3 SL taken <br> Session ended'
      };
      return labels[this.slTaken] || labels['0'];
    },

    slColor() {
      const colors = {
        '0': '#4CAF50',
        '1': '#FFC107',
        '2': '#FF9800',
        '3': '#f44336'
      };
      return colors[this.slTaken] || colors['0'];
    }
  },
  
  methods: {
    toggleSidebar() {
      this.isCollapsed = !this.isCollapsed;
      this.$emit('sidebar-toggle', this.isCollapsed);
    },

    async updateAccountSize() {
      try {
        await this.$store.dispatch('riskManagement/updateSettings', {
          accountSize: this.localAccountSize,
          baseTradeSize: this.localTradeSize
        });
        console.log('Account size updated:', this.localAccountSize);
      } catch (error) {
        console.error('Error updating account size:', error);
      }
    },
    
    async updateTradeSize() {
      try {
        await this.$store.dispatch('riskManagement/updateSettings', {
          accountSize: this.localAccountSize,
          baseTradeSize: this.localTradeSize
        });
        console.log('Trade size updated:', this.localTradeSize);
      } catch (error) {
        console.error('Error updating trade size:', error);
      }
    },

    updateFromTradeResult(result) {
      const { status, profitLoss } = result;
      this.$store.dispatch('riskManagement/updateAfterTrade', { status, profitLoss });
    }
  },
  
  watch: {
    accountSize: {
      handler(newVal) {
        if (newVal !== this.localAccountSize) {
          this.localAccountSize = newVal;
        }
      },
      immediate: true
    },
    baseTradeSize: {
      handler(newVal) {
        if (newVal !== this.localTradeSize) {
          this.localTradeSize = newVal;
        }
      },
      immediate: true
    }
  },
  
  async created() {
    try {
      await this.$store.dispatch('riskManagement/fetchRiskManagement');
    } catch (error) {
      console.error('Error initializing risk management:', error);
    }
  }
}
</script>

<style scoped>
.input-with-prefix {
  position: relative;
  display: flex;
  align-items: center;
  margin-top: 5px;
}

.prefix {
  position: absolute;
  left: 10px;
  color: rgba(238, 175, 17, 0.7);
}

.risk-input {
  width: 100%;
  padding: 8px 8px 8px 25px;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(238, 175, 17, 0.3);
  border-radius: 4px;
  color: white;
}

.risk-input:focus {
  border-color: rgb(238, 175, 17);
  outline: none;
}

.percentage-display {
  display: block;
  margin-top: 5px;
  color: rgba(238, 175, 17, 0.7);
  font-size: 0.9em;
}

.profit-value.positive {
  color: #4CAF50;
}

.loss-value.negative {
  color: #f44336;
}
</style>