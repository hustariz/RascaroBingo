<template>
  <div class="hyperliquid-test">
    <h1>Hyperliquid API Test</h1>
    
    <div class="test-sections">
      <!-- Connection Test Section -->
      <div class="test-section">
        <h2>Connection Test</h2>
        <div class="test-controls">
          <button @click="testConnection" :disabled="loading.connection">
            Test Connection
          </button>
          <div v-if="loading.connection" class="loading">Testing connection...</div>
          <div v-if="results.connection" :class="['result', results.connection.success ? 'success' : 'error']">
            {{ results.connection.message }}
          </div>
        </div>
      </div>

      <!-- Market Data Section -->
      <div class="test-section">
        <h2>Market Data</h2>
        <div class="test-controls">
          <button @click="fetchMarkets" :disabled="loading.markets">
            Fetch Markets
          </button>
          <div v-if="loading.markets" class="loading">Loading markets...</div>
          <div v-if="results.markets && results.markets.error" class="error">
            {{ results.markets.error }}
          </div>
        </div>
        <div v-if="results.markets && results.markets.data" class="data-display">
          <h3>Available Markets</h3>
          <div class="data-table">
            <table v-if="results.markets.data.length">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Price</th>
                  <th>24h Change</th>
                  <th>24h Volume</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="market in results.markets.data" :key="market.symbol">
                  <td>{{ market.symbol }}</td>
                  <td>{{ market.price }}</td>
                  <td :class="market.change24h >= 0 ? 'positive' : 'negative'">
                    {{ market.change24h }}%
                  </td>
                  <td>{{ market.volume24h }}</td>
                </tr>
              </tbody>
            </table>
            <div v-else class="placeholder-data">
              <p>Market data will appear here</p>
              <pre>{{ JSON.stringify(results.markets.data, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- Account Information Section -->
      <div class="test-section">
        <h2>Account Information</h2>
        <div class="test-controls">
          <button @click="fetchAccountInfo" :disabled="loading.account">
            Fetch Account Info
          </button>
          <div v-if="loading.account" class="loading">Loading account info...</div>
          <div v-if="results.account && results.account.error" class="error">
            {{ results.account.error }}
          </div>
        </div>
        <div v-if="results.account && results.account.data" class="data-display">
          <h3>Account Details</h3>
          <div class="data-table">
            <div class="placeholder-data">
              <pre>{{ JSON.stringify(results.account.data, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- Positions Section -->
      <div class="test-section">
        <h2>Positions</h2>
        <div class="test-controls">
          <button @click="fetchPositions" :disabled="loading.positions">
            Fetch Positions
          </button>
          <div v-if="loading.positions" class="loading">Loading positions...</div>
          <div v-if="results.positions && results.positions.error" class="error">
            {{ results.positions.error }}
          </div>
        </div>
        <div v-if="results.positions && results.positions.data" class="data-display">
          <h3>Open Positions</h3>
          <div class="data-table">
            <table v-if="results.positions.data.length">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Size</th>
                  <th>Entry Price</th>
                  <th>Current Price</th>
                  <th>PnL</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="position in results.positions.data" :key="position.symbol">
                  <td>{{ position.symbol }}</td>
                  <td>{{ position.size }}</td>
                  <td>{{ position.entryPrice }}</td>
                  <td>{{ position.currentPrice }}</td>
                  <td :class="position.pnl >= 0 ? 'positive' : 'negative'">
                    {{ position.pnl }}
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="placeholder-data">
              <p>Position data will appear here</p>
              <pre>{{ JSON.stringify(results.positions.data, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- Order Placement Test Section -->
      <div class="test-section">
        <h2>Order Placement</h2>
        <div class="test-controls">
          <form @submit.prevent="placeTestOrder" class="order-form">
            <div class="form-group">
              <label for="symbol">Symbol</label>
              <select id="symbol" v-model="orderForm.symbol" required>
                <option value="">Select Symbol</option>
                <option value="ETH-USD">ETH-USD</option>
                <option value="BTC-USD">BTC-USD</option>
                <option value="SOL-USD">SOL-USD</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="side">Side</label>
              <select id="side" v-model="orderForm.side" required>
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="type">Order Type</label>
              <select id="type" v-model="orderForm.type" required>
                <option value="market">Market</option>
                <option value="limit">Limit</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="size">Size</label>
              <input 
                id="size" 
                type="number" 
                v-model="orderForm.size" 
                step="0.001" 
                min="0.001" 
                required
              />
            </div>
            
            <div class="form-group" v-if="orderForm.type === 'limit'">
              <label for="price">Price</label>
              <input 
                id="price" 
                type="number" 
                v-model="orderForm.price" 
                step="0.01" 
                min="0.01"
                :required="orderForm.type === 'limit'"
              />
            </div>
            
            <button type="submit" :disabled="loading.order">Place Test Order</button>
          </form>
          
          <div v-if="loading.order" class="loading">Placing order...</div>
          <div v-if="results.order" :class="['result', results.order.success ? 'success' : 'error']">
            {{ results.order.message }}
            <pre v-if="results.order.data">{{ JSON.stringify(results.order.data, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import hyperliquidApi from '@/services/hyperliquidApi';

export default {
  name: 'HyperliquidTest',
  data() {
    return {
      loading: {
        connection: false,
        markets: false,
        account: false,
        positions: false,
        order: false
      },
      results: {
        connection: null,
        markets: null,
        account: null,
        positions: null,
        order: null
      },
      orderForm: {
        symbol: '',
        side: 'buy',
        type: 'market',
        size: 0.01,
        price: null
      }
    };
  },
  methods: {
    async testConnection() {
      this.loading.connection = true;
      this.results.connection = null;
      
      try {
        const response = await hyperliquidApi.testConnection();
        
        this.results.connection = {
          success: response.success,
          message: response.message,
          data: response.data
        };
      } catch (error) {
        this.results.connection = {
          success: false,
          message: `Connection failed: ${error.response?.data?.error || error.message || 'Unknown error'}`
        };
      } finally {
        this.loading.connection = false;
      }
    },
    
    async fetchMarkets() {
      this.loading.markets = true;
      this.results.markets = null;
      
      try {
        const data = await hyperliquidApi.getMarkets();
        this.results.markets = { data };
      } catch (error) {
        this.results.markets = {
          error: `Failed to fetch markets: ${error.response?.data?.error || error.message || 'Unknown error'}`
        };
      } finally {
        this.loading.markets = false;
      }
    },
    
    async fetchAccountInfo() {
      this.loading.account = true;
      this.results.account = null;
      
      try {
        const data = await hyperliquidApi.getAccountInfo();
        this.results.account = { data };
      } catch (error) {
        this.results.account = {
          error: `Failed to fetch account info: ${error.response?.data?.error || error.message || 'Unknown error'}`
        };
      } finally {
        this.loading.account = false;
      }
    },
    
    async fetchPositions() {
      this.loading.positions = true;
      this.results.positions = null;
      
      try {
        const data = await hyperliquidApi.getPositions();
        this.results.positions = { data };
      } catch (error) {
        this.results.positions = {
          error: `Failed to fetch positions: ${error.response?.data?.error || error.message || 'Unknown error'}`
        };
      } finally {
        this.loading.positions = false;
      }
    },
    
    async placeTestOrder() {
      this.loading.order = true;
      this.results.order = null;
      
      try {
        const data = await hyperliquidApi.placeOrder(this.orderForm);
        
        this.results.order = {
          success: true,
          message: 'Order placed successfully',
          data
        };
      } catch (error) {
        this.results.order = {
          success: false,
          message: `Failed to place order: ${error.response?.data?.error || error.message || 'Unknown error'}`
        };
      } finally {
        this.loading.order = false;
      }
    }
  }
};
</script>

<style scoped>
.hyperliquid-test {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background-color: #1a1a1a;
  color: #e0e0e0;
  min-height: 100vh;
}

h1 {
  font-size: 28px;
  margin-bottom: 30px;
  color: #4caf50;
  text-align: center;
}

h2 {
  font-size: 20px;
  margin-bottom: 15px;
  color: #e0e0e0;
  border-bottom: 1px solid #333;
  padding-bottom: 8px;
}

h3 {
  font-size: 18px;
  margin: 15px 0;
  color: #bdbdbd;
}

.test-sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 25px;
}

.test-section {
  background-color: #2a2a2a;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.test-controls {
  margin-bottom: 15px;
}

button {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
}

button:hover:not(:disabled) {
  background-color: #45a049;
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.5);
}

button:disabled {
  background-color: #555555;
  color: #888888;
  cursor: not-allowed;
}

.loading {
  margin-top: 10px;
  color: #bdbdbd;
  font-style: italic;
}

.result {
  margin-top: 10px;
  padding: 10px;
  border-radius: 4px;
}

.success {
  background-color: rgba(46, 125, 50, 0.2);
  color: #81c784;
  border: 1px solid #2e7d32;
}

.error {
  background-color: rgba(198, 40, 40, 0.2);
  color: #ef9a9a;
  border: 1px solid #c62828;
}

.data-display {
  margin-top: 15px;
}

.data-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  background-color: #2a2a2a;
  border-radius: 4px;
  overflow: hidden;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #444;
}

th {
  background-color: #333333;
  font-weight: bold;
  color: #4caf50;
}

tr:hover {
  background-color: #333333;
}

.positive {
  color: #81c784;
}

.negative {
  color: #ef9a9a;
}

.placeholder-data {
  background-color: #333333;
  padding: 15px;
  border-radius: 4px;
  margin-top: 10px;
}

pre {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.4;
  background-color: #333333;
  padding: 10px;
  border-radius: 4px;
  color: #e0e0e0;
}

.order-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

label {
  margin-bottom: 5px;
  font-weight: bold;
  color: #bdbdbd;
}

input, select {
  padding: 8px 12px;
  border: 1px solid #444;
  border-radius: 4px;
  font-size: 14px;
  background-color: #333333;
  color: #e0e0e0;
}

input:focus, select:focus {
  outline: none;
  border-color: #4caf50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.order-form button {
  grid-column: 1 / -1;
  margin-top: 10px;
}

@media (max-width: 768px) {
  .test-sections {
    grid-template-columns: 1fr;
  }
  
  .order-form {
    grid-template-columns: 1fr;
  }
}
</style>
