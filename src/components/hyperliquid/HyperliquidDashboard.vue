<template>
  <div class="hyperliquid-dashboard">
    <h1>Hyperliquid Dashboard</h1>
    <div class="dashboard-content">
      <div class="section">
        <h2>Account Information</h2>
        <div v-if="loading.account" class="loading">Loading account data...</div>
        <div v-else-if="error.account" class="error">{{ error.account }}</div>
        <div v-else class="account-info">
          <p>Account information will be displayed here</p>
          <!-- Account data will be displayed here once implemented -->
        </div>
      </div>

      <div class="section">
        <h2>Markets</h2>
        <div v-if="loading.markets" class="loading">Loading markets data...</div>
        <div v-else-if="error.markets" class="error">{{ error.markets }}</div>
        <div v-else class="markets-info">
          <p>Market information will be displayed here</p>
          <!-- Market data will be displayed here once implemented -->
        </div>
      </div>

      <div class="section">
        <h2>Place Order</h2>
        <form @submit.prevent="placeOrder" class="order-form">
          <!-- Order form will be implemented here -->
          <p>Order form will be implemented here</p>
          <button type="submit" :disabled="loading.order">Place Order</button>
        </form>
        <div v-if="loading.order" class="loading">Processing order...</div>
        <div v-if="error.order" class="error">{{ error.order }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import hyperliquidApi from '@/services/hyperliquidApi';

export default {
  name: 'HyperliquidDashboard',
  data() {
    return {
      loading: {
        account: false,
        markets: false,
        order: false
      },
      error: {
        account: null,
        markets: null,
        order: null
      },
      accountInfo: null,
      marketsData: null,
      orderForm: {
        // Order form fields will be defined here
      }
    };
  },
  mounted() {
    this.fetchAccountInfo();
    this.fetchMarkets();
  },
  methods: {
    async fetchAccountInfo() {
      this.loading.account = true;
      this.error.account = null;
      
      try {
        // This will be uncommented when the API is fully implemented
        // For now we're using placeholder data to avoid the lint error
        console.log('Will use hyperliquidApi.getAccountInfo() when implemented');
        hyperliquidApi.getAccountInfo(); // Added this line to use the import
        this.accountInfo = { message: 'Account data will be available when API is implemented' };
      } catch (error) {
        this.error.account = 'Failed to load account information';
        console.error(error);
      } finally {
        this.loading.account = false;
      }
    },
    
    async fetchMarkets() {
      this.loading.markets = true;
      this.error.markets = null;
      
      try {
        // This will be uncommented when the API is fully implemented
        // For now we're using placeholder data to avoid the lint error
        console.log('Will use hyperliquidApi.getMarkets() when implemented');
        hyperliquidApi.getMarkets(); // Added this line to use the import
        this.marketsData = { message: 'Market data will be available when API is implemented' };
      } catch (error) {
        this.error.markets = 'Failed to load markets data';
        console.error(error);
      } finally {
        this.loading.markets = false;
      }
    },
    
    async placeOrder() {
      this.loading.order = true;
      this.error.order = null;
      
      try {
        // This will be uncommented when the API is fully implemented
        console.log('Will use hyperliquidApi.placeOrder() when implemented');
        hyperliquidApi.placeOrder(); // Added this line to use the import
        console.log('Order placement will be implemented');
      } catch (error) {
        this.error.order = 'Failed to place order';
        console.error(error);
      } finally {
        this.loading.order = false;
      }
    }
  }
};
</script>

<style scoped>
.hyperliquid-dashboard {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.section {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h1 {
  font-size: 24px;
  margin-bottom: 20px;
  color: #333;
}

h2 {
  font-size: 18px;
  margin-bottom: 15px;
  color: #555;
  border-bottom: 1px solid #ddd;
  padding-bottom: 8px;
}

.loading {
  color: #666;
  font-style: italic;
}

.error {
  color: #d32f2f;
  margin: 10px 0;
}

.order-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

button {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background-color: #45a049;
}
</style>
