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

      <!-- Real-time Data Section -->
      <div class="test-section">
        <h2>Real-time Data</h2>
        <div class="test-controls">
          <div class="form-group">
            <label for="websocket-type">Data Type:</label>
            <select id="websocket-type" v-model="websocket.type">
              <option value="ticker">Ticker</option>
              <option value="orderbook">Orderbook</option>
              <option value="trades">Trades</option>
              <option value="user">User Data</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="websocket-coin">Coin:</label>
            <select id="websocket-coin" v-model="websocket.coin">
              <option value="BTC">BTC</option>
              <option value="ETH">ETH</option>
              <option value="SOL">SOL</option>
              <option value="DOGE">DOGE</option>
            </select>
          </div>
          
          <button 
            @click="startWebsocket" 
            :disabled="websocket.active || loading.websocket"
            class="primary-button"
          >
            Start Real-time Updates
          </button>
          
          <button 
            @click="stopWebsocket" 
            :disabled="!websocket.active || loading.websocket"
            class="secondary-button"
          >
            Stop Updates
          </button>
          
          <div v-if="loading.websocket" class="loading">
            Setting up real-time data...
          </div>
        </div>
        
        <div v-if="websocket.active" class="websocket-status">
          <div class="status-indicator active"></div>
          Real-time updates active for {{ websocket.type }} data
          <span v-if="websocket.coin">({{ websocket.coin }})</span>
        </div>
        
        <div v-if="websocket.error" class="error">
          {{ websocket.error }}
        </div>
        
        <div v-if="websocket.data" class="data-display">
          <h3>Real-time Data</h3>
          <div class="last-update">Last update: {{ websocket.lastUpdate }}</div>
          
          <!-- Ticker Data Display -->
          <div v-if="websocket.type === 'ticker' && websocket.data" class="data-table">
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Price</th>
                  <th>24h Change</th>
                  <th>24h Volume</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{{ websocket.data.coin || websocket.coin }}</td>
                  <td>{{ websocket.data.price || 'N/A' }}</td>
                  <td :class="getChangeClass(websocket.data.change24h)">
                    {{ websocket.data.change24h || '0' }}%
                  </td>
                  <td>{{ websocket.data.volume24h || 'N/A' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Orderbook Data Display -->
          <div v-if="websocket.type === 'orderbook' && websocket.data" class="data-table">
            <div class="orderbook-container">
              <div class="orderbook-column">
                <h4>Bids</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Price</th>
                      <th>Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(bid, index) in websocket.data.bids?.slice(0, 5)" :key="'bid-' + index">
                      <td class="positive">{{ bid.price }}</td>
                      <td>{{ bid.size }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div class="orderbook-column">
                <h4>Asks</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Price</th>
                      <th>Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(ask, index) in websocket.data.asks?.slice(0, 5)" :key="'ask-' + index">
                      <td class="negative">{{ ask.price }}</td>
                      <td>{{ ask.size }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <!-- Trades Data Display -->
          <div v-if="websocket.type === 'trades' && websocket.data" class="data-table">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Price</th>
                  <th>Size</th>
                  <th>Side</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(trade, index) in websocket.data.trades?.slice(0, 10)" :key="'trade-' + index">
                  <td>{{ formatTime(trade.time) }}</td>
                  <td :class="trade.side === 'buy' ? 'positive' : 'negative'">
                    {{ trade.price }}
                  </td>
                  <td>{{ trade.size }}</td>
                  <td :class="trade.side === 'buy' ? 'positive' : 'negative'">
                    {{ trade.side }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- User Data Display -->
          <div v-if="websocket.type === 'user' && websocket.data" class="data-table">
            <h4>Positions</h4>
            <table v-if="websocket.data.positions && websocket.data.positions.length">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Size</th>
                  <th>Entry Price</th>
                  <th>Mark Price</th>
                  <th>PnL</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="position in websocket.data.positions" :key="position.symbol">
                  <td>{{ position.symbol }}</td>
                  <td :class="position.size >= 0 ? 'positive' : 'negative'">
                    {{ position.size }}
                  </td>
                  <td>{{ position.entryPrice }}</td>
                  <td>{{ position.markPrice }}</td>
                  <td :class="position.pnl >= 0 ? 'positive' : 'negative'">
                    {{ position.pnl }}
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="no-data">No open positions</div>
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
import hyperliquidWebsocketService from '@/services/hyperliquidWebsocketService';

export default {
  name: 'HyperliquidTest',
  data() {
    return {
      loading: {
        connection: false,
        markets: false,
        account: false,
        positions: false,
        order: false,
        websocket: false
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
      },
      websocket: {
        active: false,
        type: 'ticker',
        coin: 'BTC',
        subscriptionId: null,
        data: null,
        error: null,
        lastUpdate: null
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
    },
    
    // WebSocket methods
    async startWebsocket() {
      if (this.websocket.active) {
        return;
      }
      
      this.loading.websocket = true;
      this.websocket.error = null;
      
      try {
        // Subscribe to the selected data feed
        const subscriptionId = await hyperliquidWebsocketService.subscribe(
          this.websocket.type,
          this.websocket.coin,
          this.handleWebsocketData
        );
        
        if (subscriptionId) {
          this.websocket.subscriptionId = subscriptionId;
          this.websocket.active = true;
          this.websocket.data = null;
          this.websocket.lastUpdate = null;
        } else {
          this.websocket.error = 'Failed to start real-time updates';
        }
      } catch (error) {
        console.error('Error starting WebSocket:', error);
        this.websocket.error = `Error: ${error.message || 'Failed to start real-time updates'}`;
      } finally {
        this.loading.websocket = false;
      }
    },
    
    async stopWebsocket() {
      if (!this.websocket.active || !this.websocket.subscriptionId) {
        return;
      }
      
      this.loading.websocket = true;
      
      try {
        // Unsubscribe from the data feed
        await hyperliquidWebsocketService.unsubscribe(this.websocket.subscriptionId);
        
        this.websocket.active = false;
        this.websocket.subscriptionId = null;
      } catch (error) {
        console.error('Error stopping WebSocket:', error);
        this.websocket.error = `Error: ${error.message || 'Failed to stop real-time updates'}`;
      } finally {
        this.loading.websocket = false;
      }
    },
    
    handleWebsocketData(data) {
      this.websocket.data = data;
      this.websocket.lastUpdate = new Date().toLocaleTimeString();
    },
    
    getChangeClass(change) {
      if (!change) return '';
      return parseFloat(change) >= 0 ? 'positive' : 'negative';
    },
    
    formatTime(timestamp) {
      if (!timestamp) return 'N/A';
      
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    }
  },
  beforeUnmount() {
    // Clean up any active subscriptions when component is destroyed
    if (this.websocket.active && this.websocket.subscriptionId) {
      hyperliquidWebsocketService.unsubscribe(this.websocket.subscriptionId);
    }
  }
};
</script>

<style>
@import '@/assets/styles/Hyperliquid/hyperliquid-test.css';
</style>
