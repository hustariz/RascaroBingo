<template>
  <div class="kraken-card">
    <h3>Futures Wallet</h3>
    <div v-if="loading" class="kraken-loading">Loading...</div>
    <div v-else-if="error" class="kraken-error-message">{{ error }}</div>
    <div v-else class="kraken-balance-info">
      <div class="kraken-balance-row">
        <span class="kraken-label">Total Balance:</span>
        <span class="kraken-value">{{ formatPrice(balance) }}</span>
      </div>
      <div v-if="monthlyChange !== null" class="kraken-balance-row">
        <span class="kraken-label">30d Change:</span>
        <span :class="['kraken-value', monthlyChange >= 0 ? 'kraken-positive' : 'kraken-negative']">
          {{ formatPrice(monthlyChange) }} ({{ formatPercentage(monthlyChangePercent) }})
        </span>
      </div>
      <div class="kraken-update-time">
        Last update: {{ lastUpdateTime }}
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import io from 'socket.io-client';

export default defineComponent({
  name: 'KrakenFuturesBalance',
  
  setup() {
    const balance = ref(0);
    const monthlyChange = ref(null);
    const monthlyChangePercent = ref(null);
    const loading = ref(true);
    const error = ref(null);
    const lastUpdateTime = ref('Never');
    const socket = ref(null);
    const updateInterval = ref(null);
    const isUnmounted = ref(false);
    
    const fetchBalance = async () => {
      if (isUnmounted.value) return;
      
      try {
        loading.value = true;
        error.value = null;
        const response = await axios.get('/api/kraken/futures/balance');
        
        if (isUnmounted.value) return;
        
        if (response.data && typeof response.data.balance === 'number') {
          balance.value = response.data.balance;
          monthlyChange.value = response.data.monthlyChange;
          monthlyChangePercent.value = response.data.monthlyChangePercent;
          lastUpdateTime.value = new Date().toLocaleTimeString();
        } else {
          throw new Error('Invalid balance data received');
        }
      } catch (err) {
        if (isUnmounted.value) return;
        
        console.error('Error fetching futures balance:', err);
        
        const errorMessage = err.response?.data?.error 
          ? `${err.response.data.error}${err.response.data.details ? ': ' + err.response.data.details : ''}`
          : err.message || 'Failed to load balance';
          
        error.value = errorMessage;
        
        if (!err.response || err.response.status === 401) {
          console.log('Retrying in 5 seconds...');
          if (!isUnmounted.value) {
            setTimeout(fetchBalance, 5000);
          }
        }
      } finally {
        if (!isUnmounted.value) {
          loading.value = false;
        }
      }
    };
    
    const formatPrice = (value) => {
      if (!value || isNaN(value)) return '$0.00';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    };
    
    const formatPercentage = (value) => {
      if (!value || isNaN(value)) return '0.00%';
      return value.toFixed(2) + '%';
    };
    
    onMounted(() => {
      isUnmounted.value = false;
      
      // Initial fetch
      fetchBalance();
      
      // Connect to WebSocket
      socket.value = io();
      
      // Listen for balance updates
      socket.value.on('futures-balance-update', (data) => {
        if (!isUnmounted.value) {
          balance.value = data.balance;
          monthlyChange.value = data.monthlyChange;
          monthlyChangePercent.value = data.monthlyChangePercent;
          lastUpdateTime.value = new Date().toLocaleTimeString();
        }
      });
      
      // Register as default user (or use actual user ID if you have authentication)
      socket.value.emit('register', 'default');
      
      // Fetch every 15 seconds as fallback
      updateInterval.value = setInterval(() => {
        if (!isUnmounted.value) {
          fetchBalance();
        }
      }, 15000);
    });
    
    onUnmounted(() => {
      isUnmounted.value = true;
      
      // Clean up
      if (socket.value) {
        socket.value.disconnect();
        socket.value = null;
      }
      if (updateInterval.value) {
        clearInterval(updateInterval.value);
        updateInterval.value = null;
      }
    });
    
    return {
      balance,
      monthlyChange,
      monthlyChangePercent,
      loading,
      error,
      formatPrice,
      formatPercentage,
      lastUpdateTime
    };
  }
});
</script>

<style scoped>
.kraken-card {
  width: 100%;
}

h3 {
  margin: 0 0 12px 0;
  font-size: 1.1em;
  color: var(--text-color, #333333);
}

.kraken-loading {
  color: var(--text-secondary, #666666);
  font-style: italic;
}

.kraken-error-message {
  color: var(--error-color, #dc3545);
  font-size: 0.9em;
}

.kraken-balance-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kraken-balance-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.kraken-label {
  color: var(--text-secondary, #666666);
}

.kraken-value {
  font-weight: 500;
}

.kraken-positive {
  color: var(--success-color, #28a745);
}

.kraken-negative {
  color: var(--error-color, #dc3545);
}

.kraken-update-time {
  font-size: 0.8em;
  color: var(--text-secondary, #666666);
  text-align: right;
  margin-top: 8px;
}
</style>
