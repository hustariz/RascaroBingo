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
            <div :class="['rr', { 'good-rr': user.riskRewardRatio >= 2, 'bad-rr': user.riskRewardRatio < 1 }]" 
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
      if (rr === null || rr === undefined) return 'N/A';
      return `${Number(rr).toFixed(1)}:1`;
    },
    getRRTitle(rr) {
      if (rr === null || rr === undefined) return 'No Risk/Reward data available';
      if (rr >= 2) return 'Excellent Risk/Reward ratio';
      if (rr >= 1.5) return 'Good Risk/Reward ratio';
      if (rr >= 1) return 'Acceptable Risk/Reward ratio';
      return 'Poor Risk/Reward ratio';
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
}

.sort-controls button:hover,
.sort-controls button.active {
  background: rgb(238, 175, 17);
  color: black;
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
}

.table-row:hover {
  background: rgba(238, 175, 17, 0.1);
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
}

.rank-number.gold {
  background: linear-gradient(45deg, #FFD700, #FFA500);
  color: black;
}

.rank-number.silver {
  background: linear-gradient(45deg, #C0C0C0, #A9A9A9);
  color: black;
}

.rank-number.bronze {
  background: linear-gradient(45deg, #CD7F32, #8B4513);
  color: white;
}

.user {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.premium-badge {
  color: rgb(238, 175, 17);
  margin-left: 0.5rem;
}

.trades,
.winrate,
.gain,
.rr {
  text-align: center;
}

.gain.positive {
  color: #4CAF50;
}

.gain.negative {
  color: #f44336;
}

.rr {
  font-weight: bold;
  cursor: help;
}

.rr.good-rr {
  color: #4CAF50;
}

.rr.bad-rr {
  color: #f44336;
}

.loading,
.error {
  text-align: center;
  padding: 2rem;
  color: white;
}

.loading {
  color: rgb(238, 175, 17);
}

.error {
  color: #ff4444;
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