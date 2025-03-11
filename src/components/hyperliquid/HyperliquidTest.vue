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
              @click="fetchAccountInfo" 
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
          
          <div v-else-if="results.account && results.account.data" class="data-display">
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
                  <tr v-for="(balance, index) in formatAccountBalances(results.account.data)" :key="index">
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
            <button @click="fetchAccountInfo" :disabled="loading.account">
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
              <table v-if="formatPositions(results.positions.data).length > 0">
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
                  <tr v-for="position in formatPositions(results.positions.data)" :key="position.symbol">
                    <td class="symbol-col">{{ position.symbol }} {{ position.leverage }}x</td>
                    <td class="side-col" :class="position.side === 'long' ? 'text-green' : 'text-red'">
                      {{ position.side === 'long' ? 'Long' : 'Short' }}
                    </td>
                    <td class="size-col">{{ formatNumber(position.size) }}</td>
                    <td class="price-col">{{ formatNumber(position.entryPrice, 4) }}</td>
                    <td class="price-col">{{ formatNumber(position.markPrice, 4) }}</td>
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
          
          <div v-else-if="results.openOrders && results.openOrders.data" class="data-display">
            <!-- Cancel Order Result Message -->
            <div v-if="results.cancelOrder" class="result-message" :class="results.cancelOrder.success ? 'success-message' : 'error-message'">
              {{ results.cancelOrder.message }}
              <pre v-if="results.cancelOrder.details">{{ JSON.stringify(results.cancelOrder.details, null, 2) }}</pre>
            </div>
            
            <div class="data-table compact-table">
              <table v-if="results.openOrders.data.length > 0">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Symbol</th>
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
                  <tr v-for="order in results.openOrders.data" :key="order.orderId">
                    <td>{{ formatDate(order.timestamp) }}</td>
                    <td>{{ order.orderType }}</td>
                    <td>{{ formatSymbol(order.symbol) }}</td>
                    <td :class="order.side === 'B' ? 'text-green' : 'text-red'">
                      {{ order.side === 'B' ? 'Buy' : 'Sell' }}
                    </td>
                    <td>{{ formatNumber(order.size) }}</td>
                    <td>{{ formatNumber(order.filled) }}</td>
                    <td>${{ formatNumber(order.price * order.size) }}</td>
                    <td>{{ formatNumber(order.price, 4) }}</td>
                    <td>{{ order.reduceOnly ? 'Yes' : 'No' }}</td>
                    <td>{{ order.status }}</td>
                    <td>
                      <button 
                        @click="cancelOrder(order.orderId, order.assetId)" 
                        :disabled="loading.cancelOrder === order.orderId"
                        class="cancel-button"
                      >
                        {{ loading.cancelOrder === order.orderId ? 'Cancelling...' : 'Cancel' }}
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
          <h2>Order Placement</h2>
          <div class="test-controls">
            <form @submit.prevent="placeTestOrder" class="order-form">
              <div class="form-group">
                <label for="symbol">Symbol</label>
                <select id="symbol" v-model="orderForm.symbol" required>
                  <option value="">Select Symbol</option>
                  <option v-for="symbol in availableSymbols" :key="symbol" :value="symbol">{{ symbol }}</option>
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
                <select id="type" v-model="orderForm.orderType" required>
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
                  step="0.01" 
                  min="0.01"
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
import exchangeApi from '@/services/ccxtApi';

export default {
  name: 'HyperliquidTest',
  data() {
    return {
      loading: {
        account: false,
        positions: false,
        openOrders: false,
        placeOrder: false,
        cancelOrder: null,
        cancelAllOrders: false,
        refreshAll: false
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
        size: 0.01,
        price: null,
        orderType: 'limit',
        reduceOnly: false
      },
      availableSymbols: [
        'BTC', 'ETH', 'SOL', 'LINK', 'ARB', 'XRP', 'BNB', 'DOGE', 'MATIC', 'AVAX'
      ]
    };
  },
  mounted() {
    this.refreshAllData();
  },
  methods: {
    fetchAccountInfo() {
      this.loading.account = true;
      this.results.account = null;
      
      exchangeApi.getAccountInfo()
        .then(response => {
          this.results.account = {
            success: response.success,
            data: response.data,
            error: response.error
          };
        })
        .catch(error => {
          this.results.account = {
            success: false,
            error: error.message || 'Failed to fetch account information'
          };
        })
        .finally(() => {
          this.loading.account = false;
        });
    },
    
    fetchPositions() {
      this.loading.positions = true;
      this.results.positions = null;
      
      exchangeApi.getPositions()
        .then(response => {
          this.results.positions = {
            success: response.success,
            data: response.data,
            error: response.error
          };
        })
        .catch(error => {
          this.results.positions = {
            success: false,
            error: error.message || 'Failed to fetch positions'
          };
        })
        .finally(() => {
          this.loading.positions = false;
        });
    },
    
    fetchOpenOrders() {
      this.loading.openOrders = true;
      this.results.openOrders = null;
      this.results.cancelOrder = null; // Clear previous cancel results
      
      exchangeApi.getOpenOrders()
        .then(response => {
          this.results.openOrders = {
            success: response.success,
            data: response.data,
            error: response.error
          };
        })
        .catch(error => {
          this.results.openOrders = {
            success: false,
            error: error.message || 'Failed to fetch open orders'
          };
        })
        .finally(() => {
          this.loading.openOrders = false;
        });
    },
    
    placeTestOrder() {
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
      
      const orderData = {
        symbol: this.orderForm.symbol,
        side: this.orderForm.side,
        size: parseFloat(this.orderForm.size),
        price: this.orderForm.price ? parseFloat(this.orderForm.price) : undefined,
        orderType: this.orderForm.orderType,
        reduceOnly: this.orderForm.reduceOnly
      };
      
      exchangeApi.placeOrder(orderData)
        .then(response => {
          this.results.placeOrder = {
            success: response.success,
            data: response.data,
            message: response.message,
            error: response.error
          };
          
          // Refresh open orders after placing an order
          if (response.success) {
            setTimeout(() => {
              this.fetchOpenOrders();
              this.fetchPositions();
              this.fetchAccountInfo();
            }, 1000);
          }
        })
        .catch(error => {
          this.results.placeOrder = {
            success: false,
            error: error.message || 'Failed to place order'
          };
        })
        .finally(() => {
          this.loading.placeOrder = false;
        });
    },
    
    cancelOrder(orderId, symbol) {
      if (!orderId || !symbol) {
        this.results.cancelOrder = {
          success: false,
          message: 'Order ID and symbol are required',
          details: { orderId, symbol }
        };
        return;
      }
      
      this.loading.cancelOrder = orderId;
      
      console.log(`Cancelling order: ${orderId}, symbol: ${symbol}`);
      
      exchangeApi.cancelOrder(orderId, symbol)
        .then(response => {
          console.log('Cancel response:', response);
          this.results.cancelOrder = {
            success: response.success,
            message: response.message || `Order ${orderId} cancelled successfully`,
            details: response.data
          };
          
          // Refresh open orders after cancelling
          if (response.success) {
            setTimeout(() => {
              this.fetchOpenOrders();
            }, 1000);
          }
        })
        .catch(error => {
          console.error('Cancel error:', error);
          this.results.cancelOrder = {
            success: false,
            message: `Failed to cancel order ${orderId}`,
            details: {
              error: error.message,
              response: error.response?.data
            }
          };
        })
        .finally(() => {
          this.loading.cancelOrder = null;
        });
    },
    
    refreshAllData() {
      this.loading.refreshAll = true;
      
      // Reset all results
      this.results = {
        account: null,
        positions: null,
        openOrders: null,
        placeOrder: null,
        cancelOrder: null
      };
      
      // Fetch all data in parallel
      Promise.all([
        this.fetchAccountInfo(),
        this.fetchPositions(),
        this.fetchOpenOrders()
      ])
        .finally(() => {
          this.loading.refreshAll = false;
        });
    },
    
    formatAccountBalances(accountData) {
      if (!accountData || !accountData.balance) {
        return [];
      }
      
      // Handle the new nested structure where balance is a property
      const balance = accountData.balance;
      const result = [];
      
      // Hyperliquid-specific handling for USDC balance
      if (balance.info && typeof balance.info === 'object') {
        // Check for Hyperliquid's specific structure
        if (balance.info.marginSummary !== undefined || 
            balance.info.crossMarginSummary !== undefined || 
            balance.info.assetPositions !== undefined) {
          
          // Look for USDC in free/total balances
          if (balance.free && balance.free.USDC) {
            result.push({
              coin: 'USDC',
              totalBalance: balance.total?.USDC || balance.free.USDC,
              availableBalance: balance.free.USDC,
              usdcValue: balance.free.USDC.toFixed(2)
            });
          }
          
          // Check for USDC in balance.info.cash or other possible locations
          if (balance.info.cash !== undefined) {
            result.push({
              coin: 'USDC (Cash)',
              totalBalance: balance.info.cash,
              availableBalance: balance.info.cash,
              usdcValue: parseFloat(balance.info.cash).toFixed(2)
            });
          }
          
          // Check for USDC in balance.info.crossMarginSummary
          if (balance.info.crossMarginSummary && balance.info.crossMarginSummary.accountValue !== undefined) {
            result.push({
              coin: 'USDC (Account Value)',
              totalBalance: balance.info.crossMarginSummary.accountValue,
              availableBalance: balance.info.crossMarginSummary.accountValue,
              usdcValue: parseFloat(balance.info.crossMarginSummary.accountValue).toFixed(2)
            });
          }
        }
      }
      
      // If no results from Hyperliquid-specific handling, try standard CCXT format
      if (result.length === 0) {
        // Standard CCXT format
        if (balance.total) {
          for (const currency in balance.total) {
            if (balance.total[currency] > 0) {
              result.push({
                coin: currency,
                totalBalance: balance.total[currency] || 0,
                availableBalance: balance.free?.[currency] || 0,
                usdcValue: (balance.total[currency] * (balance.usdValue?.[currency] || 1)).toFixed(2)
              });
            }
          }
        }
        
        // Try currencies array if it exists
        if (result.length === 0 && balance.currencies && Array.isArray(balance.currencies)) {
          return balance.currencies.map(currency => ({
            coin: currency.currency,
            totalBalance: currency.total || 0,
            availableBalance: currency.available || currency.free || 0,
            usdcValue: currency.usdValue || (currency.total * 1).toFixed(2)
          }));
        }
      }
      
      // If we still have no results, add a debug entry
      if (result.length === 0) {
        result.push({
          coin: 'Debug Info',
          totalBalance: 'No balance found',
          availableBalance: 'Check console',
          usdcValue: 'N/A'
        });
        
        // Add raw data for debugging
        if (balance.info) {
          const keys = Object.keys(balance.info);
          keys.forEach(key => {
            result.push({
              coin: key,
              totalBalance: typeof balance.info[key] === 'object' ? 
                JSON.stringify(balance.info[key]).substring(0, 20) + '...' : 
                balance.info[key],
              availableBalance: 'See raw data',
              usdcValue: 'N/A'
            });
          });
        }
      }
      
      return result;
    },
    
    formatPositions(positionsData) {
      if (!positionsData) {
        return [];
      }
      
      // Handle the new nested structure
      const positions = Array.isArray(positionsData) ? positionsData : 
                        (positionsData.positions && Array.isArray(positionsData.positions) ? 
                         positionsData.positions : []);
      
      if (!positions || positions.length === 0) {
        return [];
      }
      
      return positions.map(position => {
        // Extract common position properties with fallbacks
        const rawSymbol = position.symbol || position.instrument || position.market || 'Unknown';
        const symbol = this.formatSymbol(rawSymbol);
        
        const side = position.side || (position.size > 0 ? 'long' : 'short');
        const size = Math.abs(position.size || position.contracts || position.amount || 0);
        const entryPrice = position.entryPrice || position.entry || position.averagePrice || 0;
        const markPrice = position.markPrice || position.lastPrice || position.price || 0;
        const pnl = position.unrealizedPnl || position.pnl || position.profit || 0;
        const leverage = position.leverage || 1;
        
        return {
          symbol,
          side,
          size,
          entryPrice,
          markPrice,
          pnl,
          pnlPercentage: this.calculatePnlPercentage(pnl, entryPrice, size),
          liquidationPrice: position.liquidationPrice || position.liqPrice || 0,
          margin: position.margin || position.collateral || 0,
          leverage,
          timestamp: position.timestamp || Date.now(),
          raw: position // Keep the raw data for debugging
        };
      });
    },
    
    formatSymbol(symbol) {
      if (!symbol) return 'Unknown';
      
      // Simplify symbol by removing the "/USDC:USDC" suffix
      if (symbol.includes('/')) {
        return symbol.split('/')[0];
      } else if (symbol.includes(':')) {
        return symbol.split(':')[0];
      }
      return symbol;
    },
    
    formatNumber(value, decimals = null) {
      if (value === null || value === undefined) {
        return '-';
      }
      
      const num = parseFloat(value);
      
      if (isNaN(num)) {
        return '-';
      }
      
      if (decimals !== null) {
        return num.toFixed(decimals);
      }
      
      // Dynamically determine decimals based on value
      if (Math.abs(num) >= 1000) {
        return num.toFixed(2);
      } else if (Math.abs(num) >= 1) {
        return num.toFixed(4);
      } else {
        return num.toFixed(6);
      }
    },
    
    formatDate(timestamp) {
      if (!timestamp) {
        return '-';
      }
      
      const date = new Date(timestamp);
      return date.toLocaleString();
    },
    
    calculatePnlPercentage(pnl, entryPrice, size) {
      if (!entryPrice || !size || entryPrice === 0 || size === 0) {
        return '0.00';
      }
      
      const positionValue = entryPrice * size;
      const pnlPercentage = (pnl / positionValue) * 100;
      
      return pnlPercentage.toFixed(2);
    }
  }
};
</script>

<style>
@import '@/assets/styles/Hyperliquid/hyperliquid-test.css';
</style>
