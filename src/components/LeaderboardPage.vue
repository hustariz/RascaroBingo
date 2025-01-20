<template>
  <div class="leaderboard-page">
    <h2 class="feature-title">Leaderboard</h2>
    <div class="feature-box">
      <div class="leaderboard-controls">
        <div class="sort-controls">
          <button 
            :class="{ active: sortBy === 'trades' }" 
            @click="setSortBy('trades')"
          >
            <font-awesome-icon icon="chart-bar" /> Sort by Trades
          </button>
          <button 
            :class="{ active: sortBy === 'winrate' }" 
            @click="setSortBy('winrate')"
          >
            <font-awesome-icon icon="trophy" /> Sort by Winrate
          </button>
          <button 
            :class="{ active: sortBy === 'gain' }" 
            @click="setSortBy('gain')"
          >
            <font-awesome-icon icon="chart-line" /> Sort by Gain
          </button>
          <button 
            :class="{ active: sortBy === 'rr' }" 
            @click="setSortBy('rr')"
          >
            <font-awesome-icon icon="brain" /> Sort by R/R
          </button>
        </div>
      </div>

      <div class="leaderboard-table">
        <div class="table-header">
          <div class="rank">#</div>
          <div class="user">Trader</div>
          <div class="trades">
            <font-awesome-icon icon="chart-bar" /> Trades
          </div>
          <div class="winrate">
            <font-awesome-icon icon="trophy" /> Winrate
          </div>
          <div class="gain">
            <font-awesome-icon icon="chart-line" /> Gain
          </div>
          <div class="rr" title="Risk/Reward Ratio">
            <font-awesome-icon icon="brain" /> R/R
          </div>
        </div>

        <div v-if="loading" class="loading">
          <font-awesome-icon icon="circle-notch" spin /> Loading...
        </div>

        <div v-else-if="error" class="error">
          <font-awesome-icon icon="exclamation-circle" /> {{ error }}
        </div>

        <template v-else>
          <div v-for="(user, index) in sortedUsers" :key="user.id" class="table-row">
            <div class="rank">
              <div :class="['rank-number', getRankClass(index + 1)]">{{ index + 1 }}</div>
            </div>
            <div class="user">
              <font-awesome-icon :icon="['fas', 'user']" />
              {{ user.username }}
              <span v-if="user.isPremium" class="premium-badge">
                <font-awesome-icon icon="crown" title="Premium User" />
              </span>
            </div>
            <div class="trades">{{ user.totalTrades }}</div>
            <div class="winrate">{{ formatWinrate(user.winrate) }}</div>
            <div :class="['gain', { positive: user.totalGain > 0, negative: user.totalGain < 0 }]">
              {{ formatGain(user.totalGain) }}
            </div>
            <div :class="['rr', {
              'rr-golden': user.riskRewardRatio >= 3,
              'rr-purple': user.riskRewardRatio >= 1.5 && user.riskRewardRatio < 3,
              'rr-normal': user.riskRewardRatio >= 1 && user.riskRewardRatio < 1.5,
              'rr-bad': user.riskRewardRatio < 1
            }]" 
                 :title="getRRTitle(user.riskRewardRatio)">
              {{ formatRR(user.riskRewardRatio) }}
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/services/api';

export default {
  name: 'LeaderboardPage',
  data() {
    return {
      users: [],
      loading: true,
      error: null,
      sortBy: 'trades' // 'trades', 'winrate', 'gain', or 'rr'
    };
  },
  computed: {
    sortedUsers() {
      return [...this.users].sort((a, b) => {
        if (this.sortBy === 'trades') {
          return b.totalTrades - a.totalTrades;
        } else if (this.sortBy === 'winrate') {
          return b.winrate - a.winrate;
        } else if (this.sortBy === 'gain') {
          return b.totalGain - a.totalGain;
        } else {
          return b.riskRewardRatio - a.riskRewardRatio;
        }
      });
    }
  },
  methods: {
    async loadUsers() {
      try {
        this.loading = true;
        this.error = null;
        const stats = await api.getUserStats();
        this.users = stats.users;
      } catch (error) {
        this.error = error.message || 'Failed to load leaderboard data';
        console.error('Error loading leaderboard:', error);
      } finally {
        this.loading = false;
      }
    },
    setSortBy(type) {
      this.sortBy = type;
    },
    formatWinrate(winrate) {
      return `${(winrate * 100).toFixed(1)}%`;
    },
    formatGain(gain) {
      return gain >= 0 
        ? `+$${gain.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
        : `-$${Math.abs(gain).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },
    formatRR(rr) {
      if (rr === null || rr === undefined) return '-';
      return Number(rr).toFixed(1);
    },
    getRRTitle(rr) {
      if (rr >= 3) {
        return `Exceptional R/R: ${rr} (Elite Level)`;
      } else if (rr >= 1.5) {
        return `Strong R/R: ${rr} (Professional Level)`;
      } else if (rr >= 1) {
        return `Acceptable R/R: ${rr} (Break Even Level)`;
      } else {
        return `Poor R/R: ${rr} (High Risk Level)`;
      }
    },
    getRankClass(rank) {
      if (rank === 1) return 'gold';
      if (rank === 2) return 'silver';
      if (rank === 3) return 'bronze';
      return '';
    }
  },
  mounted() {
    this.loadUsers();
  }
};
</script>

<style scoped>
.leaderboard-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  min-height: 100vh;
}

.feature-title {
  font-family: 'Legendarie', sans-serif;
  color: rgb(238, 175, 17);
  font-size: 2.5rem;
  text-shadow: 
    2px 2px 0 rgba(0, 0, 0, 0.8),
    -2px -2px 0 rgba(0, 0, 0, 0.8),
    2px -2px 0 rgba(0, 0, 0, 0.8),
    -2px 2px 0 rgba(0, 0, 0, 0.8),
    0 0 15px rgba(238, 175, 17, 0.5);
  padding: 1rem 2rem;
  border-radius: 8px;
  animation: fadeIn 0.5s ease-out;
}

.feature-box {
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid rgb(238, 175, 17);
  border-radius: 10px;
  padding: 2rem;
  width: 100%;
  max-width: 1200px;
  margin: 2rem auto;
  box-shadow: 0 0 20px rgba(238, 175, 17, 0.2);
  backdrop-filter: blur(5px);
  transform: translateY(20px);
  animation: slideUp 0.5s ease forwards;
}

@keyframes slideUp {
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.leaderboard-controls {
  margin-bottom: 2rem;
}

.sort-controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.sort-controls button {
  background: rgba(238, 175, 17, 0.1);
  border: 1px solid rgb(238, 175, 17);
  color: rgb(238, 175, 17);
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  position: relative;
  overflow: hidden;
}

.sort-controls button::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent,
    rgba(238, 175, 17, 0.1),
    transparent
  );
  transform: rotate(45deg);
  transition: all 0.3s ease;
  opacity: 0;
}

.sort-controls button:hover::after {
  opacity: 1;
  animation: shine 1.5s infinite;
}

@keyframes shine {
  0% {
    transform: rotate(45deg) translateX(-100%);
  }
  100% {
    transform: rotate(45deg) translateX(100%);
  }
}

.sort-controls button:hover,
.sort-controls button.active {
  background: rgb(238, 175, 17);
  color: black;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(238, 175, 17, 0.3);
}

.leaderboard-table {
  width: 100%;
  overflow-x: auto;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 80px 1fr 120px 120px 150px 100px;
  padding: 1rem;
  align-items: center;
  border-bottom: 1px solid rgba(238, 175, 17, 0.2);
}

.table-header {
  color: rgb(238, 175, 17);
  font-weight: bold;
  border-bottom: 2px solid rgb(238, 175, 17);
}

.table-row {
  color: white;
  transition: background-color 0.3s ease;
  animation: slideIn 0.5s ease-out backwards;
}

.table-row:nth-child(1) { animation-delay: 0.1s; }
.table-row:nth-child(2) { animation-delay: 0.2s; }
.table-row:nth-child(3) { animation-delay: 0.3s; }
.table-row:nth-child(4) { animation-delay: 0.4s; }
.table-row:nth-child(5) { animation-delay: 0.5s; }

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.rank {
  text-align: center;
}

.rank-number {
  display: inline-block;
  width: 30px;
  height: 30px;
  line-height: 30px;
  border-radius: 50%;
  background: rgba(238, 175, 17, 0.1);
  transition: all 0.3s ease;
}

.rank-number.gold {
  background: linear-gradient(45deg, #FFD700, #FFA500);
  color: black;
  animation: pulse 2s infinite;
}

.rank-number.silver {
  background: linear-gradient(45deg, #C0C0C0, #A9A9A9);
  color: black;
  animation: pulse 2.5s infinite;
}

.rank-number.bronze {
  background: linear-gradient(45deg, #CD7F32, #8B4513);
  color: white;
  animation: pulse 3s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(238, 175, 17, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(238, 175, 17, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(238, 175, 17, 0);
  }
}

.user {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.premium-badge {
  color: rgb(238, 175, 17);
  margin-left: 0.5rem;
  animation: crownFloat 3s ease-in-out infinite;
}

@keyframes crownFloat {
  0%, 100% {
    transform: rotate(-5deg);
  }
  50% {
    transform: rotate(5deg);
  }
}

.trades,
.winrate,
.gain,
.rr {
  text-align: center;
  transition: all 0.3s ease;
}

.gain.positive {
  color: #4CAF50;
  text-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
}

.gain.negative {
  color: #f44336;
  text-shadow: 0 0 10px rgba(244, 67, 54, 0.3);
}

.rr {
  font-weight: bold;
  cursor: help;
  transition: all 0.3s ease;
  padding: 4px 8px;
  border-radius: 4px;
}

.rr.rr-golden {
  color: #FFD700;
  background: linear-gradient(45deg, rgba(255, 215, 0, 0.1), rgba(255, 165, 0, 0.1));
  border: 1px solid rgba(255, 215, 0, 0.3);
  animation: fireGlow 2s ease-in-out infinite;
}

@keyframes fireGlow {
  0% {
    text-shadow: 
      0 0 4px rgba(255, 215, 0, 0.5),
      0 0 8px rgba(255, 165, 0, 0.5),
      0 0 12px rgba(255, 140, 0, 0.5);
    box-shadow: 
      0 0 4px rgba(255, 215, 0, 0.2),
      0 0 8px rgba(255, 165, 0, 0.2);
  }
  50% {
    text-shadow: 
      0 0 8px rgba(255, 215, 0, 0.8),
      0 0 16px rgba(255, 165, 0, 0.8),
      0 0 24px rgba(255, 140, 0, 0.8);
    box-shadow: 
      0 0 8px rgba(255, 215, 0, 0.4),
      0 0 16px rgba(255, 165, 0, 0.4);
  }
  100% {
    text-shadow: 
      0 0 4px rgba(255, 215, 0, 0.5),
      0 0 8px rgba(255, 165, 0, 0.5),
      0 0 12px rgba(255, 140, 0, 0.5);
    box-shadow: 
      0 0 4px rgba(255, 215, 0, 0.2),
      0 0 8px rgba(255, 165, 0, 0.2);
  }
}

.rr.rr-purple {
  color: #9D5CF0;
  background: linear-gradient(45deg, rgba(157, 92, 240, 0.1), rgba(122, 40, 138, 0.1));
  border: 1px solid rgba(157, 92, 240, 0.3);
  animation: purpleGlow 3s ease-in-out infinite;
}

@keyframes purpleGlow {
  0% {
    text-shadow: 
      0 0 4px rgba(157, 92, 240, 0.5),
      0 0 8px rgba(122, 40, 138, 0.5);
    box-shadow: 
      0 0 4px rgba(157, 92, 240, 0.2),
      0 0 8px rgba(122, 40, 138, 0.2);
  }
  50% {
    text-shadow: 
      0 0 8px rgba(157, 92, 240, 0.8),
      0 0 16px rgba(122, 40, 138, 0.8);
    box-shadow: 
      0 0 8px rgba(157, 92, 240, 0.4),
      0 0 16px rgba(122, 40, 138, 0.4);
  }
  100% {
    text-shadow: 
      0 0 4px rgba(157, 92, 240, 0.5),
      0 0 8px rgba(122, 40, 138, 0.5);
    box-shadow: 
      0 0 4px rgba(157, 92, 240, 0.2),
      0 0 8px rgba(122, 40, 138, 0.2);
  }
}

.rr.rr-normal {
  color: #FFFFFF;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.rr.rr-bad {
  color: #f44336;
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.3);
  animation: dangerPulse 2s ease-in-out infinite;
}

@keyframes dangerPulse {
  0% {
    text-shadow: 0 0 4px rgba(244, 67, 54, 0.5);
    box-shadow: 0 0 4px rgba(244, 67, 54, 0.2);
  }
  50% {
    text-shadow: 0 0 8px rgba(244, 67, 54, 0.8);
    box-shadow: 0 0 8px rgba(244, 67, 54, 0.4);
  }
  100% {
    text-shadow: 0 0 4px rgba(244, 67, 54, 0.5);
    box-shadow: 0 0 4px rgba(244, 67, 54, 0.2);
  }
}

.loading {
  text-align: center;
  padding: 2rem;
  color: white;
  animation: loadingPulse 1.5s ease-in-out infinite;
}

@keyframes loadingPulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(0.95);
  }
}

.error {
  text-align: center;
  padding: 2rem;
  color: #ff4444;
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

.table-row:hover {
  background: rgba(238, 175, 17, 0.1);
  transform: scale(1.01);
  box-shadow: 0 0 15px rgba(238, 175, 17, 0.15);
}

@media (max-width: 768px) {
  .table-header,
  .table-row {
    grid-template-columns: 60px 1fr 80px 80px 100px 80px;
    font-size: 0.9rem;
    padding: 0.75rem;
  }

  .sort-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .sort-controls button {
    width: 100%;
  }
}
</style>