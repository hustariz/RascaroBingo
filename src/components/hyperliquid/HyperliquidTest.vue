<template>
  <div class="hyperliquid-test-container">
    <div class="header">
      <h2>Hyperliquid API Test</h2>
      <div class="header-actions">
        <button @click="refreshAllData" :disabled="loading.refreshAll" class="refresh-all-button">
          {{ loading.refreshAll ? 'Refreshing...' : 'Refresh All Data' }}
        </button>
      </div>
    </div>
    
    <div class="data-sections">
      <!-- First Row: Account Details and Open Positions -->
      <div class="section-row">
        <!-- Account Information Section -->
        <div class="data-section">
          <div class="section-header">
            <h3>Account Details</h3>
            <button 
              @click="fetchAccountData" 
              :disabled="loading.account" 
              class="refresh-button"
            >
              {{ loading.account ? 'Refreshing...' : 'Refresh' }}
            </button>
          </div>
          
          <div v-if="loading.account" class="loading-indicator">Loading account information...</div>
          
          <div v-else-if="results.account && results.account.error" class="error-message">
            {{ results.account.error }}
          </div>
          
          <div v-else-if="accountData" class="data-display">
            <div class="data-table">
              <table>
                <thead>
                  <tr>
                    <th>Coin</th>
                    <th>Total Balance</th>
                    <th>Available Balance</th>
                    <th>USDC Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(balance, index) in formattedAccountBalances" :key="index">
                    <td>{{ balance.coin }}</td>
                    <td>{{ formatNumber(balance.totalBalance) }}</td>
                    <td>{{ formatNumber(balance.availableBalance) }}</td>
                    <td>${{ formatNumber(balance.usdcValue) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div v-else class="empty-state">
            <p>Click the button to fetch account information</p>
            <button @click="fetchAccountData" :disabled="loading.account">
              {{ loading.account ? 'Loading...' : 'Fetch Account Info' }}
            </button>
          </div>
        </div>
        
        <!-- Positions Section -->
        <div class="data-section positions-section">
          <div class="section-header">
            <h3>Open Positions</h3>
            <button 
              @click="fetchPositions" 
              :disabled="loading.positions" 
              class="refresh-button"
            >
              {{ loading.positions ? 'Refreshing...' : 'Refresh' }}
            </button>
          </div>
          
          <div v-if="loading.positions" class="loading-indicator">Loading positions...</div>
          
          <div v-else-if="results.positions && results.positions.error" class="error-message">
            {{ results.positions.error }}
          </div>
          
          <div v-else-if="results.positions && results.positions.data" class="data-display">
            <div class="data-table compact-table positions-table">
              <table v-if="formatPositions(results.positions.data, marketPrices).length > 0">
                <thead>
                  <tr>
                    <th class="symbol-col">Symbol</th>
                    <th class="side-col">Side</th>
                    <th class="size-col">Size</th>
                    <th class="price-col">Entry</th>
                    <th class="price-col">Mark</th>
                    <th class="pnl-col">PnL</th>
                    <th class="liq-col">Liq</th>
                    <th class="margin-col">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="position in formatPositions(results.positions.data, marketPrices)" :key="position.symbol">
                    <td class="symbol-col">{{ position.symbol }} {{ position.leverage }}x</td>
                    <td class="side-col" :class="position.side === 'long' ? 'text-green' : 'text-red'">
                      {{ position.side === 'long' ? 'Long' : 'Short' }}
                    </td>
                    <td class="size-col">{{ formatNumber(position.size || 0) }}</td>
                    <td class="price-col">{{ formatNumber(position.entryPrice || 0, 4) }}</td>
                    <td class="price-col">
                      {{ formatNumber(position.markPrice || 0, 4) }}
                    </td>
                    <td class="pnl-col" :class="position.pnl >= 0 ? 'text-green' : 'text-red'">
                      ${{ formatNumber(position.pnl) }} ({{ position.pnlPercentage >= 0 ? '+' : '' }}{{ position.pnlPercentage }}%)
                    </td>
                    <td class="liq-col">{{ formatNumber(position.liquidationPrice, 4) }}</td>
                    <td class="margin-col">${{ formatNumber(position.margin) }}</td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="no-data-message">No open positions</div>
            </div>
          </div>
          
          <div v-else class="empty-state">
            <p>Click the button to fetch positions</p>
            <button @click="fetchPositions" :disabled="loading.positions">
              {{ loading.positions ? 'Loading...' : 'Fetch Positions' }}
            </button>
          </div>
        </div>
      </div>
      
      <!-- Second Row: Open Orders -->
      <div class="section-row">
        <div class="data-section full-width">
          <div class="section-header">
            <h3>Open Orders</h3>
            <div class="section-actions">
              <button 
                @click="fetchOpenOrders" 
                :disabled="loading.openOrders" 
                class="refresh-button"
              >
                {{ loading.openOrders ? 'Refreshing...' : 'Refresh' }}
              </button>
              <button 
                v-if="results.openOrders && results.openOrders.data && results.openOrders.data.length > 0"
                @click="cancelAllOrders" 
                :disabled="loading.cancelAllOrders" 
                class="cancel-all-button"
              >
                {{ loading.cancelAllOrders ? 'Cancelling...' : 'Cancel All' }}
              </button>
            </div>
          </div>
          
          <div v-if="loading.openOrders" class="loading-indicator">Loading open orders...</div>
          
          <div v-else-if="results.openOrders && results.openOrders.error" class="error-message">
            {{ results.openOrders.error }}
          </div>
          
          <div v-else-if="openOrders" class="data-display">
            <!-- Cancel Order Result Message -->
            <div v-if="results.cancelOrder" class="result-message" :class="results.cancelOrder.success ? 'success-message' : 'error-message'">
              {{ results.cancelOrder.message }}
              <pre v-if="results.cancelOrder.details">{{ JSON.stringify(results.cancelOrder.details, null, 2) }}</pre>
            </div>
            
            <div class="data-table compact-table">
              <table v-if="formattedOpenOrders.length > 0">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Symbol</th>
                    <th>Asset ID</th>
                    <th>Side</th>
                    <th>Size</th>
                    <th>Filled</th>
                    <th>Value</th>
                    <th>Price</th>
                    <th>Reduce</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="order in formattedOpenOrders" :key="order.id">
                    <td>{{ formatDate(order.timestamp) }}</td>
                    <td>{{ order.orderType }}</td>
                    <td>{{ order.symbol }}</td>
                    <td>{{ order.assetId }}</td>
                    <td :class="order.side === 'Buy' ? 'text-green' : 'text-red'">
                      {{ order.side }}
                    </td>
                    <td>{{ formatNumber(order.size) }}</td>
                    <td>{{ formatNumber(order.filled) }}</td>
                    <td>${{ formatNumber(order.value) }}</td>
                    <td>{{ formatNumber(order.price, 4) }}</td>
                    <td>{{ order.reduceOnly ? 'Yes' : 'No' }}</td>
                    <td>{{ order.status }}</td>
                    <td>
                      <button 
                        @click="cancelOrder(order.id, order.assetId)" 
                        :disabled="loading.cancelOrder === order.id"
                        class="cancel-button"
                      >
                        {{ loading.cancelOrder === order.id ? 'Cancelling...' : 'Cancel' }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="no-data-message">No open orders</div>
            </div>
          </div>
          
          <div v-else class="empty-state">
            <p>Click the button to fetch open orders</p>
            <button @click="fetchOpenOrders" :disabled="loading.openOrders">
              {{ loading.openOrders ? 'Loading...' : 'Fetch Open Orders' }}
            </button>
          </div>
        </div>
      </div>
      
      <!-- Third Row: Order Placement -->
      <div class="section-row">
        <div class="data-section">
          <div class="section-header">
            <h2>Order Placement</h2>
            <button @click="fetchAvailableSymbols" :disabled="loading.markets" class="refresh-button">
              {{ loading.markets ? 'Fetching Symbols...' : 'Fetch Symbols' }}
            </button>
          </div>
          <div v-if="errors.markets" class="error-message">
            Error fetching symbols: {{ errors.markets }}
          </div>
          <div class="test-controls">
            <form @submit.prevent="placeTestOrder" class="order-form">
              <div class="form-group">
                <label for="symbol">Symbol</label>
                <select id="symbol" v-model="orderForm.symbol" required @change="onSymbolChange">
                  <option value="">Select Symbol</option>
                  <option v-for="symbol in availableSymbols" :key="symbol" :value="symbol">{{ symbol }}</option>
                </select>
                <span v-if="loading.fetchingPrice" class="loading-indicator-inline">Fetching price...</span>
                <span v-if="orderForm.symbol && getMarkPrice(orderForm.symbol)" class="price-fetched">
                  Current price: ${{ formatNumber(getMarkPrice(orderForm.symbol), 4) }}
                </span>
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
                <select id="type" v-model="orderForm.orderType" required @change="onOrderTypeChange">
                  <option value="limit">Limit</option>
                  <option value="market">Market</option>
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
              
              <div class="form-group" v-if="orderForm.orderType === 'limit'">
                <label for="price">Price</label>
                <input 
                  id="price" 
                  type="number" 
                  v-model="orderForm.price" 
                  step="0.00001" 
                  min="0.00001"
                  :required="orderForm.orderType === 'limit'"
                />
              </div>
              
              <button type="submit" :disabled="loading.placeOrder">Place Test Order</button>
            </form>
            
            <div v-if="loading.placeOrder" class="loading">Placing order...</div>
            <div v-if="results.placeOrder" :class="['result', results.placeOrder.success ? 'success' : 'error']">
              {{ results.placeOrder.message }}
              <pre v-if="results.placeOrder.data">{{ JSON.stringify(results.placeOrder.data, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue';
import exchangeApi from '@/services/ccxtApi';
import { formatAccountBalances, formatPositions, formatOrders, formatNumber, formatDate, formatSymbol } from './functions/formatters';
import { placeOrder, cancelOrder, fetchMarketPrice } from './functions/orderFunctions';
import { fetchAccountData, fetchPositions, fetchOpenOrders, fetchMarkets } from './functions/dataFetchers';

export default {
  name: 'HyperliquidTest',
  data() {
    return {
      accountData: null,
      positions: [],
      openOrders: [],
      availableSymbols: [],
      marketPrices: {},
      loading: {
        refreshAll: false,
        account: false,
        positions: false,
        openOrders: false,
        placeOrder: false,
        cancelOrder: null,
        fetchingPrice: false,
        markets: false
      },
      results: {
        account: null,
        positions: null,
        openOrders: null,
        placeOrder: null,
        cancelOrder: null
      },
      orderForm: {
        symbol: 'BTC',
        side: 'buy',
        size: null,
        price: null,
        orderType: 'limit',
        reduceOnly: false
      },
      errors: {
        markets: null
      }
    };
  },
  mounted() {
    // Fetch available symbols first
    this.fetchAvailableSymbols().then(() => {
      // Then refresh all data
      this.refreshAllData();
    });
  },
  computed: {
    formattedAccountBalances() {
      return formatAccountBalances(this.accountData);
    },
    formattedOpenOrders() {
      return formatOrders(this.openOrders);
    }
  },
  methods: {
    // Formatting functions
    formatNumber,
    formatDate,
    formatSymbol,
    formatPositions,
    formatOrders,
    
    async refreshAllData() {
      this.loading.refreshAll = true;
      
      try {
        // Fetch account data
        await this.fetchAccountData();
        
        // Fetch positions
        await this.fetchPositions();
        
        // Fetch open orders
        await this.fetchOpenOrders();
        
        // Fetch market price for XRP positions
        await this.fetchPositionMarketPrice('XRP/USDC:USDC');
        
        // Fetch market prices for all available symbols
        await this.fetchAllMarketPrices();
      } catch (error) {
        console.error('Error refreshing data:', error);
      } finally {
        this.loading.refreshAll = false;
      }
    },
    
    async fetchAccountData() {
      await fetchAccountData({
        onStart: () => {
          this.loading.account = true;
          this.results.account = null;
        },
        onSuccess: (data) => {
          this.accountData = data;
          this.results.account = {
            success: true
          };
        },
        onError: (error) => {
          this.results.account = {
            success: false,
            error: error.error || 'Failed to fetch account data'
          };
        },
        onFinally: () => {
          this.loading.account = false;
        }
      });
    },
    
    async fetchPositions() {
      await fetchPositions({
        onStart: () => {
          this.loading.positions = true;
          this.results.positions = null;
        },
        onSuccess: (data) => {
          this.results.positions = {
            success: true,
            data: data
          };
        },
        onError: (error) => {
          this.results.positions = {
            success: false,
            error: error.error || 'Failed to fetch positions'
          };
        },
        onFinally: () => {
          this.loading.positions = false;
        }
      });
    },
    
    async fetchOpenOrders() {
      await fetchOpenOrders({
        onStart: () => {
          this.loading.openOrders = true;
          this.results.openOrders = null;
        },
        onSuccess: (data) => {
          this.openOrders = data;
          this.results.openOrders = {
            success: true
          };
        },
        onError: (error) => {
          this.results.openOrders = {
            success: false,
            error: error.error || 'Failed to fetch open orders'
          };
        },
        onFinally: () => {
          this.loading.openOrders = false;
        }
      });
    },
    
    async fetchAvailableSymbols() {
      try {
        this.loading.markets = true;
        
        // Directly use exchangeApi to fetch markets
        const response = await exchangeApi.getMarkets();
        
        if (response.success) {
          let markets = [];
          
          // Handle different response structures
          if (Array.isArray(response.data)) {
            markets = response.data;
          } else if (response.data && Array.isArray(response.data.markets)) {
            markets = response.data.markets;
          } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
            markets = response.data.data;
          }
          
          // Extract symbols from markets
          const symbols = markets.map(market => market.symbol || market.id || '');
          
          // Filter out empty symbols and remove duplicates
          this.availableSymbols = [...new Set(symbols.filter(s => s))];
        } else {
          this.errors.markets = response.error || 'Failed to fetch markets';
        }
      } catch (error) {
        this.errors.markets = error.message || 'An error occurred while fetching markets';
      } finally {
        this.loading.markets = false;
      }
    },
    
    async fetchMarketPrice() {
      // Get the symbol from the order form or use XRP for positions
      const symbol = this.orderForm.symbol || 'XRP/USDC:USDC';
      if (!symbol) return;
      
      this.loading.fetchingPrice = true;
      
      const result = await fetchMarketPrice(symbol, {
        onStart: () => {
          this.loading.fetchingPrice = true;
        },
        onSuccess: (price) => {
          // Store the raw price value directly
          if (typeof price === 'object' && price.price) {
            this.marketPrices[symbol] = price.price;
          } else {
            this.marketPrices[symbol] = price;
          }
        },
        onError: (error) => {
          console.error(`Error fetching price for ${symbol}:`, error);
        },
        onFinally: () => {
          this.loading.fetchingPrice = false;
        }
      });
      
      return result;
    },
    
    async fetchAllMarketPrices() {
      if (!this.availableSymbols.length) {
        await this.fetchAvailableSymbols();
      }
      
      for (const symbol of this.availableSymbols) {
        await this.fetchMarketPriceForSymbol(symbol);
      }
    },
    
    async fetchMarketPriceForSymbol(symbol) {
      if (!symbol) return;
      
      try {
        // Extract the base symbol (e.g., "XRP" from "XRP/USDC:USDC")
        const baseSymbol = symbol.includes('/') ? symbol.split('/')[0] : symbol;
        
        const result = await fetchMarketPrice(symbol, {
          onStart: () => {
            this.loading.fetchingPrice = true;
          },
          onSuccess: (price) => {
            // Store the raw price value directly
            let priceValue = null;
            
            if (price && price.success) {
              if (typeof price.price === 'number') {
                priceValue = price.price;
              } else if (typeof price.data === 'number') {
                priceValue = price.data;
              } else if (price.data && typeof price.data.price === 'number') {
                priceValue = price.data.price;
              }
              
              if (priceValue !== null) {
                // Store the price with both the full symbol and base symbol as keys
                this.marketPrices[symbol] = priceValue;
                this.marketPrices[baseSymbol] = priceValue;
              }
            }
          },
          onError: (error) => {
            console.error(`Error fetching price for ${symbol}:`, error);
          },
          onFinally: () => {
            this.loading.fetchingPrice = false;
          }
        });
        
        return result;
      } catch (error) {
        console.error(`Error in fetchMarketPriceForSymbol for ${symbol}:`, error);
        this.loading.fetchingPrice = false;
      }
    },
    
    async fetchPositionMarketPrice(symbol) {
      if (!symbol) return;
      
      try {
        // Extract the base symbol (e.g., "XRP" from "XRP/USDC:USDC")
        const baseSymbol = symbol.includes('/') ? symbol.split('/')[0] : symbol;
        
        const result = await fetchMarketPrice(symbol, {
          onStart: () => {
            this.loading.fetchingPrice = true;
          },
          onSuccess: (price) => {
            // Store the raw price value directly
            let priceValue = null;
            
            if (price && price.success) {
              if (typeof price.price === 'number') {
                priceValue = price.price;
              } else if (typeof price.data === 'number') {
                priceValue = price.data;
              } else if (price.data && typeof price.data.price === 'number') {
                priceValue = price.data.price;
              }
              
              if (priceValue !== null) {
                // Store the price with both the full symbol and base symbol as keys
                this.marketPrices[symbol] = priceValue;
                this.marketPrices[baseSymbol] = priceValue;
              }
            }
          },
          onError: (error) => {
            console.error(`Error fetching market price for position: ${symbol}`, error);
          },
          onFinally: () => {
            this.loading.fetchingPrice = false;
          }
        });
        
        return result;
      } catch (error) {
        console.error(`Error in fetchPositionMarketPrice for ${symbol}:`, error);
        this.loading.fetchingPrice = false;
      }
    },
    
    getMarkPrice(symbol) {
      // Try to get the price from the marketPrices object
      if (this.marketPrices[symbol]) {
        return this.marketPrices[symbol];
      }
      
      // If the symbol is XRP/USDC:USDC, try to get the price for XRP
      if (symbol === 'XRP/USDC:USDC' && this.marketPrices['XRP']) {
        return this.marketPrices['XRP'];
      }
      
      // Extract the base symbol and try that
      if (symbol && symbol.includes('/')) {
        const baseSymbol = symbol.split('/')[0];
        if (this.marketPrices[baseSymbol]) {
          return this.marketPrices[baseSymbol];
        }
      }
      
      return 0;
    },
    
    async placeTestOrder() {
      if (!this.orderForm.symbol || !this.orderForm.side || !this.orderForm.size) {
        this.results.placeOrder = {
          success: false,
          error: 'Symbol, side, and size are required'
        };
        return;
      }
      
      if (this.orderForm.orderType === 'limit' && !this.orderForm.price) {
        this.results.placeOrder = {
          success: false,
          error: 'Price is required for limit orders'
        };
        return;
      }
      
      this.loading.placeOrder = true;
      this.results.placeOrder = null;
      
      // Format the symbol for Hyperliquid (XRP needs to be XRP-USD or XRP-USDT depending on the exchange format)
      const formattedSymbol = this.orderForm.symbol.includes('-') ? 
        this.orderForm.symbol : 
        `${this.orderForm.symbol}-USD`;
      
      console.log(`Placing order for symbol: ${formattedSymbol}`);
      
      const orderData = {
        symbol: formattedSymbol,
        side: this.orderForm.side,
        size: parseFloat(this.orderForm.size),
        price: this.orderForm.price ? parseFloat(this.orderForm.price) : undefined,
        orderType: this.orderForm.orderType,
        reduceOnly: this.orderForm.reduceOnly
      };
      
      console.log('Order data:', orderData);
      
      const result = await placeOrder(orderData, {
        onStart: () => {
          this.loading.placeOrder = true;
        },
        onSuccess: (data) => {
          this.results.placeOrder = {
            success: true,
            data: data,
            message: 'Order placed successfully'
          };
        },
        onError: (error) => {
          this.results.placeOrder = {
            success: false,
            error: error.error || 'Failed to place order'
          };
        },
        onFinally: () => {
          this.loading.placeOrder = false;
        }
      });
      
      return result;
    },
    
    async cancelOrder(orderId, assetId) {
      if (!orderId || !assetId) {
        this.results.cancelOrder = {
          success: false,
          message: 'Order ID and asset ID are required',
          details: { orderId, assetId }
        };
        return;
      }
      
      this.loading.cancelOrder = orderId;
      
      console.log(`Cancelling order: ${orderId}, asset ID: ${assetId}`);
      
      // Make sure assetId is a number for Hyperliquid
      const numericAssetId = parseInt(assetId);
      const finalAssetId = isNaN(numericAssetId) ? assetId : numericAssetId;
      
      const result = await cancelOrder(orderId, finalAssetId, {
        onStart: () => {
          this.loading.cancelOrder = orderId;
        },
        onSuccess: (data) => {
          this.results.cancelOrder = {
            success: true,
            message: 'Order cancelled successfully',
            data: data
          };
        },
        onError: (error) => {
          this.results.cancelOrder = {
            success: false,
            message: error.error || 'Failed to cancel order',
            error: error
          };
        },
        onFinally: () => {
          this.loading.cancelOrder = null;
        }
      });
      
      return result;
    },
    
    onSymbolChange() {
      // Fetch market price when a symbol is selected
      if (this.orderForm.symbol) {
        this.fetchMarketPriceForSymbol(this.orderForm.symbol);
        
        // If it's a limit order, also update the price field
        if (this.orderForm.orderType === 'limit') {
          // Wait for price to be fetched
          setTimeout(() => {
            const price = this.getMarkPrice(this.orderForm.symbol);
            if (price) {
              this.orderForm.price = price;
            }
          }, 500);
        }
      }
    },
    
    onOrderTypeChange() {
      // If switching to limit order and we have a symbol selected, fetch the price
      if (this.orderForm.orderType === 'limit' && this.orderForm.symbol) {
        // If we already have a cached price for this symbol, use it
        if (this.marketPrices[this.orderForm.symbol]) {
          this.orderForm.price = parseFloat(this.marketPrices[this.orderForm.symbol].toFixed(4));
        } else {
          // Otherwise fetch the current price
          this.fetchMarketPrice();
        }
      } else if (this.orderForm.orderType === 'market') {
        // Clear the price for market orders
        this.orderForm.price = null;
      }
    }
  }
};
</script>

<style>
@import '@/assets/styles/Hyperliquid/hyperliquid-test.css';
</style>
