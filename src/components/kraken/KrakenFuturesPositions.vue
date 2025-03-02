<template>
  <div class="positions-container">
    <h2>Futures Positions</h2>
    <div v-if="loading" class="loading">
      Loading positions...
    </div>
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    <div v-else class="positions-grid">
      <div v-for="position in positions" :key="position.symbol" class="position-card">
        <div class="position-header">
          <h3>{{ position.symbol }}</h3>
          <span :class="['side-badge', position.side.toLowerCase()]">
            {{ position.side }}
          </span>
        </div>
        <div class="position-details">
          <div class="detail-row">
            <span class="label">Size:</span>
            <span class="value">{{ formatNumber(position.size) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Entry Price:</span>
            <span class="value">{{ formatPrice(position.entryPrice, 5) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Mark Price:</span>
            <span class="value">{{ formatPrice(position.markPrice, 5) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Position Value:</span>
            <span class="value">{{ formatPrice(position.positionValue, 2) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Unrealized PnL:</span>
            <span :class="['value', getPnLClass(position.unrealizedPnL)]">
              {{ formatPrice(position.unrealizedPnL, 2) }}
            </span>
          </div>
          <div class="detail-row">
            <span class="label">Total PnL:</span>
            <span :class="['value', getPnLClass(position.totalPnL)]">
              {{ formatPrice(position.totalPnL, 2) }}
            </span>
          </div>
          <div class="detail-row">
            <span class="label">Margin:</span>
            <span class="value">{{ formatPrice(position.margin, 2) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Liquidation Price:</span>
            <span class="value">{{ formatPrice(position.liquidationPrice, 5) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Funding Rate:</span>
            <span :class="['value', getFundingClass(position.fundingRate)]">
              {{ formatPercentage(position.fundingRate) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { io } from 'socket.io-client';
import axios from 'axios';

export default {
  name: 'KrakenFuturesPositions',
  expose: ['fetchPositions'],
  data() {
    return {
      positions: [],
      loading: true,
      error: null,
      socket: null,
      socketUrl: process.env.NODE_ENV === 'production' 
        ? window.location.origin  // Use the same domain in production
        : 'http://localhost:3004' // Use localhost in development
    };
  },
  async created() {
    // Connect to Socket.IO server
    this.socket = io(this.socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });
    
    // Register this client
    this.socket.emit('register', 'default'); // In a real app, use actual user ID
    
    // Listen for position updates
    this.socket.on('position_update', this.handlePositionUpdate);
    
    // Listen for price updates
    this.socket.on('price_update', this.handlePriceUpdate);

    // Listen for connection errors
    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      this.error = 'Failed to connect to real-time updates. Retrying...';
    });
    
    // Initial positions fetch
    await this.fetchPositions();
  },
  beforeUnmount() {
    if (this.socket) {
      this.socket.disconnect();
    }
  },
  methods: {
    async fetchPositions() {
      try {
        this.loading = true;
        const response = await axios.post('/api/kraken/futures/positions');
        this.positions = response.data.openPositions.map(position => ({
          ...position,
          entryPrice: position.entryPrice || position.fillPrice || position.price,
          margin: position.margin || 0,
          liquidationPrice: position.liquidationPrice || 0
        }));
        this.error = null;
      } catch (error) {
        console.error('Error fetching positions:', error);
        this.error = 'Failed to load positions. Please try again.';
      } finally {
        this.loading = false;
      }
    },
    handlePositionUpdate(data) {
      const position = this.positions.find(p => p.symbol === data.symbol);
      if (position) {
        const markPrice = parseFloat(data.markPrice);
        const size = parseFloat(position.size);
        const entryPrice = parseFloat(position.entryPrice);
        
        position.markPrice = markPrice;
        position.positionValue = size * markPrice;
        position.unrealizedPnL = (markPrice - entryPrice) * size * (position.side.toLowerCase() === 'long' ? 1 : -1);
        position.totalPnL = position.unrealizedPnL + parseFloat(position.realizedPnL || 0);
      }
    },
    handlePriceUpdate(data) {
      // Update mark price and recalculate PnL for the relevant position
      const position = this.positions.find(p => p.symbol === data.product_id);
      if (position) {
        const markPrice = parseFloat(data.markPrice);
        const size = parseFloat(position.size);
        const entryPrice = parseFloat(position.entryPrice);
        
        position.markPrice = markPrice;
        position.unrealizedPnL = position.side.toLowerCase() === 'long'
          ? (markPrice - entryPrice) * size
          : (entryPrice - markPrice) * size;
        position.totalPnL = position.unrealizedPnL + position.realizedPnL;
      }
    },
    formatNumber(value) {
      if (!value || isNaN(value)) return '0';
      return new Intl.NumberFormat('en-US').format(value);
    },
    formatPrice(value, decimals = 2) {
      if (!value || isNaN(value)) return '$0.00';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(value);
    },
    formatPercentage(value) {
      if (!value || isNaN(value)) return '0.0000%';
      return (value * 100).toFixed(4) + '%';
    },
    getPnLClass(value) {
      return value > 0 ? 'positive' : value < 0 ? 'negative' : '';
    },
    getFundingClass(value) {
      return value > 0 ? 'negative' : value < 0 ? 'positive' : '';
    }
  }
};
</script>

<style scoped>
.positions-container {
  padding: 20px;
}

.positions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.position-card {
  background: #252525;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  border: 1px solid #3d3d3d;
}

.position-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.position-header h3 {
  margin: 0;
  color: #4a9eff;
  font-size: 1.2em;
}

.side-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8em;
  font-weight: 600;
}

.side-badge.long {
  background: rgba(0, 171, 85, 0.2);
  color: #00ab55;
}

.side-badge.short {
  background: rgba(255, 72, 66, 0.2);
  color: #ff4842;
}

.position-details {
  display: grid;
  gap: 8px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.label {
  color: #888;
  font-size: 0.9em;
}

.value {
  color: #e0e0e0;
  font-weight: 500;
}

.value.positive {
  color: #00ab55;
}

.value.negative {
  color: #ff4842;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #888;
}

.error {
  text-align: center;
  padding: 12px;
  background: rgba(255, 72, 66, 0.2);
  color: #ff4842;
  border-radius: 6px;
  margin-top: 8px;
  border: 1px solid rgba(255, 72, 66, 0.5);
}

@media (max-width: 768px) {
  .positions-container {
    padding: 12px;
  }
  
  .positions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
