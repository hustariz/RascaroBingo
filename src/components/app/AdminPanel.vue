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
              <div class="user-header">
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
                  <button 
                    class="icon-button"
                    @click="sendPasswordReset(user)"
                    title="Reset Password"
                  >
                    <font-awesome-icon icon="key" />
                  </button>
                </span>
              </div>
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
import '@/assets/styles/AdminPanel.css';
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

    async sendPasswordReset(user) {
      try {
        await api.requestPasswordReset(user.email);
        this.showSuccess(`Password reset email sent to ${user.email}`);
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to send password reset email';
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
