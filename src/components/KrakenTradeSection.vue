<template>
  <div class="kraken-trade-section">
    <div class="kraken-balance" v-if="balance">
      <h3>Account Balance</h3>
      <div class="balance-grid">
        <div v-for="(amount, currency) in balance" :key="currency" class="balance-item">
          <strong>{{ currency }}:</strong> {{ formatBalance(amount) }}
        </div>
      </div>
    </div>

    <div class="kraken-trade-form">
      <h3>Place Order</h3>
      <div class="form-group">
        <label>Trading Pair</label>
        <select v-model="orderData.pair" required>
          <option value="XBTUSD">BTC/USD</option>
          <option value="ETHUSD">ETH/USD</option>
          <!-- Add more pairs as needed -->
        </select>
      </div>

      <div class="form-group">
        <label>Order Type</label>
        <select v-model="orderData.ordertype" required>
          <option value="market">Market</option>
          <option value="limit">Limit</option>
        </select>
      </div>

      <div class="form-group">
        <label>Side</label>
        <select v-model="orderData.type" required>
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
        </select>
      </div>

      <div class="form-group" v-if="orderData.ordertype === 'limit'">
        <label>Price</label>
        <input type="number" v-model="orderData.price" step="0.01" required>
      </div>

      <div class="form-group">
        <label>Volume</label>
        <input type="number" v-model="orderData.volume" step="0.00000001" required>
      </div>

      <div class="form-group">
        <label>Leverage</label>
        <select v-model="orderData.leverage">
          <option value="">None</option>
          <option value="2">2x</option>
          <option value="3">3x</option>
          <option value="4">4x</option>
          <option value="5">5x</option>
        </select>
      </div>

      <div class="form-group">
        <label>Stop Loss</label>
        <input type="number" v-model="orderData.stopLoss" step="0.01">
      </div>

      <div class="form-group">
        <label>Take Profit</label>
        <input type="number" v-model="orderData.takeProfit" step="0.01">
      </div>

      <div class="error-message" v-if="error">{{ error }}</div>

      <button @click="placeOrder" :disabled="isLoading" class="place-order-btn">
        {{ isLoading ? 'Placing Order...' : 'Place Order' }}
      </button>
    </div>

    <div class="kraken-open-orders" v-if="openOrders.length > 0">
      <h3>Open Orders</h3>
      <div class="orders-grid">
        <div v-for="order in openOrders" :key="order.txid" class="order-item">
          <div class="order-details">
            <span>{{ order.descr.pair }}</span>
            <span>{{ order.descr.type }} {{ order.descr.ordertype }}</span>
            <span>{{ order.vol }} @ {{ order.descr.price }}</span>
          </div>
          <button @click="cancelOrder(order.txid)" class="cancel-btn">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import krakenApi from '@/services/krakenApi';

export default {
  name: 'KrakenTradeSection',
  setup() {
    const balance = ref(null);
    const openOrders = ref([]);
    const error = ref('');
    const isLoading = ref(false);
    const orderData = ref({
      pair: 'XBTUSD',
      type: 'buy',
      ordertype: 'market',
      price: null,
      volume: null,
      leverage: '',
      stopLoss: null,
      takeProfit: null
    });

    const fetchBalance = async () => {
      try {
        balance.value = await krakenApi.getBalance();
      } catch (err) {
        error.value = 'Failed to fetch balance: ' + err.message;
      }
    };

    const fetchOpenOrders = async () => {
      try {
        const result = await krakenApi.getOpenOrders();
        openOrders.value = Object.values(result.open || {});
      } catch (err) {
        error.value = 'Failed to fetch open orders: ' + err.message;
      }
    };

    const placeOrder = async () => {
      error.value = '';
      isLoading.value = true;
      
      try {
        await krakenApi.addOrder(orderData.value);
        // Clear form after successful order
        orderData.value = {
          pair: 'XBTUSD',
          type: 'buy',
          ordertype: 'market',
          price: null,
          volume: null,
          leverage: '',
          stopLoss: null,
          takeProfit: null
        };
        // Refresh orders and balance
        await Promise.all([fetchOpenOrders(), fetchBalance()]);
      } catch (err) {
        error.value = 'Failed to place order: ' + err.message;
      } finally {
        isLoading.value = false;
      }
    };

    const cancelOrder = async (orderId) => {
      try {
        await krakenApi.cancelOrder(orderId);
        await fetchOpenOrders();
      } catch (err) {
        error.value = 'Failed to cancel order: ' + err.message;
      }
    };

    const formatBalance = (amount) => {
      return parseFloat(amount).toFixed(8);
    };

    onMounted(async () => {
      await Promise.all([fetchBalance(), fetchOpenOrders()]);
    });

    return {
      balance,
      openOrders,
      orderData,
      error,
      isLoading,
      placeOrder,
      cancelOrder,
      formatBalance
    };
  }
};
</script>

<style scoped>
.kraken-trade-section {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.kraken-balance {
  background: #2c3e50;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.balance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.balance-item {
  background: #34495e;
  padding: 10px;
  border-radius: 4px;
}

.kraken-trade-form {
  background: #2c3e50;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #ecf0f1;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #34495e;
  border-radius: 4px;
  background: #34495e;
  color: #ecf0f1;
}

.place-order-btn {
  width: 100%;
  padding: 12px;
  background: #2ecc71;
  border: none;
  border-radius: 4px;
  color: white;
  font-weight: bold;
  cursor: pointer;
}

.place-order-btn:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

.error-message {
  color: #e74c3c;
  margin-bottom: 15px;
}

.kraken-open-orders {
  background: #2c3e50;
  padding: 15px;
  border-radius: 8px;
}

.orders-grid {
  display: grid;
  gap: 10px;
  margin-top: 10px;
}

.order-item {
  background: #34495e;
  padding: 10px;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-details {
  display: flex;
  gap: 15px;
}

.cancel-btn {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn:hover {
  background: #c0392b;
}
</style>
