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
      // Use the current percentage directly without multiplying
      const currentPercentage = Number(this.calculatePercentage);
      
      const labels = {
        '-2': `Cold streak (${currentPercentage}%)`,
        '-1': `Malus streak (${currentPercentage}%)`,
        '0': `Normal trade (${currentPercentage}%)`,
        '1': `Bonus streak (${currentPercentage}%)`,
        '2': `HOT streak (${currentPercentage}%)`
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
    }
  },
  
    watch: {
      accountSize: {
        handler(newVal) {
          if (newVal !== this.localAccountSize) {
            this.localAccountSize = newVal;
            this.currentPercentage = Number(this.calculatePercentage);
          }
        },
        immediate: true
      },
      baseTradeSize: {
        handler(newVal) {
          if (newVal !== this.localTradeSize) {
            this.localTradeSize = newVal;
            this.currentPercentage = Number(this.calculatePercentage);
          }
        },
        immediate: true
      },
      showTooltip(newVal) {  // Changed from showResetTooltip
        if (newVal && this.slTaken === 3) {
          clearTimeout(this.tooltipTimer);  // Changed from tooltipHoverTimer
          this.askingForGrass = false;
          this.tooltipTimer = setTimeout(() => {
            this.askingForGrass = true;
          }, 5000);
        } else {
          clearTimeout(this.tooltipTimer);  // Changed from tooltipHoverTimer
          this.askingForGrass = false;
        }
      },
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
