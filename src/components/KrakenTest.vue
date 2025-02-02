<template>
  <div class="kraken-test">
    <h2>Kraken API Test</h2>
    
    <div class="test-section">
      <h3>Account Balance</h3>
      <button @click="testBalance" :disabled="loadingBalance">
        {{ loadingBalance ? 'Loading...' : 'Test Balance' }}
      </button>
      <pre v-if="balance">{{ JSON.stringify(balance, null, 2) }}</pre>
      <div v-if="balanceError" class="error">{{ balanceError }}</div>
    </div>

    <div class="test-section">
      <h3>BTC/USD Ticker</h3>
      <button @click="testTicker" :disabled="loadingTicker">
        {{ loadingTicker ? 'Loading...' : 'Test Ticker' }}
      </button>
      <pre v-if="ticker">{{ JSON.stringify(ticker, null, 2) }}</pre>
      <div v-if="tickerError" class="error">{{ tickerError }}</div>
    </div>

    <div class="test-section">
      <h3>Open Orders</h3>
      <button @click="testOrders" :disabled="loadingOrders">
        {{ loadingOrders ? 'Loading...' : 'Test Orders' }}
      </button>
      <pre v-if="orders">{{ JSON.stringify(orders, null, 2) }}</pre>
      <div v-if="ordersError" class="error">{{ ordersError }}</div>
    </div>

    <div class="test-section">
      <h3>Futures Trading</h3>
      <button @click="getFuturesPositions" :disabled="loadingFuturesPositions">
        {{ loadingFuturesPositions ? 'Loading...' : 'Get Futures Positions' }}
      </button>
      <button @click="getFuturesTickers" :disabled="loadingFuturesTickers">
        {{ loadingFuturesTickers ? 'Loading...' : 'Get Futures Tickers' }}
      </button>
      <button @click="getFuturesAccounts" :disabled="loadingFuturesAccounts">
        {{ loadingFuturesAccounts ? 'Loading...' : 'Get Futures Accounts' }}
      </button>
      <button @click="getFuturesOrders" :disabled="loadingFuturesOrders">
        {{ loadingFuturesOrders ? 'Loading...' : 'Get Futures Orders' }}
      </button>
      <pre v-if="futuresPositions">{{ JSON.stringify(futuresPositions, null, 2) }}</pre>
      <pre v-if="futuresTickers">{{ JSON.stringify(futuresTickers, null, 2) }}</pre>
      <pre v-if="futuresAccounts">{{ JSON.stringify(futuresAccounts, null, 2) }}</pre>
      <pre v-if="futuresOrders">{{ JSON.stringify(futuresOrders, null, 2) }}</pre>
      <div v-if="futuresPositionsError" class="error">{{ futuresPositionsError }}</div>
      <div v-if="futuresTickersError" class="error">{{ futuresTickersError }}</div>
      <div v-if="futuresAccountsError" class="error">{{ futuresAccountsError }}</div>
      <div v-if="futuresOrdersError" class="error">{{ futuresOrdersError }}</div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import krakenApi from '@/services/krakenProxy';
import axios from 'axios';

export default {
  name: 'KrakenTest',
  setup() {
    const balance = ref(null);
    const balanceError = ref(null);
    const loadingBalance = ref(false);

    const ticker = ref(null);
    const tickerError = ref(null);
    const loadingTicker = ref(false);

    const orders = ref(null);
    const ordersError = ref(null);
    const loadingOrders = ref(false);

    const futuresPositions = ref(null);
    const futuresPositionsError = ref(null);
    const loadingFuturesPositions = ref(false);

    const futuresTickers = ref(null);
    const futuresTickersError = ref(null);
    const loadingFuturesTickers = ref(false);

    const futuresAccounts = ref(null);
    const futuresAccountsError = ref(null);
    const loadingFuturesAccounts = ref(false);

    const futuresOrders = ref(null);
    const futuresOrdersError = ref(null);
    const loadingFuturesOrders = ref(false);

    const testBalance = async () => {
      loadingBalance.value = true;
      balanceError.value = null;
      try {
        balance.value = await krakenApi.getBalance();
      } catch (error) {
        balanceError.value = error.message;
      } finally {
        loadingBalance.value = false;
      }
    };

    const testTicker = async () => {
      loadingTicker.value = true;
      tickerError.value = null;
      try {
        const result = await krakenApi.getTicker('XBT/USD');
        ticker.value = result;
      } catch (error) {
        tickerError.value = error.message;
      } finally {
        loadingTicker.value = false;
      }
    };

    const testOrders = async () => {
      loadingOrders.value = true;
      ordersError.value = null;
      try {
        orders.value = await krakenApi.getOpenOrders();
      } catch (error) {
        ordersError.value = error.message;
      } finally {
        loadingOrders.value = false;
      }
    };

    const getFuturesPositions = async () => {
      loadingFuturesPositions.value = true;
      futuresPositionsError.value = null;
      try {
        const response = await axios.get('/api/kraken/futures/positions');
        futuresPositions.value = response.data;
      } catch (error) {
        futuresPositionsError.value = error.message;
      } finally {
        loadingFuturesPositions.value = false;
      }
    };

    const getFuturesTickers = async () => {
      loadingFuturesTickers.value = true;
      futuresTickersError.value = null;
      try {
        const response = await axios.get('/api/kraken/futures/tickers');
        futuresTickers.value = response.data;
      } catch (error) {
        futuresTickersError.value = error.message;
      } finally {
        loadingFuturesTickers.value = false;
      }
    };

    const getFuturesAccounts = async () => {
      loadingFuturesAccounts.value = true;
      futuresAccountsError.value = null;
      try {
        const response = await axios.get('/api/kraken/futures/accounts');
        futuresAccounts.value = response.data;
      } catch (error) {
        futuresAccountsError.value = error.message;
      } finally {
        loadingFuturesAccounts.value = false;
      }
    };

    const getFuturesOrders = async () => {
      loadingFuturesOrders.value = true;
      futuresOrdersError.value = null;
      try {
        const response = await axios.get('/api/kraken/futures/openorders');
        futuresOrders.value = response.data;
      } catch (error) {
        futuresOrdersError.value = error.message;
      } finally {
        loadingFuturesOrders.value = false;
      }
    };

    return {
      balance,
      balanceError,
      loadingBalance,
      testBalance,
      ticker,
      tickerError,
      loadingTicker,
      testTicker,
      orders,
      ordersError,
      loadingOrders,
      testOrders,
      futuresPositions,
      futuresPositionsError,
      loadingFuturesPositions,
      getFuturesPositions,
      futuresTickers,
      futuresTickersError,
      loadingFuturesTickers,
      getFuturesTickers,
      futuresAccounts,
      futuresAccountsError,
      loadingFuturesAccounts,
      getFuturesAccounts,
      futuresOrders,
      futuresOrdersError,
      loadingFuturesOrders,
      getFuturesOrders
    };
  }
};
</script>

<style scoped>
.kraken-test {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.test-section {
  background: #2c3e50;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

button {
  background: #3498db;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 10px;
}

button:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

pre {
  background: #34495e;
  padding: 10px;
  border-radius: 4px;
  color: #ecf0f1;
  overflow-x: auto;
}

.error {
  color: #e74c3c;
  margin-top: 10px;
  padding: 10px;
  background: rgba(231, 76, 60, 0.1);
  border-radius: 4px;
}
</style>
