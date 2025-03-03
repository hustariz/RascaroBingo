<template>
  <div class="kraken-trade-section">
    <div class="kraken-trade-form">
      <div class="kraken-form-group">
        <label>Symbol:</label>
        <div class="kraken-symbol-search">
          <input 
            type="text" 
            v-model="symbolSearch" 
            placeholder="Search pairs..." 
            class="kraken-trade-input kraken-search-input"
            @focus="showDropdown = true"
          />
          <div v-if="showDropdown" class="kraken-custom-dropdown">
            <div 
              v-for="pair in filteredPairs" 
              :key="pair.symbol" 
              class="kraken-dropdown-item"
              :class="{ active: tradeForm.symbol === pair.symbol }"
              @click="selectPair(pair)"
            >
              <img 
                :src="`https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1.0.0/32/color/${pair.name.split('/')[0].toLowerCase()}.png`"
                :alt="pair.name.split('/')[0]"
                class="kraken-crypto-icon"
                @error="handleImageError"
              />
              <span class="kraken-pair-info">{{ formatOptionText(pair) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="kraken-form-group">
        <label>Side:</label>
        <div class="kraken-side-buttons">
          <button 
            :class="['kraken-side-button', { active: tradeForm.side === 'buy' }]"
            @click="tradeForm.side = 'buy'"
          >
            Buy
          </button>
          <button 
            :class="['kraken-side-button', { active: tradeForm.side === 'sell' }]"
            @click="tradeForm.side = 'sell'"
          >
            Sell
          </button>
        </div>
      </div>

      <div class="kraken-form-group">
        <label>Size:</label>
        <input 
          type="number" 
          v-model="tradeForm.size" 
          class="kraken-trade-input kraken-trade-number-input" 
          placeholder="Enter size..."
          step="0.01"
        />
      </div>

      <div class="kraken-form-group">
        <label>Price:</label>
        <input 
          type="number" 
          v-model="tradeForm.price" 
          class="kraken-trade-input kraken-trade-number-input" 
          placeholder="Enter price..."
          step="0.01"
        />
      </div>

      <div class="kraken-form-group">
        <label>Stop Loss (optional):</label>
        <input 
          type="number" 
          v-model="tradeForm.stopLoss" 
          class="kraken-trade-input kraken-trade-number-input" 
          placeholder="Enter stop loss..."
          step="0.01"
        />
      </div>

      <div class="kraken-form-group">
        <label>Take Profit (optional):</label>
        <input 
          type="number" 
          v-model="tradeForm.takeProfit" 
          class="kraken-trade-input kraken-trade-number-input" 
          placeholder="Enter take profit..."
          step="0.01"
        />
      </div>

      <button 
        class="kraken-place-trade-button" 
        :disabled="!isTradeFormValid"
        @click="placeTrade"
      >
        Place Trade
      </button>

      <div v-if="tradeError" class="kraken-error-message">
        {{ tradeError }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch, onUnmounted } from 'vue';
import axios from 'axios';
import { FUTURES_PAIRS } from './krakenConstants';

export default {
  name: 'KrakenTrade',
  
  emits: ['trade-placed'],

  setup(props, { emit }) {
    const symbolSearch = ref('');
    const showDropdown = ref(false);
    const tradeError = ref(null);
    const marketData = ref({});

    const tradeForm = ref({
      symbol: 'PI_XRPUSD',
      side: 'buy',
      size: null,
      price: null,
      stopLoss: null,
      takeProfit: null
    });

    const isTradeFormValid = computed(() => {
      return tradeForm.value.size > 0 && tradeForm.value.price > 0;
    });

    const filteredPairs = computed(() => {
      const search = symbolSearch.value.toLowerCase();
      return FUTURES_PAIRS.filter(pair => {
        const name = pair.name.toLowerCase();
        const type = pair.type.toLowerCase();
        return name.includes(search) || type.includes(search);
      });
    });

    const handleImageError = (event) => {
      const coin = event.target.alt.toLowerCase();
      // Try another CDN if the first one fails
      event.target.src = `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/32/icon/${coin}.png`;
      // Add a second error handler for final fallback
      event.target.onerror = () => {
        event.target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="%23555"/><text x="16" y="22" font-size="14" fill="%23fff" text-anchor="middle">${coin.substring(0,3).toUpperCase()}</text></svg>`;
        event.target.onerror = null;
      };
    };

    const selectPair = (pair) => {
      tradeForm.value.symbol = pair.symbol;
      showDropdown.value = false;
    };

    const formatOptionText = (pair) => {
      const data = marketData.value[pair.symbol] || {};
      const price = data.price || '';
      const change = data.change || '';
      const volume = data.volume || '';
      const fundingRate = data.fundingRate || '';
      
      return `${pair.name} ${pair.type} (${pair.leverage}x) ${price ? `$${price}` : ''} ${change ? `${change}%` : ''} ${volume ? `${volume}K USD` : ''} ${fundingRate ? `${fundingRate}%/hr` : ''}`;
    };

    const fetchSymbolMarketData = async (symbol) => {
      try {
        const response = await axios.get(`https://futures.kraken.com/derivatives/api/v3/tickers`);
        if (response.data && response.data.tickers) {
          const ticker = response.data.tickers.find(t => t.symbol === symbol);
          if (ticker) {
            marketData.value[symbol] = {
              price: parseFloat(ticker.last).toFixed(2),
              change: parseFloat(ticker.change24h).toFixed(2),
              volume: (parseFloat(ticker.vol24h) / 1000).toFixed(2),
              fundingRate: parseFloat(ticker.fundingRate || 0).toFixed(4)
            };
          }
        }
      } catch (error) {
        console.error('Error fetching market data:', error);
      }
    };

    const placeTrade = async () => {
      if (!isTradeFormValid.value) {
        tradeError.value = 'Please fill in all required fields';
        return;
      }

      try {
        // Validate trade parameters
        const price = parseFloat(tradeForm.value.price);
        
        if (price <= 0) {
          tradeError.value = 'Invalid price';
          return;
        }

        // Send trade to backend
        const response = await axios.post('/api/kraken/futures/trade', {
          symbol: tradeForm.value.symbol,
          side: tradeForm.value.side,
          size: parseFloat(tradeForm.value.size),
          price: price,
          stopLoss: tradeForm.value.stopLoss ? parseFloat(tradeForm.value.stopLoss) : null,
          takeProfit: tradeForm.value.takeProfit ? parseFloat(tradeForm.value.takeProfit) : null
        });

        if (response.data.success) {
          // Clear form and error
          tradeForm.value.size = null;
          tradeForm.value.price = null;
          tradeForm.value.stopLoss = null;
          tradeForm.value.takeProfit = null;
          tradeError.value = null;

          // Emit event to refresh positions
          emit('trade-placed');
        } else {
          tradeError.value = response.data.error || 'Failed to place trade';
        }
      } catch (error) {
        console.error('Trade error:', error);
        tradeError.value = error.response?.data?.error || 'Failed to place trade';
      }
    };

    // Start market data polling
    let marketDataInterval;
    onMounted(() => {
      // Initial fetch
      fetchSymbolMarketData(tradeForm.value.symbol);
      
      // Poll every 5 seconds
      marketDataInterval = setInterval(() => {
        fetchSymbolMarketData(tradeForm.value.symbol);
      }, 5000);

      // Handle dropdown clicks
      document.addEventListener('click', (e) => {
        const dropdown = document.querySelector('.kraken-custom-dropdown');
        const searchInput = document.querySelector('.kraken-search-input');
        if (dropdown && !dropdown.contains(e.target) && !searchInput.contains(e.target)) {
          showDropdown.value = false;
        }
      });
    });

    // Clean up interval
    onUnmounted(() => {
      if (marketDataInterval) {
        clearInterval(marketDataInterval);
      }
    });

    // Watch for symbol changes to update market data
    watch(() => tradeForm.value.symbol, (newSymbol) => {
      fetchSymbolMarketData(newSymbol);
    });

    return {
      tradeForm,
      tradeError,
      symbolSearch,
      showDropdown,
      filteredPairs,
      isTradeFormValid,
      handleImageError,
      selectPair,
      formatOptionText,
      placeTrade,
      FUTURES_PAIRS
    };
  }
};
</script>

<style scoped>
.kraken-trade-section {
  width: 400px;
  padding: 20px;
  background: #252525;
  border-radius: 8px;
  margin-right: 20px;
  border: 1px solid #3d3d3d;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.kraken-trade-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.kraken-form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kraken-symbol-search {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
}

.kraken-custom-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 300px;
  overflow-y: auto;
  background: #2d2d2d;
  border: 1px solid #3d3d3d;
  border-radius: 4px;
  z-index: 1000;
  margin-top: 4px;
}

.kraken-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.kraken-dropdown-item:hover,
.kraken-dropdown-item.active {
  background: #353535;
}

.kraken-pair-info {
  font-family: monospace;
  white-space: pre;
  color: #e0e0e0;
}

.kraken-crypto-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.kraken-search-input {
  padding: 8px 12px;
  background: #2d2d2d;
  border: 1px solid #3d3d3d;
  border-radius: 4px;
  color: #e0e0e0;
  font-size: 0.9rem;
  width: 100%;
}

.kraken-search-input:focus {
  border-color: #4a9eff;
  outline: none;
}

.kraken-search-input::placeholder {
  color: #666;
}

.kraken-side-buttons {
  display: flex;
  gap: 10px;
}

.kraken-side-button {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  color: white;
}

.kraken-side-button:first-child {
  background: #1b5e20;
}

.kraken-side-button:first-child:hover,
.kraken-side-button:first-child.active {
  background: #2e7d32;
}

.kraken-side-button:last-child {
  background: #b71c1c;
}

.kraken-side-button:last-child:hover,
.kraken-side-button:last-child.active {
  background: #d32f2f;
}

.kraken-trade-input {
  padding: 8px 12px;
  background: #2d2d2d;
  border: 1px solid #3d3d3d;
  border-radius: 4px;
  color: #e0e0e0;
  font-size: 0.9rem;
  font-family: monospace;
}

.kraken-trade-input:focus {
  border-color: #4a9eff;
  outline: none;
}

.kraken-trade-number-input {
  padding: 8px 12px;
  background: #2d2d2d;
  border: 1px solid #3d3d3d;
  border-radius: 4px;
  color: #e0e0e0;
  font-size: 0.9rem;
  font-family: monospace;
}

.kraken-trade-number-input:focus {
  border-color: #4a9eff;
  outline: none;
}

.kraken-place-trade-button {
  padding: 12px;
  border: none;
  border-radius: 4px;
  background: #1e88e5;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.kraken-place-trade-button:hover:not(:disabled) {
  background: #1976d2;
}

.kraken-place-trade-button:disabled {
  background: #444;
  cursor: not-allowed;
  opacity: 0.7;
}

.kraken-error-message {
  color: #ff4842;
  padding: 12px;
  background: rgba(255, 72, 66, 0.2);
  border-radius: 6px;
  margin-top: 8px;
  border: 1px solid rgba(255, 72, 66, 0.5);
}
</style>
