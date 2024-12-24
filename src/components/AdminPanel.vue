<template>
  <div class="admin-panel">
    <h2 class="feature-title">Admin Panel</h2>
    <div class="feature-box">
      <div class="admin-content">
        <div class="search-box">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search users..."
            class="search-input"
          >
        </div>
        
        <div v-if="loading" class="loading-message">
          Loading users...
        </div>
        
        <div v-else-if="error" class="error-message">
          {{ error }}
        </div>
        
        <div v-else class="users-table">
          <div class="table-header">
            <div class="header-cell">Username</div>
            <div class="header-cell">Email</div>
            <div class="header-cell">Status</div>
            <div class="header-cell">Actions</div>
          </div>
          
          <div v-if="filteredUsers.length === 0" class="no-results">
            No users found
          </div>
          
          <div v-else v-for="user in filteredUsers" :key="user._id" class="table-row">
            <div class="cell">{{ user.username }}</div>
            <div class="cell">{{ user.email }}</div>
            <div class="cell">
              <span :class="['status-badge', user.isPaidUser ? 'premium' : 'normal']">
                {{ user.isPaidUser ? 'Premium' : 'Normal' }}
              </span>
            </div>
            <div class="cell">
              <button 
                @click="togglePremiumStatus(user)"
                :class="['action-button', user.isPaidUser ? 'remove' : 'add']"
                :disabled="user.updating"
              >
                {{ user.updating ? 'Updating...' : (user.isPaidUser ? 'Remove Premium' : 'Add Premium') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/services/api';

export default {
  name: 'AdminPanel',
  
  data() {
    return {
      searchQuery: '',
      loading: true,
      error: null,
      users: []
    };
  },

  computed: {
    filteredUsers() {
      const query = this.searchQuery.toLowerCase();
      return this.users.filter(user => 
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    }
  },

  methods: {
    async loadUsers() {
      try {
        this.loading = true;
        this.error = null;
        const response = await api.getAllUsers();
        this.users = response.map(user => ({
          ...user,
          updating: false
        }));
      } catch (err) {
        this.error = 'Failed to load users. Please try again.';
        console.error('Error loading users:', err);
      } finally {
        this.loading = false;
      }
    },
    
    async togglePremiumStatus(user) {
      try {
        user.updating = true;
        await api.updateUserPremiumStatus(user._id, !user.isPaidUser);
        user.isPaidUser = !user.isPaidUser;
      } catch (error) {
        console.error('Error updating user status:', error);
        this.$emit('error', 'Failed to update user status');
      } finally {
        user.updating = false;
      }
    }
  },

  async created() {
    await this.loadUsers();
  }
};
</script>

<style scoped>
.admin-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  min-height: 100vh;
}

.feature-title {
  font-family: 'Legendarie', sans-serif;
  color: rgb(238, 175, 17);
  font-size: 2.5rem;
  text-shadow: 
    2px 2px 0 rgba(0, 0, 0, 0.8),
    -2px -2px 0 rgba(0, 0, 0, 0.8),
    2px -2px 0 rgba(0, 0, 0, 0.8),
    -2px 2px 0 rgba(0, 0, 0, 0.8);
  margin-bottom: 2rem;
}

.feature-box {
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid rgb(238, 175, 17);
  border-radius: 10px;
  padding: 2rem;
  width: 100%;
  max-width: 1000px;
  margin: 2rem auto;
  box-shadow: 0 0 20px rgba(238, 175, 17, 0.2);
}

.search-box {
  margin-bottom: 2rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  border-radius: 5px;
  border: 1px solid rgb(238, 175, 17);
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 1rem;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.users-table {
  width: 100%;
  border-radius: 5px;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 3fr 1fr 2fr;
  background: rgb(238, 175, 17);
  padding: 1rem;
  font-weight: bold;
  color: black;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 3fr 1fr 2fr;
  padding: 1rem;
  border-bottom: 1px solid rgba(238, 175, 17, 0.2);
  align-items: center;
}

.table-row:hover {
  background: rgba(238, 175, 17, 0.1);
}

.cell {
  padding: 0.5rem;
  color: white;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: bold;
}

.status-badge.premium {
  background: linear-gradient(45deg, #ffd700, #ffa500);
  color: black;
}

.status-badge.normal {
  background: linear-gradient(45deg, #2c3e50, #34495e);
  color: white;
}

.action-button {
  padding: 0.5rem 1rem;
  border-radius: 5px;
  border: none;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-button.add {
  background: linear-gradient(45deg, #2ecc71, #27ae60);
  color: white;
}

.action-button.remove {
  background: linear-gradient(45deg, #e74c3c, #c0392b);
  color: white;
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.action-button:active {
  transform: translateY(0);
}

.loading-message,
.error-message,
.no-results {
  text-align: center;
  padding: 2rem;
  color: white;
  font-size: 1.1rem;
}

.error-message {
  color: #e74c3c;
}

.loading-message {
  color: rgb(238, 175, 17);
}
</style>
