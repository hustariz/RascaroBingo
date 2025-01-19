<template>
  <div class="admin-panel">
    <h2 class="feature-title">Admin Panel</h2>
    <div class="feature-box">
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <div v-else-if="!isAdmin" class="error-message">
        Access denied. Admin privileges required.
      </div>
      
      <div v-else class="admin-content">
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
        
        <div v-else class="users-table">
          <div class="table-header">
            <div class="header-cell">Username</div>
            <div class="header-cell">Email</div>
            <div class="header-cell">Status</div>
            <div class="header-cell">Admin</div>
            <div class="header-cell">Actions</div>
          </div>
          
          <div v-if="filteredUsers.length === 0" class="no-results">
            No users found
          </div>
          
          <div v-else v-for="user in filteredUsers" :key="user._id" class="table-row">
            <div class="cell username-cell">
              <span v-if="user.editingUsername" class="username-edit-container">
                <input 
                  v-model="user.newUsername" 
                  type="text" 
                  class="username-input"
                  @keyup.enter="updateUsername(user)"
                  @keyup.esc="cancelUsernameEdit(user)"
                  ref="usernameInput"
                >
                <div class="username-actions">
                  <button class="icon-button confirm" @click="updateUsername(user)" title="Save">
                    <font-awesome-icon icon="check" />
                  </button>
                  <button class="icon-button cancel" @click="cancelUsernameEdit(user)" title="Cancel">
                    <font-awesome-icon icon="times" />
                  </button>
                </div>
              </span>
              <span v-else class="username-display">
                {{ user.username }}
                <button class="icon-button edit" @click="startUsernameEdit(user)" title="Edit Username">
                  <font-awesome-icon icon="pencil-alt" />
                </button>
              </span>
            </div>
            <div class="cell email-cell">
              <span v-if="user.editing" class="email-edit-container">
                <input 
                  v-model="user.newEmail" 
                  type="text" 
                  class="email-input"
                  @keyup.enter="updateEmail(user)"
                  @keyup.esc="cancelEmailEdit(user)"
                  ref="emailInput"
                >
                <div class="email-actions">
                  <button class="icon-button confirm" @click="updateEmail(user)" title="Save">
                    <font-awesome-icon icon="check" />
                  </button>
                  <button class="icon-button cancel" @click="cancelEmailEdit(user)" title="Cancel">
                    <font-awesome-icon icon="times" />
                  </button>
                </div>
              </span>
              <span v-else class="email-display">
                <span class="email-text">{{ user.email }}</span>
                <div class="email-actions">
                  <button class="icon-button edit" @click="startEmailEdit(user)" title="Edit Email">
                    <font-awesome-icon icon="pencil-alt" />
                  </button>
                  <span v-if="user.isEmailVerified" class="verified-icon" title="Email Verified">
                    <font-awesome-icon icon="check-circle" />
                  </span>
                  <button v-else class="icon-button verify" @click="promptVerification(user)" title="Send Verification Email">
                    <font-awesome-icon icon="envelope" />
                  </button>
                </div>
              </span>
            </div>
            <div class="cell">
              <span :class="['status-badge', user.isPaidUser ? 'premium' : 'normal']">
                {{ user.isPaidUser ? 'Premium' : 'Normal' }}
              </span>
            </div>
            <div class="cell">
              <span :class="['status-badge', user.isAdmin ? 'admin' : 'normal']">
                {{ user.isAdmin ? 'Admin' : 'User' }}
              </span>
            </div>
            <div class="cell actions">
              <button 
                @click="togglePremiumStatus(user)"
                :class="['action-button', user.isPaidUser ? 'remove' : 'add']"
                :disabled="user.updating"
              >
                {{ user.updating ? 'Updating...' : (user.isPaidUser ? 'Remove Premium' : 'Add Premium') }}
              </button>
              <button 
                @click="toggleAdminStatus(user)"
                :class="['action-button', user.isAdmin ? 'remove' : 'add']"
                :disabled="user.updating"
              >
                {{ user.updating ? 'Updating...' : (user.isAdmin ? 'Remove Admin' : 'Make Admin') }}
              </button>
              <button 
                class="icon-button delete-button" 
                @click="confirmDelete(user)"
                title="Delete user"
              >
                <font-awesome-icon icon="trash-alt" />
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
      users: [],
      isAdmin: false,
      successMessage: null
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
          updating: false,
          editing: false,
          editingUsername: false,
          newEmail: user.email,
          newUsername: user.username
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
      } catch (err) {
        this.error = 'Failed to update user status. Please try again.';
        console.error('Error updating user status:', err);
      } finally {
        user.updating = false;
      }
    },
    
    async toggleAdminStatus(user) {
      try {
        user.updating = true;
        await api.updateUserAdminStatus(user._id, !user.isAdmin);
        user.isAdmin = !user.isAdmin;
      } catch (err) {
        this.error = 'Failed to update admin status. Please try again.';
        console.error('Error updating admin status:', err);
      } finally {
        user.updating = false;
      }
    },
    
    startEmailEdit(user) {
      user.editing = true;
      user.newEmail = user.email;
      this.$nextTick(() => {
        this.$refs.emailInput?.[0]?.focus();
      });
    },

    cancelEmailEdit(user) {
      user.editing = false;
      user.newEmail = user.email;
    },

    async updateEmail(user) {
      try {
        user.updating = true;
        await api.updateUserEmail(user._id, user.newEmail);
        user.email = user.newEmail;
        user.editing = false;
        this.showSuccess('Email updated successfully');
      } catch (err) {
        this.error = 'Failed to update email. Please try again.';
        console.error('Error updating email:', err);
      } finally {
        user.updating = false;
      }
    },

    startUsernameEdit(user) {
      user.editingUsername = true;
      user.newUsername = user.username;
      this.$nextTick(() => {
        this.$refs.usernameInput?.[0]?.focus();
      });
    },

    cancelUsernameEdit(user) {
      user.editingUsername = false;
      user.newUsername = user.username;
    },

    async updateUsername(user) {
      try {
        user.updating = true;
        await api.updateUsername(user._id, user.newUsername);
        user.username = user.newUsername;
        user.editingUsername = false;
        this.showSuccess('Username updated successfully');
      } catch (err) {
        this.error = 'Failed to update username. Please try again.';
        console.error('Error updating username:', err);
      } finally {
        user.updating = false;
      }
    },

    async promptVerification(user) {
      if (confirm(`Send verification email to ${user.email}?`)) {
        try {
          user.updating = true;
          await api.sendVerificationEmail(user._id);
          this.showSuccess('Verification email sent successfully');
        } catch (err) {
          this.error = 'Failed to send verification email. Please try again.';
          console.error('Error sending verification:', err);
        } finally {
          user.updating = false;
        }
      }
    },

    async confirmDelete(user) {
      if (confirm(`Are you sure you want to delete user ${user.username}?`)) {
        try {
          await api.deleteUser(user._id);
          this.users = this.users.filter(u => u._id !== user._id);
          this.showSuccess('User deleted successfully');
        } catch (err) {
          this.error = 'Failed to delete user. Please try again.';
          console.error('Error deleting user:', err);
        }
      }
    },

    showSuccess(message) {
      const prevError = this.error;
      this.error = null;
      this.$nextTick(() => {
        this.successMessage = message;
        setTimeout(() => {
          this.successMessage = null;
          if (prevError) this.error = prevError;
        }, 3000);
      });
    }
  },

  async created() {
    try {
      const currentUser = await api.getCurrentUser();
      this.isAdmin = currentUser.isAdmin;
      if (this.isAdmin) {
        await this.loadUsers();
      }
    } catch (err) {
      this.error = 'Failed to verify admin status.';
      console.error('Error verifying admin status:', err);
    }
  }
};
</script>

<style scoped>
.admin-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
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
  grid-template-columns: 2fr 3fr 1fr 1fr 2fr;
  background: rgb(238, 175, 17);
  padding: 1rem;
  font-weight: bold;
  color: black;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 3fr 1fr 1fr 2fr;
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

.username-cell, .email-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.username-edit-container, .email-edit-container {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.username-text, .email-text {
  flex: 1;
}

.username-actions, .email-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 4px;
  white-space: nowrap;
}

.icon-button {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.icon-button:hover {
  transform: translateY(-1px);
}

.icon-button.edit {
  color: #f39c12;
}

.icon-button.edit:hover {
  color: #f1c40f;
  filter: drop-shadow(0 0 4px rgba(243, 156, 18, 0.4));
}

.icon-button.verify {
  color: #2ecc71;
}

.icon-button.verify:hover {
  color: #27ae60;
  filter: drop-shadow(0 0 4px rgba(46, 204, 113, 0.4));
}

.icon-button.confirm {
  color: #2ecc71;
}

.icon-button.confirm:hover {
  color: #27ae60;
  filter: drop-shadow(0 0 4px rgba(46, 204, 113, 0.4));
}

.icon-button.cancel {
  color: #e74c3c;
}

.icon-button.cancel:hover {
  color: #c0392b;
  filter: drop-shadow(0 0 4px rgba(231, 76, 60, 0.4));
}

.username-input, .email-input {
  padding: 4px 8px;
  border: 1px solid rgba(238, 175, 17, 0.3);
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.2);
  color: white;
  font-size: 0.9rem;
  width: 200px;
}

.username-input:focus, .email-input:focus {
  outline: none;
  border-color: rgb(238, 175, 17);
  box-shadow: 0 0 4px rgba(238, 175, 17, 0.4);
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  display: inline-block;
  font-weight: bold;
  transition: all 0.3s ease;
}

.status-badge.premium {
  background: linear-gradient(45deg, #ffd700, #ffa500);
  color: black;
  box-shadow: 0 2px 10px rgba(255, 215, 0, 0.3);
}

.status-badge.admin {
  background: linear-gradient(45deg, #8e44ad, #9b59b6);
  color: white;
  box-shadow: 0 2px 10px rgba(142, 68, 173, 0.3);
}

.status-badge.normal {
  background: linear-gradient(45deg, #2c3e50, #34495e);
  color: white;
  box-shadow: 0 2px 10px rgba(52, 73, 94, 0.3);
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
  background: rgba(231, 76, 60, 0.1);
  border-radius: 8px;
  margin: 1rem 0;
}

.loading-message {
  color: rgb(238, 175, 17);
}

.actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.verified-icon {
  color: #4CAF50;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
}

.verified-icon:hover {
  filter: brightness(1.1);
}

.email-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  overflow: hidden;
}

.email-display {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.email-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.email-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.email-edit-container {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.email-input {
  flex: 1;
  min-width: 0;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.icon-button {
  padding: 4px 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #666;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-button:hover {
  color: #4CAF50;
}

.delete-button:hover {
  color: #f44336;
}

button {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 4px;
}

button.active {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.loading {
  opacity: 0.5;
  pointer-events: none;
}

.error {
  color: #f44336;
  margin: 10px 0;
}

.success {
  color: #4CAF50;
  margin: 10px 0;
}
</style>
