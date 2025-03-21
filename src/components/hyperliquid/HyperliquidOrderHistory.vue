<template>
  <div class="order-history-container">
    <div class="order-history-section-header">
      <h3>Order History</h3>
      <button @click="fetchHistory" :disabled="loading" class="order-history-refresh-button">
        {{ loading ? 'Loading...' : 'Refresh' }}
      </button>
    </div>
    
    <div v-if="loading" class="order-history-loading-indicator">Loading order history...</div>
    
    <div v-else-if="error" class="order-history-error-message">
      {{ error }}
    </div>
    
    <div v-else-if="orderHistory && orderHistory.length > 0" class="order-history-data-display">
      <div class="order-history-data-table">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Symbol</th>
              <th>Type</th>
              <th>Side</th>
              <th>Price</th>
              <th>Amount</th>
              <th>Filled</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(order, index) in orderHistory" :key="index">
              <td>{{ formatDate(order.timestamp) }}</td>
              <td>{{ order.symbol }}</td>
              <td>{{ order.type }}</td>
              <td :class="getSideClass(order.side)">{{ order.side }}</td>
              <td>${{ formatNumber(order.price, 4) }}</td>
              <td>{{ formatNumber(order.amount, 4) }}</td>
              <td>{{ formatNumber(order.filled, 4) }}</td>
              <td :class="getStatusClass(order.status)">{{ order.status }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <div v-else class="order-history-info-message">
      No order history found.
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { formatNumber, formatDate } from './functions/formatters';
import { fetchOrderHistory } from './functions/dataFetchers';

export default {
  name: 'HyperliquidOrderHistory',
  
  setup() {
    const orderHistory = ref([]);
    const loading = ref(false);
    const error = ref(null);
    
    const fetchHistory = async () => {
      loading.value = true;
      error.value = null;
      
      await fetchOrderHistory({
        onStart: () => {
          loading.value = true;
        },
        onSuccess: (data) => {
          orderHistory.value = data;
          error.value = null;
        },
        onError: (err) => {
          error.value = err.error || 'Failed to fetch order history';
          console.error('Order history error:', err);
        },
        onFinally: () => {
          loading.value = false;
        }
      });
    };
    
    const getSideClass = (side) => {
      if (!side) return '';
      
      side = side.toLowerCase();
      if (side === 'buy') {
        return 'order-history-buy';
      } else if (side === 'sell') {
        return 'order-history-sell';
      }
      return '';
    };
    
    const getStatusClass = (status) => {
      if (!status) return '';
      
      status = status.toLowerCase();
      if (status === 'filled' || status === 'closed') {
        return 'order-history-status-filled';
      } else if (status === 'canceled' || status === 'cancelled') {
        return 'order-history-status-canceled';
      } else if (status === 'open') {
        return 'order-history-status-open';
      } else if (status === 'rejected') {
        return 'order-history-status-rejected';
      }
      return '';
    };
    
    // Fetch order history when component is mounted
    onMounted(() => {
      fetchHistory();
    });
    
    return {
      orderHistory,
      loading,
      error,
      formatNumber,
      formatDate,
      fetchHistory,
      getStatusClass,
      getSideClass
    };
  }
};
</script>

<style scoped>
@import '@/assets/styles/Hyperliquid/hyperliquid-order-history.css';
</style>
