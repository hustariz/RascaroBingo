<template>
  <div class="kraken-test">
    <!-- Spot Trading Section -->
    <div class="kraken-spot-trading-section">
      <div class="kraken-section-header">
        <h2>Spot Trading</h2>
        <button @click="refreshData" class="kraken-refresh-button">
          <span class="kraken-refresh-icon">↻</span> Refresh Data
        </button>
      </div>
      
      <div class="kraken-spot-cards">
        <!-- Account Balance Card -->
        <div class="kraken-card balance-card">
          <h3>Account Balance</h3>
          <div class="balance-grid">
            <template v-for="(balance, currency) in accountBalance" :key="currency">
              <div class="balance-item" :class="{ 'zero-balance': parseFloat(balance) === 0 }">
                <div class="asset-name">{{ currency }}</div>
                <div class="asset-balance">{{ formatNumber(balance) }}</div>
              </div>
            </template>
          </div>
        </div>

        <!-- BTC/USD Ticker Card -->
        <div class="kraken-card">
          <h3>BTC/USD Ticker</h3>
          <div class="kraken-ticker-info">
            <div class="kraken-ticker-row">
              <span class="kraken-label">Last Price:</span>
              <span class="kraken-value">${{ formatNumber(marketData?.c?.[0] || '0.00') }}</span>
            </div>
            <div class="kraken-ticker-row">
              <span class="kraken-label">24h Volume:</span>
              <span class="kraken-value">{{ formatNumber(marketData?.v?.[1] || '0.00') }} BTC</span>
            </div>
            <div class="kraken-ticker-row">
              <span class="kraken-label">24h High:</span>
              <span class="kraken-value">${{ formatNumber(marketData?.h?.[1] || '0.00') }}</span>
            </div>
            <div class="kraken-ticker-row">
              <span class="kraken-label">24h Low:</span>
              <span class="kraken-value">${{ formatNumber(marketData?.l?.[1] || '0.00') }}</span>
            </div>
          </div>
        </div>

        <!-- Open Orders Card -->
        <div class="kraken-card">
          <h3>Open Orders</h3>
          <div v-if="!openOrders || Object.keys(openOrders).length === 0" class="kraken-no-orders">No open orders</div>
          <div v-else class="kraken-orders-list">
            <div v-for="(order, orderId) in openOrders" :key="orderId" class="kraken-order-item">
              <div class="kraken-order-row">
                <span class="kraken-label">Order ID:</span>
                <span class="kraken-value">{{ orderId }}</span>
              </div>
              <div class="kraken-order-row">
                <span class="kraken-label">Type:</span>
                <span class="kraken-value">{{ order.descr.type }} {{ order.descr.ordertype }}</span>
              </div>
              <div class="kraken-order-row">
                <span class="kraken-label">Price:</span>
                <span class="kraken-value">${{ formatNumber(order.descr.price) }}</span>
              </div>
              <div class="kraken-order-row">
                <span class="kraken-label">Volume:</span>
                <span class="kraken-value">{{ formatNumber(order.vol) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Futures Trading Section -->
    <div class="kraken-futures-trading-section">
      <div class="kraken-section-header">
        <h2>Futures Trading</h2>
      </div>
      
      <div class="kraken-futures-trading-container">
        <div class="kraken-trade-form-container">
          <KrakenTrade @trade-placed="handleTradePlaced" />
        </div>
        <div class="kraken-positions-container">
          <KrakenFuturesPositions />
        </div>
        <div class="kraken-futures-data">
          <KrakenFuturesBalance 
            ref="futuresBalanceRef"
            :account-balance="accountBalance"
            :error="balanceError"
          />
          <KrakenFuturesOrders 
            ref="futuresOrdersRef"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import axios from 'axios';
import KrakenFuturesBalance from './KrakenFuturesBalance.vue';
import KrakenFuturesOrders from './KrakenFuturesOrders.vue';
import KrakenTrade from './KrakenTrade.vue';
import KrakenFuturesPositions from './KrakenFuturesPositions.vue';

export default {
  name: 'KrakenTest',
  components: {
    KrakenFuturesBalance,
    KrakenFuturesOrders,
    KrakenTrade,
    KrakenFuturesPositions
  },

  setup() {
    const accountBalance = ref(null);
    const balanceError = ref(null);
    const marketData = ref(null);
    const marketError = ref(null);
    const openOrders = ref(null);
    const ordersError = ref(null);
    const showAllBalances = ref(false);
    const refreshInterval = 5000;
    const refreshIntervalId = ref(null);

    const formatNumber = (value) => {
      if (value === undefined || value === null) return '0';
      
      // Convert to number if it's a string
      const num = typeof value === 'string' ? parseFloat(value) : value;
      
      // Handle different ranges
      if (Math.abs(num) >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
      } else if (Math.abs(num) >= 1000) {
        return (num / 1000).toFixed(2) + 'K';
      } else if (Math.abs(num) < 0.01) {
        return num.toFixed(8);
      } else {
        return num.toFixed(2);
      }
    };

    const topBalances = computed(() => {
      if (!accountBalance.value) return [];
      return Object.keys(accountBalance.value).slice(0, 5).map(currency => ({
        currency,
        amount: accountBalance.value[currency]
      }));
    });

    const remainingBalances = computed(() => {
      if (!accountBalance.value) return [];
      return Object.keys(accountBalance.value).slice(5).map(currency => ({
        currency,
        amount: accountBalance.value[currency]
      }));
    });

    const hasMoreBalances = computed(() => remainingBalances.value.length > 0);

    const remainingBalancesCount = computed(() => remainingBalances.value.length);

    const handleTradePlaced = () => {
      // Refresh positions and balance after trade
      fetchBalance();
      fetchOpenOrders();
    };

    const fetchBalance = async () => {
      balanceError.value = null;
      
      try {
        const response = await axios.post('/api/kraken/balance');
        if (response.data?.result) {
          accountBalance.value = response.data.result;
        }
      } catch (error) {
        console.log('Balance error:', error);
        balanceError.value = error.message;
        // Keep showing old balance data if available
      }
    };

    const fetchMarketData = async () => {
      marketError.value = null;

      try {
        const response = await axios.get(`/api/kraken/public/ticker?pair=XBT/USD`);
        if (response.data?.result?.XXBTZUSD) {
          marketData.value = response.data.result.XXBTZUSD;
        }
      } catch (error) {
        console.log('Market data error:', error);
        marketError.value = error.message;
        // Keep showing old market data if available
      }
    };

    const fetchOpenOrders = async () => {
      ordersError.value = null;

      try {
        const response = await axios.post('/api/kraken/openOrders');
        if (response.data?.result?.open) {
          openOrders.value = response.data.result.open;
        }
      } catch (error) {
        console.log('Open orders error:', error);
        ordersError.value = error.message;
        // Keep showing old orders if available
      }
    };

    const startAutoRefresh = () => {
      if (refreshIntervalId.value) return;
      
      refreshIntervalId.value = setInterval(() => {
        // Stagger the requests to avoid overwhelming the API
        fetchMarketData();
        setTimeout(() => fetchBalance(), 1000);
        setTimeout(() => fetchOpenOrders(), 2000);
      }, refreshInterval);
    };

    // Initial data fetch
    onMounted(() => {
      fetchMarketData();
      setTimeout(() => fetchBalance(), 1000);
      setTimeout(() => fetchOpenOrders(), 2000);
      startAutoRefresh();
    });

    // Clean up interval on component unmount
    onUnmounted(() => {
      if (refreshIntervalId.value) {
        clearInterval(refreshIntervalId.value);
      }
    });

    return {
      accountBalance,
      balanceError,
      handleTradePlaced,
      marketData,
      marketError,
      openOrders,
      ordersError,
      showAllBalances,
      topBalances,
      remainingBalances,
      hasMoreBalances,
      remainingBalancesCount,
      fetchBalance,
      fetchMarketData,
      fetchOpenOrders,
      formatNumber
    };
  }
};
</script>

<style scoped>
@import '@/assets/styles/kraken/KrakenTest.css';

.balance-card {
  background: #1a1a1a !important;
  border: 1px solid #333 !important;
}

.balance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.balance-item {
  background: #2a2a2a;
  border-radius: 4px;
  padding: 8px;
  transition: all 0.2s ease;
}

.balance-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.asset-name {
  color: #888;
  font-size: 0.8em;
  margin-bottom: 3px;
}

.asset-balance {
  color: #fff;
  font-size: 0.95em;
  font-weight: 500;
}

.kraken-futures-trading-container {
  display: grid;
  grid-template-columns: minmax(300px, 1fr) minmax(400px, 1.2fr) minmax(250px, 0.8fr);
  gap: 20px;
  margin-top: 20px;
}

.kraken-futures-data {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.kraken-trade-form-container,
.kraken-positions-container {
  min-width: 0;
}

@media (max-width: 1400px) {
  .kraken-futures-trading-container {
    grid-template-columns: 1fr;
  }
}

.zero-balance {
  opacity: 0.5;
}

.zero-balance:hover {
  opacity: 1;
}
</style>
