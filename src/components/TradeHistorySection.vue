<template>
  <div class="modal" v-if="isVisible"    @click.self="$emit('close')">
    <div class="trade-history-container widget-container">
      <div class="section-header">
        <h2>Trade History</h2>
        <button class="close-button" @click="$emit('close')">×</button>
      </div>
      
      <div class="trade-history-content">
        <div v-if="loading" class="loading">
          Loading trades...
        </div>
        
        <div v-else-if="trades.length === 0" class="no-trades">
          No trades recorded yet
        </div>
        
        <div v-else class="trades-list">
          <div v-for="trade in trades" :key="trade._id" class="trade-card">
            <div class="trade-header" :class="trade.type.toLowerCase()">
              <span class="trade-type">{{ trade.type }}</span>
              <span class="trade-date">{{ formatDate(trade.timestamp) }}</span>
            </div>
            
            <div class="trade-details">
              <div class="price-details">
                <div class="price-item">
                  <span class="label">Entry:</span>
                  <span class="value">${{ trade.entry }}</span>
                </div>
                <div class="price-item">
                  <span class="label">Target:</span>
                  <span class="value">${{ trade.target }}</span>
                </div>
                <div class="price-item">
                  <span class="label">Stoploss:</span>
                  <span class="value">${{ trade.stoploss }}</span>
                </div>
                <div class="price-item">
                  <span class="label">R/R:</span>
                  <span class="value">{{ trade.riskReward }}R</span>
                </div>
              </div>
              
              <div v-if="trade.tradeIdea" class="trade-idea">
                <strong>Idea:</strong> {{ trade.tradeIdea }}
              </div>
              
              <div class="trade-status" v-if="trade.status">
                Status: <span :class="trade.status.toLowerCase()">{{ trade.status }}</span>
              </div>
              
              <div class="trade-actions" v-else>
                <button 
                  class="action-button success-btn"
                  @click="updateTradeStatus(trade._id, 'TARGET_HIT')"
                >
                  Target Hit ✅
                </button>
                <button 
                  class="action-button failure-btn"
                  @click="updateTradeStatus(trade._id, 'STOPLOSS_HIT')"
                >
                  Stoploss Hit ❌
                </button>
                <div class="modal" v-if="isVisible">
                  <div class="trade-history-container" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
                    <!-- Rest of your template -->
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import '../assets/styles/TradeHistorySection.css';
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'TradeHistorySection',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },    isSidebarCollapsed: { // Add this prop
      type: Boolean,
      default: false
    }
  },
  setup() {
    const store = useStore();
    const trades = ref([]);
    const loading = ref(true);

    const fetchTrades = async () => {
      try {
        loading.value = true;
        const fetchedTrades = await store.dispatch('trades/fetchTrades');
        trades.value = fetchedTrades;
      } catch (error) {
        console.error('Error fetching trades:', error);
      } finally {
        loading.value = false;
      }
    };

    const updateTradeStatus = async (tradeId, status) => {
      try {
        await store.dispatch('trades/updateTradeStatus', { tradeId, status });
        await fetchTrades(); // Refresh trades after update
      } catch (error) {
        console.error('Error updating trade status:', error);
      }
    };

    const formatDate = (timestamp) => {
      return new Date(timestamp).toLocaleString();
    };

    onMounted(fetchTrades);

    return {
      trades,
      loading,
      updateTradeStatus,
      formatDate
    };
  }
}
</script>
