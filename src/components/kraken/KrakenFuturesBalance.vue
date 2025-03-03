<template>
  <div class="kraken-futures-balance">
    <div class="kraken-balance-header">
      <h3>Futures Wallet</h3>
    </div>
    <div v-if="loading" class="kraken-loading">Loading...</div>
    <div v-else-if="error" class="kraken-error-message">{{ error }}</div>
    <div v-else class="kraken-balance-list">
      <div class="kraken-balance-item">
        <span class="kraken-balance-currency">Total Balance:</span>
        <span class="kraken-balance-amount">{{ formatPrice(balance) }}</span>
      </div>
      <div v-if="monthlyChange !== null" class="kraken-balance-item">
        <span class="kraken-balance-currency">30d Change:</span>
        <span :class="['kraken-balance-amount', monthlyChange >= 0 ? '' : 'negative']">
          {{ formatPrice(monthlyChange) }} ({{ formatPercentage(monthlyChangePercent) }})
        </span>
      </div>
    </div>
    <div v-if="!loading && !error && (!balance || balance === 0)" class="kraken-no-balance">
      No balance available
    </div>
    <div class="kraken-update-time">
      Last update: {{ lastUpdateTime }}
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
.kraken-futures-balance {
  background: #1e1e1e;
  border-radius: 12px;
  padding: 16px;
  min-width: 0;
  max-height: 200px;
  overflow-y: auto;
}

.kraken-balance-header {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #3d3d3d;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kraken-balance-header h3 {
  margin: 0;
  font-size: 1.1em;
  color: #4a9eff;
}

.kraken-balance-list {
  display: grid;
  gap: 8px;
}

.kraken-balance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #252525;
  border-radius: 6px;
  border: 1px solid #3d3d3d;
}

.kraken-balance-currency {
  font-weight: 500;
  color: #fff;
}

.kraken-balance-amount {
  font-family: monospace;
  color: #2ebd85;
}

.kraken-balance-amount.negative {
  color: #ff4842;
}

.kraken-error-message {
  margin: 8px 0;
  padding: 8px;
  border-radius: 6px;
  background: rgba(255, 72, 66, 0.1);
  color: #ff4842;
  text-align: center;
  border: 1px solid rgba(255, 72, 66, 0.5);
  font-size: 0.9em;
}

.kraken-no-balance {
  text-align: center;
  padding: 8px;
  color: #888;
  font-size: 0.9em;
}

/* Scrollbar Styling */
.kraken-futures-balance::-webkit-scrollbar {
  width: 8px;
}

.kraken-futures-balance::-webkit-scrollbar-track {
  background: #1e1e1e;
  border-radius: 4px;
}

.kraken-futures-balance::-webkit-scrollbar-thumb {
  background: #3d3d3d;
  border-radius: 4px;
}

.kraken-futures-balance::-webkit-scrollbar-thumb:hover {
  background: #4a4a4a;
}

.kraken-update-time {
  font-size: 0.8em;
  color: #888;
  text-align: right;
  margin-top: 8px;
}
</style>
