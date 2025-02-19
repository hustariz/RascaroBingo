<template>
  <div class="modal" v-if="isVisible" @click.self="$emit('close')">
    <div class="trade-history-container widget-container" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
      <div class="section-header">
        <h2>Trade History</h2>
        <div class="header-buttons">
          <button class="action-button clear-history" title="Clear Trade History" @click="confirmClearHistory">
            🧹
          </button>
          <button class="action-button nuke-positions" title="Close All Positions" @click="confirmNukePositions">
            💣
            <span v-if="openTradesCount > 0" class="notification-bubble">{{ openTradesCount }}</span>
          </button>
        </div>
      </div>
      <button class="close-button" @click="$emit('close')">×</button>
      
      <div class="trade-history-content">
        <div v-if="loading" class="loading">
          Loading trades...
        </div>
        
        <div v-else-if="trades.length === 0" class="no-trades">
          No trades recorded yet
        </div>
        
        <div v-else class="trades-list">
          <div v-for="trade in trades" :key="trade.id || trade._id" 
           class="trade-card" 
           :class="{
              'open': trade.status === 'OPEN',
              'long': trade.isLong,
              'short': !trade.isLong,
              'newest': trade === trades[0]
            }">
            <!-- Normal View -->
            <div v-if="!editingTrade || editingTrade.id !== (trade.id || trade._id)">
              <div class="trade-header" :class="trade.isLong ? 'long' : 'short'">
                <span class="trade-type">{{ trade.isLong ? 'Long' : 'Short' }}</span>
                <span class="trade-symbol">{{ trade.pair }}</span>
                <span class="trade-date">{{ formatDate(trade.date) }}</span>
              </div>
              
              <div class="trade-details">
                <div class="price-details">
                  <div class="price-item">
                    <span class="label">Stoploss:</span>
                    <span class="value">${{ trade.stopLoss }}</span>
                  </div>
                  <div class="price-item">
                    <span class="label">Entry:</span>
                    <span class="value">${{ trade.entryPrice }}</span>
                  </div>
                  <div class="price-item">
                    <span class="label">Target:</span>
                    <span class="value">${{ trade.takeProfit }}</span>
                  </div>
                  <div class="price-item">
                    <span class="label">R/R:</span>
                    <span class="value">{{ trade.riskRewardRatio }}R</span>
                  </div>
                </div>
                
                <div v-if="trade.notes" class="trade-idea">
                  <strong>Notes:</strong> {{ trade.notes }}
                </div>
                
                <div class="status-actions-container">
                  <div class="status-section">
                    <div class="trade-status">
                      Status: 
                      <span :class="{
                        'target-hit': trade.status === 'TARGET_HIT',
                        'stoploss-hit': trade.status === 'STOPLOSS_HIT',
                        'open': trade.status === 'OPEN',
                        'closed': trade.status === 'TARGET_HIT' || trade.status === 'STOPLOSS_HIT'
                      }">
                        {{ getStatusText(trade.status) }}
                      </span>
                    </div>
                  </div>
                  
                  <div class="trade-actions">
                    <button class="action-button edit-btn" @click="startEdit(trade)">✏️</button>
                    <button class="action-button delete-btn" @click="confirmDelete(trade.id)">🗑️</button>
                    <button 
                      class="action-button success-btn"
                      @click="updateTradeStatus(trade, 'TARGET_HIT')"
                      v-if="trade.status === 'OPEN'"
                    >
                      Target Hit ✅
                    </button>
                    <button 
                      class="action-button failure-btn"
                      @click="updateTradeStatus(trade, 'STOPLOSS_HIT')"
                      v-if="trade.status === 'OPEN'"
                    >
                      Stoploss Hit ❌
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Edit Form -->
            <div v-else class="edit-form">
              <div class="edit-header">
                <h3>Edit Trade</h3>
                <button class="close-button" @click="cancelEdit">×</button>
              </div>
              <div class="edit-content">
                <div class="form-group">
                  <label>Pair:</label>
                  <input type="text" v-model="editingTrade.pair">
                </div>
                <div class="form-group">
                  <label>Stoploss ($):</label>
                  <input type="number" v-model="editingTrade.stopLoss">
                </div>
                <div class="form-group">
                  <label>Entry ($):</label>
                  <input type="number" v-model="editingTrade.entryPrice">
                </div>
                <div class="form-group">
                  <label>Target ($):</label>
                  <input type="number" v-model="editingTrade.takeProfit">
                </div>
                <div class="form-group">
                  <label>Notes:</label>
                  <textarea v-model="editingTrade.notes"></textarea>
                </div>
                <div class="edit-actions">
                  <button class="action-button save-btn" @click="saveEdit">
                    Save Changes
                  </button>
                  <button class="action-button cancel-btn" @click="cancelEdit">
                    Cancel
                  </button>
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
import '@/assets/styles/TradeHistorySection.css';
import { ref, onMounted, watch, computed } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'TradeHistorySection',
  props: {
    isVisible: {
      type: Boolean,
      required: true
    },
    isSidebarCollapsed: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const store = useStore();
    const loading = ref(true);
    const editingTrade = ref(null);
    const openTradesCount = computed(() => store.getters['trades/openTradesCount']);

    // Computed property to sort trades by status (open first) and then by date
    const trades = computed(() => {
      return store.state.trades.trades
        .map(trade => ({
          ...trade,
          id: trade._id || trade.id // Ensure ID is always set
        }))
        .sort((a, b) => {
          // First sort by status (OPEN trades first)
          if (a.status === 'OPEN' && b.status !== 'OPEN') return -1;
          if (a.status !== 'OPEN' && b.status === 'OPEN') return 1;
          
          // Then sort by date within each group
          return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
        });
    });

    const fetchTrades = async () => {
      try {
        loading.value = true;
        await store.dispatch('trades/fetchTrades');
      } catch (error) {
        console.error('Error fetching trades:', error);
      } finally {
        loading.value = false;
      }
    };

    // Watch for changes in isVisible prop
    watch(() => props.isVisible, (newValue) => {
      if (newValue) {
        fetchTrades();
      }
    });

    // Initial fetch if visible
    if (props.isVisible) {
      fetchTrades();
    }

    const getStatusText = (status) => {
      switch(status) {
        case 'TARGET_HIT':
          return 'WIN ✅';
        case 'STOPLOSS_HIT':
          return 'LOSS ❌';
        case 'OPEN':
          return 'OPEN';
        default:
          return status || 'OPEN';
      }
    };

    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    const updateTradeStatus = async (trade, status) => {
      try {
        // Get current risk management state
        const riskState = store.state.riskManagement;
        
        // Check if we're hitting stoploss and already at max SL
        if (status === 'STOPLOSS_HIT' && riskState.slTaken >= 3) {
          alert('You have reached the maximum number of stoploss trades for today. Take a break and come back tomorrow!');
          return;
        }
        
        // Calculate P/L based on trade type and status
        let profitLoss = 0;
        if (status === 'TARGET_HIT') {
          profitLoss = trade.isLong ? 
            trade.takeProfit - trade.entryPrice :
            trade.entryPrice - trade.takeProfit;
        } else if (status === 'STOPLOSS_HIT') {
          profitLoss = trade.isLong ?
            trade.stopLoss - trade.entryPrice :
            trade.entryPrice - trade.stopLoss;
        }

        // Ensure we have a valid trade ID
        const tradeId = trade._id || trade.id;
        if (!tradeId) {
          console.error('Trade is missing both _id and id:', trade);
          await fetchTrades(); // Refresh trades to get proper IDs
          return;
        }

        // Update trade status
        await store.dispatch('trades/updateTradeStatus', {
          tradeId,
          status,
          profitLoss
        });

        // Refresh trades to ensure everything is in sync
        await fetchTrades();
      } catch (error) {
        console.error('Error updating trade status:', error);
        await fetchTrades(); // Refresh trades in case of error
      }
    };

    const startEdit = (trade) => {
      editingTrade.value = { ...trade };
    };

    const cancelEdit = () => {
      editingTrade.value = null;
    };

    const saveEdit = async () => {
      try {
        await store.dispatch('trades/updateTrade', editingTrade.value);
        await fetchTrades();
        editingTrade.value = null;
      } catch (error) {
        console.error('Error saving trade:', error);
      }
    };

    const confirmDelete = async (tradeId) => {
      if (confirm('Are you sure you want to delete this trade?')) {
        try {
          await store.dispatch('trades/deleteTrade', tradeId.toString());
          await fetchTrades(); // Refresh the list after deletion
        } catch (error) {
          console.error('Error deleting trade:', error);
        }
      }
    };

    const confirmClearHistory = async () => {
      if (confirm('Are you sure you want to clear your trade history?\nThis will hide all closed trades but keep them in the database for statistics.')) {
        try {
          await store.dispatch('trades/clearTradeHistory');
        } catch (error) {
          console.error('Error clearing trade history:', error);
        }
      }
    };

    const confirmNukePositions = async () => {
      if (confirm('ARE YOU SURE YOU WANT TO CLOSE ALL YOUR POSITIONS AT MARKET PRICE?')) {
        try {
          await store.dispatch('trades/nukePositions');
          await fetchTrades(); // Refresh the list after nuking
        } catch (error) {
          console.error('Error nuking positions:', error);
        }
      }
    };

    onMounted(async () => {
      await fetchTrades();
    });

    return {
      trades,
      loading,
      editingTrade,
      openTradesCount,
      getStatusText,
      formatDate,
      updateTradeStatus,
      fetchTrades,
      startEdit,
      cancelEdit,
      saveEdit,
      confirmDelete,
      confirmClearHistory,
      confirmNukePositions
    };
  }
};
</script>

<style scoped>
.notification-bubble {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #ff4444;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 12px;
  font-weight: bold;
  min-width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.action-button {
  position: relative;
}
</style>