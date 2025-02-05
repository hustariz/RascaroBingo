<template>
  <div class="kraken-test">
    <!-- Spot Trading Section -->
    <div class="spot-trading-section">
      <h2>Spot Trading</h2>
      <div class="spot-cards">
        <!-- Account Balance Card -->
        <div class="card">
          <h3>Account Balance</h3>
          <div v-if="balanceError" class="error-message">{{ balanceError }}</div>
          <div v-else-if="loadingBalance" class="loading">Loading...</div>
          <div v-else-if="accountBalance" class="balance-info">
            <!-- Top 5 non-zero balances in bubbles -->
            <div class="balance-bubbles">
              <div v-for="balance in topBalances" :key="balance.currency" class="balance-bubble">
                <span class="currency">{{ balance.currency }}</span>
                <span class="amount">{{ formatNumber(balance.amount) }}</span>
              </div>
            </div>
            
            <!-- Toggle button for remaining balances -->
            <button v-if="hasMoreBalances" 
                    @click="showAllBalances = !showAllBalances" 
                    class="toggle-button">
              {{ showAllBalances ? 'Show Less ▲' : `Show More (${remainingBalancesCount}) ▼` }}
            </button>

            <!-- Remaining balances in list format -->
            <div v-if="showAllBalances" class="remaining-balances">
              <div v-for="balance in remainingBalances" 
                   :key="balance.currency" 
                   class="balance-row">
                <span class="currency">{{ balance.currency }}</span>
                <span class="amount">{{ formatNumber(balance.amount) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- BTC/USD Ticker Card -->
        <div class="card">
          <h3>BTC/USD Ticker</h3>
          <div v-if="tickerError" class="error-message">{{ tickerError }}</div>
          <div v-else-if="loadingTicker" class="loading">Loading...</div>
          <div v-else-if="ticker" class="ticker-info">
            <div class="ticker-row">
              <span class="label">Last Price:</span>
              <span class="value">${{ formatNumber(ticker.lastPrice) }}</span>
            </div>
            <div class="ticker-row">
              <span class="label">24h Volume:</span>
              <span class="value">{{ formatNumber(ticker.volume) }} BTC</span>
            </div>
            <div class="ticker-row">
              <span class="label">24h High:</span>
              <span class="value">${{ formatNumber(ticker.high) }}</span>
            </div>
            <div class="ticker-row">
              <span class="label">24h Low:</span>
              <span class="value">${{ formatNumber(ticker.low) }}</span>
            </div>
          </div>
        </div>

        <!-- Open Orders Card -->
        <div class="card">
          <h3>Open Orders</h3>
          <div v-if="ordersError" class="error-message">{{ ordersError }}</div>
          <div v-else-if="loadingOrders" class="loading">Loading...</div>
          <div v-else-if="!orders?.open || Object.keys(orders.open).length === 0" class="no-orders">No open orders</div>
          <div v-else class="orders-list">
            <div v-for="(order, orderId) in orders.open" :key="orderId" class="order-item">
              <div class="order-row">
                <span class="label">Order ID:</span>
                <span class="value">{{ orderId }}</span>
              </div>
              <div class="order-row">
                <span class="label">Type:</span>
                <span class="value">{{ order.descr.type }} {{ order.descr.ordertype }}</span>
              </div>
              <div class="order-row">
                <span class="label">Price:</span>
                <span class="value">${{ formatNumber(order.descr.price) }}</span>
              </div>
              <div class="order-row">
                <span class="label">Volume:</span>
                <span class="value">{{ formatNumber(order.vol) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Futures Trading Section -->
    <div class="futures-section">
      <h2>Futures Trading</h2>
      <KrakenFuturesPositions />
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import KrakenFuturesPositions from './KrakenFuturesPositions.vue';

export default {
  name: 'KrakenTest',
  components: {
    KrakenFuturesPositions
  },
  setup() {
    const accountBalance = ref(null);
    const loadingBalance = ref(false);
    const balanceError = ref(null);
    const showAllBalances = ref(false);

    const ticker = ref(null);
    const tickerError = ref(null);
    const loadingTicker = ref(false);

    const orders = ref(null);
    const ordersError = ref(null);
    const loadingOrders = ref(false);

    // Computed properties for balance display
    const topBalances = computed(() => {
      if (!accountBalance.value) return [];
      
      // Convert balance object to array and sort by amount
      const balanceArray = Object.entries(accountBalance.value)
        .map(([currency, amount]) => ({ 
          currency, 
          amount: parseFloat(amount) 
        }))
        .filter(balance => balance.amount > 0)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      return balanceArray;
    });

    const remainingBalances = computed(() => {
      if (!accountBalance.value) return [];
      
      // Get all non-zero balances after the top 5
      return Object.entries(accountBalance.value)
        .map(([currency, amount]) => ({ 
          currency, 
          amount: parseFloat(amount) 
        }))
        .filter(balance => balance.amount > 0)
        .sort((a, b) => b.amount - a.amount)
        .slice(5);
    });

    const hasMoreBalances = computed(() => {
      return remainingBalances.value.length > 0;
    });

    const remainingBalancesCount = computed(() => {
      return remainingBalances.value.length;
    });

    const fetchData = async () => {
      await Promise.all([
        fetchBalance(),
        fetchTicker(),
        fetchOrders()
      ]);
    };

    const fetchBalance = async () => {
      loadingBalance.value = true;
      balanceError.value = null;
      try {
        const response = await axios.post('/api/kraken/balance');
        accountBalance.value = response.data.result;
      } catch (error) {
        balanceError.value = error.message;
      } finally {
        loadingBalance.value = false;
      }
    };

    const fetchTicker = async () => {
      loadingTicker.value = true;
      tickerError.value = null;
      try {
        const response = await axios.get('/api/kraken/public/ticker?pair=XBT/USD');
        const result = response.data.result['XXBTZUSD'];
        ticker.value = {
          lastPrice: parseFloat(result.c[0]),
          volume: parseFloat(result.v[1]),
          high: parseFloat(result.h[1]),
          low: parseFloat(result.l[1])
        };
      } catch (error) {
        tickerError.value = error.message;
      } finally {
        loadingTicker.value = false;
      }
    };

    const fetchOrders = async () => {
      loadingOrders.value = true;
      ordersError.value = null;
      try {
        const response = await axios.post('/api/kraken/openOrders');
        orders.value = response.data.result;
      } catch (error) {
        ordersError.value = error.message;
      } finally {
        loadingOrders.value = false;
      }
    };

    const formatNumber = (value) => {
      if (!value) return '0';
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8
      }).format(value);
    };

    onMounted(() => {
      fetchData();
    });

    return {
      accountBalance,
      balanceError,
      loadingBalance,
      showAllBalances,
      topBalances,
      remainingBalances,
      hasMoreBalances,
      remainingBalancesCount,
      ticker,
      tickerError,
      loadingTicker,
      orders,
      ordersError,
      loadingOrders,
      formatNumber
    };
  }
};
</script>

<style scoped>
.kraken-test {
  padding: 20px;
  max-width: 1400px;
  margin: 80px auto 0;
  background: #1a1a1a;
  min-height: calc(100vh - 80px);
  color: #e0e0e0;
}

h2 {
  color: #4a9eff;
  margin-bottom: 20px;
  font-size: 1.5em;
}

.spot-trading-section {
  margin-bottom: 30px;
}

.spot-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.card {
  background: #252525;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  border: 1px solid #3d3d3d;
  height: 100%;
  min-height: 200px;
  overflow: auto;
}

.card h3 {
  color: #4a9eff;
  margin: 0 0 16px 0;
  font-size: 1.2em;
}

.balance-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.balance-bubbles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.balance-bubble {
  background: #2d2d2d;
  border-radius: 12px;
  padding: 12px;
  text-align: center;
  border: 1px solid #3d3d3d;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s, box-shadow 0.2s;
}

.balance-bubble:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.balance-bubble .currency {
  display: block;
  color: #4a9eff;
  font-weight: 600;
  font-size: 0.9em;
  margin-bottom: 4px;
}

.balance-bubble .amount {
  display: block;
  color: #e0e0e0;
  font-weight: 500;
  font-size: 0.9em;
}

.toggle-button {
  background: #2d2d2d;
  border: 1px solid #3d3d3d;
  color: #4a9eff;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.2s;
  width: 100%;
}

.toggle-button:hover {
  background: #353535;
}

.remaining-balances {
  display: grid;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #3d3d3d;
}

.remaining-balances .balance-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  background: #2d2d2d;
  border-radius: 6px;
}

.ticker-info, .orders-list {
  display: grid;
  gap: 8px;
}

.ticker-row, .order-row {
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

.loading {
  text-align: center;
  padding: 20px;
  color: #888;
}

.error-message {
  color: #ff4842;
  padding: 12px;
  background: rgba(255, 72, 66, 0.2);
  border-radius: 6px;
  margin-top: 8px;
  border: 1px solid rgba(255, 72, 66, 0.5);
}

.no-orders {
  text-align: center;
  color: #888;
  padding: 20px;
}

.order-item {
  background: #2d2d2d;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
}

.order-item:last-child {
  margin-bottom: 0;
}

/* Responsive layout */
@media (max-width: 1200px) {
  .spot-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .spot-cards {
    grid-template-columns: 1fr;
  }
  
  .kraken-test {
    padding: 12px;
  }
}
</style>
