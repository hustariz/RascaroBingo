<template>
  <div class="modal" v-if="isVisible" @click.self="$emit('close')">
    <div class="trade-history-container widget-container" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
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
            <!-- Normal View -->
            <div v-if="!editingTrade || editingTrade._id !== trade._id">
              <div class="trade-header" :class="trade.type.toLowerCase()">
                <span class="trade-type">{{ trade.type }}</span>
                <span class="trade-date">{{ formatDate(trade.timestamp) }}</span>
              </div>
              
              <div class="trade-details">
                <div class="price-details">
                  <div class="price-item">
                    <span class="label">Stoploss:</span>
                    <span class="value">${{ trade.stoploss }}</span>
                  </div>
                  <div class="price-item">
                    <span class="label">Entry:</span>
                    <span class="value">${{ trade.entry }}</span>
                  </div>
                  <div class="price-item">
                    <span class="label">Target:</span>
                    <span class="value">${{ trade.target }}</span>
                  </div>
                  <div class="price-item">
                    <span class="label">R/R:</span>
                    <span class="value">{{ trade.riskReward }}R</span>
                  </div>
                </div>
                
                <div v-if="trade.tradeIdea" class="trade-idea">
                  <strong>Idea:</strong> {{ trade.tradeIdea }}
                </div>
                
                <div class="status-actions-container">
                  <div class="status-section">
                    <div class="trade-status">
                      Status: 
                      <span :class="trade.status.toLowerCase()">
                        {{ getStatusText(trade.status) }}
                      </span>
                    </div>
                  </div>
                  
                  <div class="trade-actions">
                    <button class="action-button edit-btn" @click="startEdit(trade)">✏️</button>
                    <button class="action-button delete-btn" @click="confirmDelete(trade._id)">🗑️</button>
                    <button 
                      class="action-button success-btn"
                      @click="updateTradeStatus(trade._id, 'TARGET_HIT')"
                      :disabled="trade.status !== 'OPEN'"
                    >
                      Target Hit ✅
                    </button>
                    <button 
                      class="action-button failure-btn"
                      @click="updateTradeStatus(trade._id, 'STOPLOSS_HIT')"
                      :disabled="trade.status !== 'OPEN'"
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
                  <label>Stoploss ($):</label>
                  <input type="number" v-model="editingTrade.stoploss">
                </div>
                <div class="form-group">
                  <label>Entry ($):</label>
                  <input type="number" v-model="editingTrade.entry">
                </div>
                <div class="form-group">
                  <label>Target ($):</label>
                  <input type="number" v-model="editingTrade.target">
                </div>
                <div class="form-group">
                  <label>Trade Idea:</label>
                  <textarea v-model="editingTrade.tradeIdea"></textarea>
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
import '../assets/styles/TradeHistorySection.css';
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'TradeHistorySection',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    isSidebarCollapsed: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    'store.state.riskManagement.adjustedTradeSize'(newSize) {
      console.log('Trade size updated in history:', newSize);
    }
  },
  setup(_, { emit }) {  // Change props to _ since we're not using it directly
    const store = useStore();
    const trades = ref([]);
    const loading = ref(true);
    const editingTrade = ref(null);

    const getStatusText = (status) => {
      switch(status) {
        case 'TARGET_HIT':
          return 'WIN ✅';
        case 'STOPLOSS_HIT':
          return 'LOSS ❌';
        case 'OPEN':
          return 'OPEN';
        default:
          return status;
      }
    };

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
        const trade = trades.value.find(t => t._id === tradeId);
        if (!trade) return;

        let profitLoss = 0;
        const tradeSize = store.state.riskManagement.adjustedTradeSize;

        // Calculate absolute points difference
        const points = trade.type === 'Long' 
          ? (status === 'TARGET_HIT' ? trade.target - trade.entry : trade.stoploss - trade.entry)
          : (status === 'TARGET_HIT' ? trade.entry - trade.target : trade.entry - trade.stoploss);

        // Calculate profit/loss based on fixed points
        profitLoss = Math.round(points * (tradeSize / trade.entry));

        console.log('Trade result:', {
          type: trade.type,
          entry: trade.entry,
          exit: status === 'TARGET_HIT' ? trade.target : trade.stoploss,
          tradeSize,
          profitLoss,
          calculation: {
            points,
            tradeSize,
            entry: trade.entry
          }
        });

        await store.dispatch('trades/updateTradeStatus', { tradeId, status });
        await store.dispatch('riskManagement/updateAfterTrade', { status, profitLoss });
        
        emit('trade-status-update', { status, profitLoss });
        await fetchTrades();
      } catch (error) {
        console.error('Error updating trade status:', error);
      }
    };

    const startEdit = (trade) => {
      editingTrade.value = { ...trade };
    };

    const saveEdit = async () => {
      try {
        if (!editingTrade.value) return;
        await store.dispatch('trades/updateTrade', editingTrade.value);
        editingTrade.value = null;
        await fetchTrades();
      } catch (error) {
        console.error('Error updating trade:', error);
      }
    };

    const cancelEdit = () => {
      editingTrade.value = null;
    };
    

    const confirmDelete = async (tradeId) => {
      if (confirm('Are you sure you want to delete this trade?')) {
        try {
          await store.dispatch('trades/deleteTrade', tradeId);
          await fetchTrades();
        } catch (error) {
          console.error('Error deleting trade:', error);
        }
      }
    };

    const formatDate = (timestamp) => {
      return new Date(timestamp).toLocaleString();
    };

    onMounted(fetchTrades);

    

    return {
      trades,
      loading,
      editingTrade,
      updateTradeStatus,
      startEdit,
      saveEdit,
      cancelEdit,
      confirmDelete,
      formatDate,
      getStatusText
    };
  }
}
</script>