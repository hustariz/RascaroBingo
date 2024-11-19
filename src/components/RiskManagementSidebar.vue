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
              v-model="localTradeStreak" 
              min="-2" 
              max="2" 
              step="1"
              class="streak-slider"
              disabled
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
              v-model="localSlTaken" 
              min="0" 
              max="3" 
              step="1"
              class="streak-slider"
              disabled
            />
          </div>
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
      localTradeStreak: 0,
      localSlTaken: 0
    }
  },
  computed: {
    ...mapState('riskManagement', {
      accountSize: state => state.accountSize,
      tradeStreak: state => state.tradeStreak,
      slTaken: state => state.slTaken
    }),
    tradeSize() {
      const percentages = {
        '-2': 3.3,
        '-1': 5,
        '0': 10,
        '1': 15,
        '2': 20
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
        '-2': '#0066cc',
        '-1': '#66b3ff',
        '0': '#FFFFFF',
        '1': '#ffb366',
        '2': '#f57c00'
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
        '0': '#4CAF50',
        '1': '#FFC107',
        '2': '#FF9800',
        '3': '#f44336'
      };
      return colors[this.slTaken];
    }
  },
  watch: {
    tradeStreak(newValue) {
      this.localTradeStreak = newValue;
    },
    slTaken(newValue) {
      this.localSlTaken = newValue;
    }
  },
  methods: {
    toggleSidebar() {
      this.isCollapsed = !this.isCollapsed;
      this.$emit('sidebar-toggle', this.isCollapsed);
    }
  },
  async created() {
    // Initialize risk management data when component is created
    await this.$store.dispatch('riskManagement/fetchRiskManagement');
  }
}
</script>