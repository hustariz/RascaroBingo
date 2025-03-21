<template>
  <div class="hyperliquid-history-container">
    <div class="section-header">
      <h3>Trade History</h3>
      <button @click="fetchHistory" :disabled="loading" class="refresh-button">
        {{ loading ? 'Loading...' : 'Refresh' }}
      </button>
    </div>
    
    <div v-if="loading" class="loading-indicator">Loading trade history...</div>
    
    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>
    
    <div v-else-if="tradeHistory && tradeHistory.length > 0" class="data-display">
      <div class="data-table">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Symbol</th>
              <th>Side</th>
              <th>Price</th>
              <th>Amount</th>
              <th>Cost</th>
              <th>Fee</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(trade, index) in tradeHistory" :key="index">
              <td>{{ formatDate(trade.timestamp) }}</td>
              <td>{{ trade.symbol }}</td>
              <td :class="trade.side">{{ trade.side }}</td>
              <td>${{ formatNumber(trade.price, 4) }}</td>
              <td>{{ formatNumber(trade.amount, 4) }}</td>
              <td>${{ formatNumber(trade.cost, 2) }}</td>
              <td>{{ formatNumber(trade.fee?.cost || 0, 4) }} {{ trade.fee?.currency || '' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <div v-else class="info-message">
      No trade history found.
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { formatNumber, formatDate } from './functions/formatters';
import { fetchTradeHistory } from './functions/dataFetchers';

export default {
  name: 'HyperliquidHistory',
  
  setup() {
    const tradeHistory = ref([]);
    const loading = ref(false);
    const error = ref(null);
    
    const fetchHistory = async () => {
      loading.value = true;
      error.value = null;
      
      await fetchTradeHistory({
        onStart: () => {
          loading.value = true;
        },
        onSuccess: (data) => {
          tradeHistory.value = data;
          error.value = null;
        },
        onError: (err) => {
          error.value = err.error || 'Failed to fetch trade history';
          console.error('Trade history error:', err);
        },
        onFinally: () => {
          loading.value = false;
        }
      });
    };
    
    // Fetch trade history when component is mounted
    onMounted(() => {
      fetchHistory();
    });
    
    return {
      tradeHistory,
      loading,
      error,
      formatNumber,
      formatDate,
      fetchHistory
    };
  }
};
</script>

<style scoped>
@import '@/assets/styles/Hyperliquid/hyperliquid-history.css';
</style>
