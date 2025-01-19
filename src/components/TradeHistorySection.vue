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
          <div v-for="trade in trades" :key="trade.id || trade._id" 
           class="trade-card" 
           :class="{
              'open': trade.status === 'OPEN',
              'long': trade.isLong,
              'short': !trade.isLong
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
                      @click="updateTradeStatus(trade.id, 'TARGET_HIT')"
                      :disabled="trade.status !== 'OPEN'"
                    >
                      Target Hit ✅
                    </button>
                    <button 
                      class="action-button failure-btn"
                      @click="updateTradeStatus(trade.id, 'STOPLOSS_HIT')"
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
import '../assets/styles/TradeHistorySection.css';
import { ref, onMounted, watch } from 'vue';
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
  setup(props) {
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
          return status || 'OPEN';
      }
    };

    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
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

    const updateTradeStatus = async (tradeId, status) => {
      try {
        console.log('Updating trade status:', { tradeId, status });
        const { trade, stats } = await store.dispatch('trades/updateTradeStatus', { 
          tradeId: tradeId.toString(), 
          status 
        });
        
        // Update risk management stats
        if (stats) {
          await store.dispatch('riskManagement/updateAfterTrade', {
            status: trade.status,
            potentialProfit: trade.potentialProfit,
            potentialLoss: trade.potentialLoss
          });
        }
        
        await fetchTrades(); // Refresh the list after update
      } catch (error) {
        console.error('Error updating trade status:', error);
        // TODO: Add error notification
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

    onMounted(async () => {
      await fetchTrades();
    });

    return {
      trades,
      loading,
      editingTrade,
      getStatusText,
      formatDate,
      updateTradeStatus,
      fetchTrades,
      startEdit,
      cancelEdit,
      saveEdit,
      confirmDelete
    };
  }
};
</script>