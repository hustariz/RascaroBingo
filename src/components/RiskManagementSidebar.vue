<template>
  <div class="sidebar" :class="{ 'collapsed': isCollapsed }">
    <button class="toggle-button" @click="toggleSidebar">
      {{ isCollapsed ? '>' : '<' }}
    </button>
    <div class="sidebar-content" v-show="!isCollapsed">
      <h2>Asset's Management</h2>
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
        <h2>Risk's Management</h2>
        <div class="setting-item">
          <label>Trade's Streak:</label>
          <div class="streak-progress-container">
            <div class="streak-tube">
              <div class="streak-liquid" :style="{ width: fillWidth, background: streakColor }">
                <div class="bubble-effect"></div>
              </div>
            </div>
            <span class="streak-value" :style="{ color: streakColor }">{{ streakLabel }}</span>
          </div>
        </div>
        <div class="setting-item">
          <label>Number of Stoploss Taken:</label>
          <div class="streak-slider-container">
            <div class="streak-info">
              <div 
                class="risk-tooltip-container" 
                @mouseover="showTooltip = true"
                @mouseleave="showTooltip = false"
              >
                <span 
                  class="streak-value" 
                  :class="{ 'session-ended': slTaken === 3 }"
                  :style="{ color: slColor }" 
                  v-html="slLabel"
                ></span>
                
                <div class="risk-tooltip-bridge"></div>
                <div v-if="showTooltip && slTaken === 3" class="risk-tooltip">
                  <template v-if="!askingForGrass">
                    Session ended, come back later
                  </template>
                  <template v-else>
                    <div class="grass-question">
                      Did you touch some grass?
                      <div class="risk-tooltip-buttons">
                        <button class="risk-tooltip-button" @click="handleGrassResponse(true)">Yes</button>
                        <button class="risk-tooltip-button" @click="handleGrassResponse(false)">No</button>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </div>
            <!-- Replace input with sl-tube -->
            <div class="sl-tube">
              <div 
                class="sl-liquid" 
                :style="{ 
                  width: slFillWidth, 
                  background: slColor 
                }"
              >
                <div class="bubble-effect"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-group">
        <h2>Daily Stats</h2>
        <div class="setting-item">
          <label>Trades Today:</label>
          <span>{{ dailyStats?.trades || 0 }}</span>
        </div>
        <div class="setting-item wins-losses-row">
          <div class="stat-column">
            <label>Daily Wins:</label>
            <span class="win">{{ dailyStats?.wins || 0 }}</span>
          </div>
          <div class="stat-column">
            <label>Daily Losses:</label>
            <span class="loss">{{ dailyStats?.losses || 0 }}</span>
          </div>
        </div>
        <div class="setting-item">
          <label style="display: block; text-align: center; margin-bottom: 4px;">Daily Net P/L:</label>
          <div class="daily-pl">
            <span :class="{ 'profit': dailyNet > 0, 'loss': dailyNet < 0 }">
              ${{ Math.abs(dailyNet).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) }}
              <span class="pl-indicator">{{ dailyNet >= 0 ? '▲' : '▼' }}</span>
            </span>
          </div>
        </div>
        <button class="reset-button" @click="resetStats">
          <span>Reset Daily Stats</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import '../assets/styles/RiskManagementSidebar.css';
import { mapState } from 'vuex'

export default {
  name: 'RiskManagementSidebar',
  data() {
    return {
      isCollapsed: false,
      localAccountSize: 10000,
      localTradeSize: 1000,
      currentPercentage: 10,
      showTooltip: false,
      askingForGrass: false,
      tooltipTimer: null
    }
  },
  computed: {
    ...mapState('riskManagement', [
      'accountSize',
      'baseTradeSize',
      'currentPercentage',
      'tradeStreak',
      'slTaken',
      'dailyStats',
      'totalStats'
    ]),

    dailyNet() {
      if (!this.dailyStats) return 0;
      const profit = parseFloat(this.dailyStats.dailyProfit || 0);
      const loss = parseFloat(this.dailyStats.dailyLoss || 0);
      return profit - loss;
    },

    calculatePercentage() {
      const percentage = (this.localTradeSize / this.localAccountSize) * 100;
      return percentage.toFixed(2);
    },

    streakLabel() {
      const labels = {
        '-3': `Go touch some GRASS (${this.calculatePercentage}%)`,
        '-2': `Cold streak (${this.calculatePercentage}%)`,
        '-1': `Malus streak (${this.calculatePercentage}%)`,
        '0': `Normal trade (${this.calculatePercentage}%)`,
        '1': `Bonus streak (${this.calculatePercentage}%)`,
        '2': `HOT streak (${this.calculatePercentage}%)`,
        '3': `COOKING (${this.calculatePercentage}%)`
      };
      return labels[this.tradeStreak] || labels['0'];
    },

    streakColor() {
      const colors = {
        '-3': '#0033cc', // Deep Blue
        '-2': '#0066cc', // Blue
        '-1': '#66b3ff', // Light Blue
        '0': '#FFFFFF',  // White
        '1': '#ffb366',  // Light Orange
        '2': '#ff7f00',  // Orange
        '3': '#ff3300'   // Red-Orange
      };
      return colors[this.tradeStreak] || colors['0'];
    },

    fillWidth() {
      // Calculate fill width based on streak level (-3 to +3)
      const baseWidth = 50; // Center point (%)
      const increment = 16.67; // Width increment per level
      const level = parseInt(this.tradeStreak);
      return `${baseWidth + (level * increment)}%`;
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
    },

    slFillWidth() {
      return `${(this.slTaken / 3) * 100}%`;
    }
  },

  methods: {
    async handleGrassResponse(touched) {
      if (touched) {
        try {
          console.log('🌱 User touched grass, attempting to reset SL count');
          const token = localStorage.getItem('token');
          if (!token) throw new Error('No authentication token found');

          // Update backend
          const response = await fetch('http://localhost:3004/api/risk-management/reset', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) throw new Error('Failed to reset stoploss counter');
          
          const data = await response.json();
          console.log('✅ SL count reset successful:', data);

          // Update Vuex store
          this.$store.commit('riskManagement/SET_RISK_MANAGEMENT', {
            data: {
              ...this.$store.state.riskManagement,
              slTaken: 0
            }
          });

          this.showTooltip = false;
          this.askingForGrass = false;
        } catch (error) {
          console.error('❌ Error resetting SL count:', error);
        }
      } else {
        console.log('❌ User did not touch grass, keeping SL count');
        this.showTooltip = false;
        this.askingForGrass = false;
      }
    },
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
        // Update current percentage after account size change
        this.currentPercentage = Number(this.calculatePercentage);
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
        // Update current percentage after trade size change
        this.currentPercentage = Number(this.calculatePercentage);
      } catch (error) {
        console.error('Error updating trade size:', error);
      }
    },


    updateFromTradeResult(result) {
          const { status, profitLoss } = result;
          this.$store.dispatch('riskManagement/updateAfterTrade', { 
            status, 
            profitLoss,
            currentPercentage: this.currentPercentage
          });
        },
        async resetStats() {
          try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No authentication token found');

            const response = await fetch(`${process.env.VUE_APP_API_URL}/api/risk-management/reset-stats`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            });

            if (!response.ok) throw new Error('Failed to reset stats');
            
            const data = await response.json();

            // Update local state
            this.currentPercentage = 10;
            this.localTradeSize = Math.round(this.localAccountSize * 0.1);

            // Update Vuex store
            this.$store.commit('riskManagement/SET_RISK_MANAGEMENT', { data });
          } catch (error) {
            console.error('Error resetting stats:', error);
          }
        }
      },
  
    watch: {
      accountSize: {
        handler(newVal) {
          if (newVal && newVal !== this.localAccountSize) {
            this.localAccountSize = newVal;
          }
        },
        immediate: true
      },
      baseTradeSize: {
        handler(newVal) {
          if (newVal && newVal !== this.localTradeSize) {
            this.localTradeSize = newVal;
          }
        },
        immediate: true
      },
      showTooltip(newVal) {
        if (newVal && this.slTaken === 3) {
          // Set a timer to ask about grass after a delay
          this.tooltipTimer = setTimeout(() => {
            this.askingForGrass = true;
          }, 2000);
        } else {
          if (this.tooltipTimer) {
            clearTimeout(this.tooltipTimer);
          }
          this.askingForGrass = false;
        }
      }
    },

  created() {
    // Fetch initial risk management data
    this.$store.dispatch('riskManagement/fetchRiskManagement');
    
    // Initialize local values from store
    this.localAccountSize = this.accountSize;
    this.localTradeSize = this.baseTradeSize;
  }
}
</script>
