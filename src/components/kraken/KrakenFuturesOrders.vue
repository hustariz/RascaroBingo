<template>
  <div class="kraken-futures-orders">
    <div class="kraken-orders-header">
      <h3>Futures Orders</h3>
    </div>
    <div v-if="error" class="kraken-error-message">{{ error }}</div>
    <div v-else-if="!orders?.length" class="kraken-no-orders">No open orders</div>
    <div v-else class="kraken-orders-list">
      <div v-for="order in orders" :key="order.orderId" class="kraken-order-item">
        <div class="kraken-order-header">
          <div class="kraken-order-symbol">{{ order.symbol }}</div>
          <div :class="['kraken-order-side', order.side.toLowerCase()]">
            {{ order.side }}
          </div>
        </div>
        <div class="kraken-order-details">
          <div class="kraken-order-row">
            <span class="kraken-order-label">Type:</span>
            <span class="kraken-order-value">{{ formatOrderType(order.orderType) }}</span>
          </div>
          <div class="kraken-order-row">
            <span class="kraken-order-label">Size:</span>
            <span class="kraken-order-value">{{ formatNumber(order.size) }}</span>
          </div>
          <div class="kraken-order-row">
            <span class="kraken-order-label">Limit Price:</span>
            <span class="kraken-order-value">{{ formatPrice(order.limitPrice, 5) }}</span>
          </div>
          <div v-if="order.stopPrice" class="kraken-order-row">
            <span class="kraken-order-label">Stop Price:</span>
            <span class="kraken-order-value">{{ formatPrice(order.stopPrice, 5) }}</span>
          </div>
          <div class="kraken-order-row">
            <span class="kraken-order-label">Filled:</span>
            <span class="kraken-order-value">{{ formatNumber(order.filled) }}</span>
          </div>
          <div class="kraken-order-row">
            <span class="kraken-order-label">Reduce Only:</span>
            <span class="kraken-order-value">{{ order.reduceOnly ? 'Yes' : 'No' }}</span>
          </div>
          <div class="kraken-order-row">
            <span class="kraken-order-label">Time:</span>
            <span class="kraken-order-value">{{ formatTime(order.receivedTime) }}</span>
          </div>
        </div>
        <div class="kraken-order-actions">
          <button 
            @click="cancelOrder(order.orderId)" 
            :disabled="cancellingOrders.includes(order.orderId)"
            class="kraken-order-button"
          >
            {{ cancellingOrders.includes(order.orderId) ? 'Cancelling...' : 'Cancel Order' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'KrakenFuturesOrders',
  data() {
    return {
      orders: [],
      error: null,
      refreshInterval: null,
      cancellingOrders: [] // Track orders being cancelled
    };
  },
  created() {
    // Initial orders fetch
    this.fetchOrders();
    
    // Set up automatic refresh every 5 seconds
    this.refreshInterval = setInterval(this.fetchOrders, 5000);
  },
  beforeUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  },
  methods: {
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
    formatOrderType(type) {
      const types = {
        'lmt': 'Limit',
        'post': 'Post-Only',
        'mkt': 'Market',
        'stp': 'Stop',
        'take_profit': 'Take Profit',
        'ioc': 'IOC',
        'trailing_stop': 'Trailing Stop'
      };
      return types[type] || type;
    },
    formatTime(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    },
    async fetchOrders() {
      try {
        console.log('Fetching orders...');
        const response = await axios.get('/api/kraken/futures/orders');
        
        if (!response.data || !response.data.openOrders) {
          console.log('No orders data found');
          this.orders = [];
          return;
        }
        
        // Make sure all numeric values are properly parsed
        this.orders = response.data.openOrders.map(order => ({
          ...order,
          orderId: order.orderId || order.order_id, // Handle both formats
          cliOrdId: order.cliOrdId, // Store the client order ID
          symbol: (order.symbol || order.instrument || '').replace('PF_', 'PI_'), // Handle both formats and fix PF_ prefix
          size: parseFloat(order.size || 0),
          limitPrice: parseFloat(order.limitPrice || order.price || 0),
          stopPrice: parseFloat(order.stopPrice || 0),
          filled: parseFloat(order.filled || 0)
        }));
        
        this.error = null;
      } catch (error) {
        console.error('Error fetching orders:', error);
        this.error = 'Failed to load orders. Please try again.';
      }
    },
    async cancelOrder(orderId) {
      if (!orderId || this.cancellingOrders.includes(orderId)) {
        return;
      }

      this.cancellingOrders.push(orderId);
      this.error = null;

      try {
        // Find the order to get its actual order_id from Kraken
        const order = this.orders.find(o => o.orderId === orderId);
        if (!order) {
          throw new Error('Order not found');
        }

        // Use the order_id from the order object
        const krakenOrderId = order.order_id || order.orderId;
        if (!krakenOrderId) {
          throw new Error('Missing Kraken order ID');
        }

        // Generate a unique client order ID if not present
        const cliOrdId = order.cliOrdId || 
          `cancel-${krakenOrderId}-${Date.now()}`;

        const response = await axios.post('/api/kraken/futures/cancel-order', {
          order_id: krakenOrderId,
          cliOrdId: cliOrdId,
          symbol: order.symbol // Add the symbol to the request
        });
        
        if (response.data.error) {
          throw new Error(response.data.error);
        }
        
        // Remove the cancelled order from the list
        this.orders = this.orders.filter(order => order.orderId !== orderId);
        
        // Show success message
        this.$emit('show-notification', {
          type: 'success',
          message: response.data.message || 'Order cancelled successfully'
        });
        
        // Always refresh orders to ensure our list is up to date
        await this.fetchOrders();
      } catch (error) {
        console.error('Error canceling order:', error);
        
        // Extract error message, prioritizing API error details
        const errorMessage = error.response?.data?.error || 
                           error.response?.data?.details || 
                           error.message || 
                           'Failed to cancel order';
        
        this.error = errorMessage;
        
        // Show error notification
        this.$emit('show-notification', {
          type: 'error',
          message: errorMessage
        });
        
        // Refresh orders list in case the error was due to order already being cancelled
        try {
          await this.fetchOrders();
        } catch (fetchError) {
          console.error('Error refreshing orders after cancel failure:', fetchError);
        }
      } finally {
        // Remove the order from the cancelling list
        this.cancellingOrders = this.cancellingOrders.filter(id => id !== orderId);
      }
    }
  }
};
</script>

<style scoped>
.kraken-futures-orders {
  background: #1e1e1e;
  border-radius: 12px;
  padding: 12px;
  min-width: 0;
  max-height: 400px;
  overflow-y: auto;
}

.kraken-orders-header {
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #3d3d3d;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kraken-orders-header h3 {
  margin: 0;
  font-size: 1.1em;
  color: #4a9eff;
}

.kraken-orders-list {
  display: grid;
  gap: 8px;
}

.kraken-order-item {
  background: #252525;
  border-radius: 6px;
  padding: 8px;
  border: 1px solid #3d3d3d;
  font-size: 0.9em;
}

.kraken-order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.kraken-order-symbol {
  font-weight: 500;
  color: #fff;
}

.kraken-order-side {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.85em;
  font-weight: 500;
}

.kraken-order-side.buy {
  background: rgba(0, 255, 0, 0.1);
  color: #00ff00;
}

.kraken-order-side.sell {
  background: rgba(255, 0, 0, 0.1);
  color: #ff4444;
}

.kraken-order-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px 12px;
  margin-bottom: 6px;
}

.kraken-order-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85em;
}

.kraken-order-label {
  color: #888;
  margin-right: 8px;
}

.kraken-order-value {
  color: #fff;
  font-family: monospace;
}

.kraken-order-actions {
  display: flex;
  justify-content: flex-end;
}

.kraken-order-button {
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.85em;
  cursor: pointer;
  transition: background 0.2s;
}

.kraken-order-button:not(:disabled):hover {
  background: #ff2222;
}

.kraken-order-button:disabled {
  background: #666;
  cursor: not-allowed;
  opacity: 0.7;
}

.kraken-error-message {
  color: #ff4444;
  padding: 12px;
  text-align: center;
}

.kraken-no-orders {
  color: #888;
  padding: 12px;
  text-align: center;
}

/* Custom scrollbar */
.kraken-futures-orders::-webkit-scrollbar {
  width: 8px;
}

.kraken-futures-orders::-webkit-scrollbar-track {
  background: #1e1e1e;
  border-radius: 4px;
}

.kraken-futures-orders::-webkit-scrollbar-thumb {
  background: #3d3d3d;
  border-radius: 4px;
}

.kraken-futures-orders::-webkit-scrollbar-thumb:hover {
  background: #4d4d4d;
}
</style>
