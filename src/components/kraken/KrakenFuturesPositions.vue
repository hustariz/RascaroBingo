<template>
  <div class="kraken-futures-positions">
    <div class="kraken-positions-header">
      <h3>Futures Positions</h3>
      <button class="kraken-refresh-button" @click="fetchPositions" :disabled="loading">
        <span v-if="loading">Loading...</span>
        <span v-else>Refresh</span>
      </button>
    </div>
    <div v-if="error" class="kraken-error-message">{{ error }}</div>
    <div v-else-if="!positions?.length" class="kraken-no-positions">No open positions</div>
    <div v-else class="kraken-positions-list">
      <div v-for="position in positions" :key="position.symbol" class="kraken-position-item">
        <div class="kraken-position-header">
          <h3>{{ position.symbol }}</h3>
          <span :class="['kraken-side-badge', position.side.toLowerCase()]">
            {{ position.side }}
          </span>
        </div>
        <div class="kraken-position-details">
          <div class="kraken-position-row">
            <span class="kraken-label">Size:</span>
            <span class="kraken-value">{{ formatNumber(position.size) }}</span>
          </div>
          <div class="kraken-position-row">
            <span class="kraken-label">Entry Price:</span>
            <span class="kraken-value">{{ formatPrice(position.entryPrice, 5) }}</span>
          </div>
          <div class="kraken-position-row">
            <span class="kraken-label">Mark Price:</span>
            <span class="kraken-value">{{ formatPrice(position.markPrice, 5) }}</span>
          </div>
          <div class="kraken-position-row">
            <span class="kraken-label">Position Value:</span>
            <span class="kraken-value">{{ formatPrice(position.positionValue, 2) }}</span>
          </div>
          <div class="kraken-position-row">
            <span class="kraken-label">Unrealized PnL:</span>
            <span :class="['kraken-value', getPnLClass(position.unrealizedPnL)]">
              {{ formatPrice(position.unrealizedPnL, 2) }}
            </span>
          </div>
          <div class="kraken-position-row">
            <span class="kraken-label">Total PnL:</span>
            <span :class="['kraken-value', getPnLClass(position.totalPnL)]">
              {{ formatPrice(position.totalPnL, 2) }}
            </span>
          </div>
          <div class="kraken-position-row">
            <span class="kraken-label">Margin:</span>
            <span class="kraken-value">{{ formatPrice(position.margin, 2) }}</span>
          </div>
          <div class="kraken-position-row">
            <span class="kraken-label">Liquidation Price:</span>
            <span class="kraken-value">{{ formatPrice(position.liquidationPrice, 5) }}</span>
          </div>
          <div class="kraken-position-row">
            <span class="kraken-label">Funding Rate:</span>
            <span :class="['kraken-value', getFundingClass(position.fundingRate)]">
              {{ formatPercentage(position.fundingRate) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { io } from 'socket.io-client';

export default {
  name: 'KrakenFuturesPositions',
  data() {
    return {
      positions: [],
      tickers: {},
      error: null,
      loading: false,
      socket: null,
      socketUrl: process.env.NODE_ENV === 'production' 
        ? 'wss://futures.kraken.com/ws/v1'
        : `${window.location.protocol}//${window.location.host}`
    };
  },
  created() {
    // Initial positions fetch
    this.fetchPositions();
    
    // Connect to WebSocket
    this.connectWebSocket();
  },
  beforeUnmount() {
    if (this.socket) {
      this.socket.disconnect();
    }
  },
  methods: {
    connectWebSocket() {
      this.socket = io(this.socketUrl);
      
      this.socket.on('connect', () => {
        console.debug('WebSocket connected for positions updates');
      });
      
      // Only update positions on trade events
      this.socket.on('futures-trade-executed', () => {
        this.fetchPositions();
      });
      
      this.socket.on('disconnect', () => {
        console.debug('WebSocket disconnected for positions updates');
      });
      
      this.socket.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.error = 'Connection error. Please refresh manually.';
      });
    },
    async fetchPositions() {
      if (this.loading) return;
      
      this.loading = true;
      try {
        const response = await axios.get('/api/kraken/futures/positions');
        
        if (!response.data || !response.data.openPositions) {
          this.positions = [];
          return;
        }
        
        this.positions = response.data.openPositions;
        this.error = null;
      } catch (error) {
        console.error('Error fetching positions:', error);
        this.error = 'Failed to load positions. Please try again.';
      } finally {
        this.loading = false;
      }
    },
    formatNumber(value) {
      if (value === null || value === undefined || isNaN(value)) return '0.00';
      return Number(value).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8
      });
    },
    formatPrice(value, decimals = 2) {
      if (value === null || value === undefined || isNaN(value)) return '$0.00';
      return '$' + Number(value).toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
    },
    formatPercentage(value) {
      if (value === null || value === undefined || isNaN(value)) return '0.0000%';
      return (Number(value) * 100).toFixed(4) + '%';
    },
    getPnLClass(value) {
      if (!value || isNaN(value)) return '';
      return Number(value) > 0 ? 'positive' : Number(value) < 0 ? 'negative' : '';
    },
    getFundingClass(value) {
      if (!value || isNaN(value)) return '';
      return Number(value) >= 0 ? 'positive' : 'negative';
    }
  }
};
</script>

<style scoped>
.kraken-futures-positions {
  background: #1e1e1e;
  border-radius: 12px;
  padding: 20px;
  min-width: 0;
}

.kraken-positions-header {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #3d3d3d;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kraken-positions-header h3 {
  margin: 0;
  font-size: 1.1em;
  color: #4a9eff;
}

.kraken-refresh-button {
  padding: 4px 12px;
  border: none;
  border-radius: 4px;
  font-size: 0.8em;
  background-color: #4a4a4a;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.kraken-refresh-button:hover {
  background-color: #5a5a5a;
}

.kraken-refresh-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.kraken-refresh-button:active:not(:disabled) {
  transform: scale(0.98);
}

.kraken-positions-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.kraken-position-item {
  background: #252525;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #3d3d3d;
  min-width: 0;
}

.kraken-position-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 10px;
}

.kraken-position-header h3 {
  margin: 0;
  color: #4a9eff;
  font-size: 1.2em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kraken-side-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.9em;
  font-weight: 600;
  white-space: nowrap;
}

.kraken-side-badge.buy,
.kraken-side-badge.long {
  background: rgba(46, 189, 133, 0.2);
  color: #2ebd85;
}

.kraken-side-badge.sell,
.kraken-side-badge.short {
  background: rgba(255, 72, 66, 0.2);
  color: #ff4842;
}

.kraken-position-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kraken-position-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.kraken-label {
  color: #888;
  font-size: 0.9em;
  white-space: nowrap;
  margin-right: 10px;
}

.kraken-value {
  font-weight: 500;
  text-align: right;
}

.kraken-value.positive {
  color: #2ebd85;
}

.kraken-value.negative {
  color: #ff4842;
}

.kraken-error-message {
  margin: 20px 0;
  padding: 12px;
  border-radius: 8px;
  background: rgba(255, 72, 66, 0.1);
  color: #ff4842;
  text-align: center;
  border: 1px solid rgba(255, 72, 66, 0.5);
}

.kraken-no-positions {
  text-align: center;
  padding: 20px;
  color: #888;
}

@media (max-width: 768px) {
  .kraken-futures-positions {
    padding: 12px;
  }
  
  .kraken-positions-list {
    grid-template-columns: 1fr;
  }
}
</style>
