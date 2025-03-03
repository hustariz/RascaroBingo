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
        <div class="kraken-card">
          <h3>Account Balance</h3>
          <div v-if="balanceError" class="kraken-error-message">{{ balanceError }}</div>
          <div v-else-if="loadingBalance" class="kraken-loading">Loading...</div>
          <div v-else-if="accountBalance" class="kraken-balance-info">
            <!-- Top 5 non-zero balances in bubbles -->
            <div class="kraken-balance-bubbles">
              <div v-for="balance in topBalances" :key="balance.currency" class="kraken-balance-bubble">
                <span class="kraken-currency">{{ balance.currency }}</span>
                <span class="kraken-amount">{{ formatNumber(balance.amount) }}</span>
              </div>
            </div>
            
            <!-- Toggle button for remaining balances -->
            <button v-if="hasMoreBalances" 
                    @click="showAllBalances = !showAllBalances" 
                    class="kraken-toggle-button">
              {{ showAllBalances ? 'Show Less ▲' : `Show More (${remainingBalancesCount}) ▼` }}
            </button>

            <!-- Remaining balances in list format -->
            <div v-if="showAllBalances" class="kraken-remaining-balances">
              <div v-for="balance in remainingBalances" 
                   :key="balance.currency" 
                   class="kraken-balance-row">
                <span class="kraken-currency">{{ balance.currency }}</span>
                <span class="kraken-amount">{{ formatNumber(balance.amount) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- BTC/USD Ticker Card -->
        <div class="kraken-card">
          <h3>BTC/USD Ticker</h3>
          <div v-if="tickerError" class="kraken-error-message">{{ tickerError }}</div>
          <div v-else-if="loadingTicker" class="kraken-loading">Loading...</div>
          <div v-else-if="ticker" class="kraken-ticker-info">
            <div class="kraken-ticker-row">
              <span class="kraken-label">Last Price:</span>
              <span class="kraken-value">${{ formatNumber(ticker.lastPrice) }}</span>
            </div>
            <div class="kraken-ticker-row">
              <span class="kraken-label">24h Volume:</span>
              <span class="kraken-value">{{ formatNumber(ticker.volume) }} BTC</span>
            </div>
            <div class="kraken-ticker-row">
              <span class="kraken-label">24h High:</span>
              <span class="kraken-value">${{ formatNumber(ticker.high) }}</span>
            </div>
            <div class="kraken-ticker-row">
              <span class="kraken-label">24h Low:</span>
              <span class="kraken-value">${{ formatNumber(ticker.low) }}</span>
            </div>
          </div>
        </div>

        <!-- Open Orders Card -->
        <div class="kraken-card">
          <h3>Open Orders</h3>
          <div v-if="ordersError" class="kraken-error-message">{{ ordersError }}</div>
          <div v-else-if="loadingOrders" class="kraken-loading">Loading...</div>
          <div v-else-if="!orders?.open || Object.keys(orders.open).length === 0" class="kraken-no-orders">No open orders</div>
          <div v-else class="kraken-orders-list">
            <div v-for="(order, orderId) in orders.open" :key="orderId" class="kraken-order-item">
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
        <KrakenTrade @trade-placed="handleTradePlaced" />
        <div class="kraken-futures-data">
          <KrakenFuturesBalance 
            ref="futuresBalanceRef"
            :account-balance="accountBalance"
            :loading="loadingBalance"
            :error="balanceError"
          />
          <KrakenFuturesPositions 
            ref="futuresPositionsRef"
            :positions="positions"
            :loading="loadingPositions"
            :error="positionsError"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import KrakenFuturesPositions from './KrakenFuturesPositions.vue';
import KrakenFuturesBalance from './KrakenFuturesBalance.vue';
import KrakenTrade from './KrakenTrade.vue';

export default {
  name: 'KrakenTest',
  components: {
    KrakenFuturesPositions,
    KrakenFuturesBalance,
    KrakenTrade
  },

  setup() {
    const accountBalance = ref(null);
    const balanceError = ref(null);
    const loadingBalance = ref(false);
    const positions = ref([]);
    const positionsError = ref(null);
    const loadingPositions = ref(false);
    const futuresPositionsRef = ref(null);
    const ticker = ref(null);
    const tickerError = ref(null);
    const loadingTicker = ref(false);
    const orders = ref(null);
    const ordersError = ref(null);
    const loadingOrders = ref(false);
    const showAllBalances = ref(false);

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
      fetchData();
    };

    const fetchData = async () => {
      // Fetch spot balance
      loadingBalance.value = true;
      try {
        const balanceResponse = await axios.post('/api/kraken/balance');
        accountBalance.value = balanceResponse.data.result;
        balanceError.value = null;
      } catch (error) {
        balanceError.value = error.response?.data?.error || 'Failed to fetch balance';
        console.error('Balance error:', error);
      } finally {
        loadingBalance.value = false;
      }

      // Fetch BTC/USD ticker
      loadingTicker.value = true;
      try {
        const tickerResponse = await axios.get('/api/kraken/public/ticker?pair=BTC/USD');
        const tickerData = tickerResponse.data.result.XXBTZUSD;
        ticker.value = {
          lastPrice: tickerData.c[0],
          volume: tickerData.v[1],
          high: tickerData.h[1],
          low: tickerData.l[1]
        };
        tickerError.value = null;
      } catch (error) {
        tickerError.value = error.response?.data?.error || 'Failed to fetch ticker';
        console.error('Ticker error:', error);
      } finally {
        loadingTicker.value = false;
      }

      // Fetch open orders
      loadingOrders.value = true;
      try {
        const ordersResponse = await axios.post('/api/kraken/openOrders');
        orders.value = ordersResponse.data.result;
        ordersError.value = null;
      } catch (error) {
        ordersError.value = error.response?.data?.error || 'Failed to fetch orders';
        console.error('Orders error:', error);
      } finally {
        loadingOrders.value = false;
      }

      // Fetch futures positions
      loadingPositions.value = true;
      try {
        const positionsResponse = await axios.get('/api/kraken/futures/positions');
        positions.value = positionsResponse.data;
        positionsError.value = null;
      } catch (error) {
        positionsError.value = error.response?.data?.error || 'Failed to fetch positions';
        console.error('Positions error:', error);
      } finally {
        loadingPositions.value = false;
      }
    };

    onMounted(() => {
      fetchData();
    });

    return {
      accountBalance,
      balanceError,
      loadingBalance,
      positions,
      positionsError,
      loadingPositions,
      futuresPositionsRef,
      handleTradePlaced,
      ticker,
      tickerError,
      loadingTicker,
      orders,
      ordersError,
      loadingOrders,
      showAllBalances,
      topBalances,
      remainingBalances,
      hasMoreBalances,
      remainingBalancesCount,
      fetchData,
      formatNumber
    };
  }
};
</script>

<style scoped>
@import '@/assets/styles/kraken/KrakenTest.css';

.kraken-futures-trading-container {
  display: flex;
  gap: 20px;
}

.kraken-futures-data {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
