<template>
  <div class="spot-dashboard">
    <div class="dashboard-card">
      <h2>Spot Trading Dashboard</h2>
      <div class="dashboard-sections">
        <!-- Account Balance Section -->
        <div class="section">
          <h3>Account Balance</h3>
          <div v-if="loading.balance" class="loading">Loading balances...</div>
          <div v-else-if="error.balance" class="error">{{ error.balance }}</div>
          <div v-else class="balance-grid">
            <div v-for="(balance, currency) in accountBalance" :key="currency" class="balance-item">
              <span class="currency">{{ currency }}</span>
              <span class="amount">{{ formatNumber(balance) }}</span>
            </div>
          </div>
        </div>

        <!-- BTC/USD Ticker Section -->
        <div class="section">
          <h3>BTC/USD Ticker</h3>
          <div v-if="loading.ticker" class="loading">Loading ticker...</div>
          <div v-else-if="error.ticker" class="error">{{ error.ticker }}</div>
          <div v-else class="ticker-info">
            <div class="ticker-row">
              <span class="label">Last Price:</span>
              <span class="value">${{ formatNumber(btcTicker.c?.[0]) }}</span>
            </div>
            <div class="ticker-row">
              <span class="label">24h Volume:</span>
              <span class="value">{{ formatNumber(btcTicker.v?.[1]) }} BTC</span>
            </div>
            <div class="ticker-row">
              <span class="label">24h High:</span>
              <span class="value">${{ formatNumber(btcTicker.h?.[1]) }}</span>
            </div>
            <div class="ticker-row">
              <span class="label">24h Low:</span>
              <span class="value">${{ formatNumber(btcTicker.l?.[1]) }}</span>
            </div>
          </div>
        </div>

        <!-- Open Orders Section -->
        <div class="section">
          <h3>Open Orders</h3>
          <div v-if="loading.orders" class="loading">Loading orders...</div>
          <div v-else-if="error.orders" class="error">{{ error.orders }}</div>
          <div v-else-if="openOrders.length === 0" class="no-orders">No open orders</div>
          <div v-else class="orders-list">
            <div v-for="order in openOrders" :key="order.orderid" class="order-item">
              <div class="order-header">
                <span :class="['order-type', order.type]">{{ order.type.toUpperCase() }}</span>
                <span class="order-pair">{{ order.descr.pair }}</span>
              </div>
              <div class="order-details">
                <div class="detail-row">
                  <span class="label">Price:</span>
                  <span class="value">${{ formatNumber(order.descr.price) }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Volume:</span>
                  <span class="value">{{ formatNumber(order.vol) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'KrakenSpotDashboard',
  data() {
    return {
      accountBalance: {},
      btcTicker: {},
      openOrders: [],
      loading: {
        balance: true,
        ticker: true,
        orders: true
      },
      error: {
        balance: null,
        ticker: null,
        orders: null
      }
    };
  },
  async created() {
    await Promise.all([
      this.fetchAccountBalance(),
      this.fetchBTCTicker(),
      this.fetchOpenOrders()
    ]);
  },
  methods: {
    async fetchAccountBalance() {
      try {
        const response = await axios.get('/api/kraken/spot/balance');
        this.accountBalance = response.data.result;
        this.error.balance = null;
      } catch (error) {
        console.error('Error fetching balance:', error);
        this.error.balance = 'Failed to load account balance';
      } finally {
        this.loading.balance = false;
      }
    },
    async fetchBTCTicker() {
      try {
        const response = await axios.get('/api/kraken/spot/ticker?pair=XBTUSD');
        this.btcTicker = response.data.result.XXBTZUSD;
        this.error.ticker = null;
      } catch (error) {
        console.error('Error fetching ticker:', error);
        this.error.ticker = 'Failed to load BTC/USD ticker';
      } finally {
        this.loading.ticker = false;
      }
    },
    async fetchOpenOrders() {
      try {
        const response = await axios.get('/api/kraken/spot/orders');
        this.openOrders = Object.values(response.data.result.open);
        this.error.orders = null;
      } catch (error) {
        console.error('Error fetching orders:', error);
        this.error.orders = 'Failed to load open orders';
      } finally {
        this.loading.orders = false;
      }
    },
    formatNumber(value) {
      if (!value) return '0';
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8
      }).format(value);
    }
  }
};
</script>

<style scoped>
.spot-dashboard {
  padding: 20px;
}

.dashboard-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 24px;
}

.dashboard-card h2 {
  margin: 0 0 24px;
  color: #2c3e50;
  font-size: 1.8em;
}

.dashboard-sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
}

.section h3 {
  margin: 0 0 16px;
  color: #2c3e50;
  font-size: 1.2em;
}

/* Balance Section */
.balance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.balance-item {
  background: white;
  padding: 12px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.currency {
  display: block;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.amount {
  color: #666;
  font-size: 0.9em;
}

/* Ticker Section */
.ticker-info {
  background: white;
  padding: 16px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.ticker-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.ticker-row:last-child {
  margin-bottom: 0;
}

.label {
  color: #666;
}

.value {
  font-weight: 500;
  color: #2c3e50;
}

/* Orders Section */
.orders-list {
  display: grid;
  gap: 12px;
}

.order-item {
  background: white;
  padding: 16px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.order-type {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8em;
  font-weight: 600;
}

.order-type.buy {
  background: #e6f4ea;
  color: #1e7e34;
}

.order-type.sell {
  background: #fbe9e7;
  color: #d32f2f;
}

.order-pair {
  font-weight: 500;
  color: #2c3e50;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 0.9em;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.error {
  text-align: center;
  padding: 12px;
  background: #fbe9e7;
  color: #d32f2f;
  border-radius: 6px;
  margin-top: 8px;
}

.no-orders {
  text-align: center;
  padding: 20px;
  color: #666;
  font-style: italic;
}
</style>
