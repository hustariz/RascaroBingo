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
            <div class="header-cell">Subscription</div>
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
            <div class="cell subscription-cell">
              <div v-if="user.loadingSubscription" class="loading-subscription">
                <font-awesome-icon icon="spinner" spin />
              </div>
              <div v-else-if="user.subscriptionDetails" class="subscription-info">
                <div class="subscription-status">
                  <span :class="['status-badge', user.subscriptionDetails.active ? 'active' : 'inactive']">
                    {{ user.subscriptionDetails.active ? 'Active' : 'Inactive' }}
                  </span>
                </div>
                <div v-if="user.subscriptionDetails.active" class="subscription-details">
                  <div class="subscription-plan">{{ formatPlanName(user.subscriptionDetails.plan) }}</div>
                  <div class="subscription-dates">
                    <div class="date-info">
                      <span class="date-label">End:</span> 
                      <span class="date-value">{{ formatDate(user.subscriptionDetails.endDate) }}</span>
                    </div>
                    <div class="date-info">
                      <span class="date-label">Days:</span> 
                      <span class="date-value">{{ user.subscriptionDetails.remainingDays }}</span>
                    </div>
                  </div>
                </div>
                <button 
                  class="icon-button subscription-edit" 
                  @click="openSubscriptionModal(user)"
                  title="Manage Subscription"
                >
                  <font-awesome-icon icon="edit" />
                </button>
              </div>
              <div v-else class="no-subscription">
                <button 
                  class="icon-button subscription-add" 
                  @click="openSubscriptionModal(user)"
                  title="Add Subscription"
                >
                  <font-awesome-icon icon="plus" />
                </button>
              </div>
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
    
    <!-- Subscription Management Modal -->
    <div v-if="showSubscriptionModal" class="modal-overlay">
      <div class="modal-content subscription-modal">
        <h3>Manage Subscription</h3>
        <div v-if="selectedUser" class="subscription-form">
          <div class="user-info">
            <strong>User:</strong> {{ selectedUser.username }}
          </div>
          
          <div class="form-group">
            <label>Subscription Plan</label>
            <select v-model="subscriptionForm.plan" class="form-control">
              <option value="quick">Quick Plan (10 days)</option>
              <option value="monthly">Monthly Plan (30 days)</option>
              <option value="quarterly">Quarterly Plan (90 days)</option>
              <option value="annual">Annual Plan (365 days)</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Action</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="subscriptionForm.action" value="add">
                Add Time
              </label>
              <label class="radio-label">
                <input type="radio" v-model="subscriptionForm.action" value="set-date">
                Set End Date
              </label>
              <label class="radio-label">
                <input type="radio" v-model="subscriptionForm.action" value="cancel">
                Cancel Subscription
              </label>
            </div>
          </div>
          
          <div v-if="subscriptionForm.action === 'set-date'" class="form-group">
            <label>End Date</label>
            <input 
              type="date" 
              v-model="subscriptionForm.endDate" 
              class="form-control"
              :min="getTodayDate()"
            >
          </div>
          
          <div class="subscription-summary">
            <div v-if="selectedUser.subscriptionDetails">
              <div><strong>Current Status:</strong> {{ selectedUser.subscriptionDetails.active ? 'Active' : 'Inactive' }}</div>
              <div v-if="selectedUser.subscriptionDetails.active">
                <div><strong>Current Plan:</strong> {{ formatPlanName(selectedUser.subscriptionDetails.plan) }}</div>
                <div><strong>End Date:</strong> {{ formatDate(selectedUser.subscriptionDetails.endDate) }}</div>
                <div><strong>Remaining Days:</strong> {{ selectedUser.subscriptionDetails.remainingDays }}</div>
              </div>
            </div>
          </div>
          
          <div class="modal-actions">
            <button @click="closeSubscriptionModal" class="cancel-button">
              Cancel
            </button>
            <button @click="updateSubscription" class="confirm-button" :disabled="subscriptionForm.processing">
              {{ subscriptionForm.processing ? 'Processing...' : 'Save Changes' }}
            </button>
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
      successMessage: null,
      showSubscriptionModal: false,
      selectedUser: null,
      subscriptionForm: {
        plan: 'monthly',
        action: 'add',
        endDate: null,
        processing: false,
        error: null,
        success: null
      }
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
          _id: user.id, // Add this line to ensure _id is always available
          updating: false,
          editing: false,
          editingUsername: false,
          newEmail: user.email,
          newUsername: user.username,
          loadingSubscription: false,
          subscriptionDetails: null
        }));
        
        // Load subscription details for each user
        this.users.forEach(user => this.loadUserSubscription(user));
      } catch (err) {
        this.error = 'Failed to load users. Please try again.';
        console.error('Error loading users:', err);
      } finally {
        this.loading = false;
      }
    },
    
    async loadUserSubscription(user) {
      try {
        // Check if user has a valid ID
        const userId = user._id || user.id; // Use either _id or id
        if (!userId) {
          console.error('Cannot load subscription: User ID is undefined', user);
          return;
        }
        
        user.loadingSubscription = true;
        console.log('Loading subscription for user:', userId);
        const response = await api.getUserSubscription(userId);
        console.log('Subscription response:', response);
        user.subscriptionDetails = response.subscription;
      } catch (err) {
        const userId = user._id || user.id;
        console.error(`Error loading subscription for user ${userId}:`, err);
      } finally {
        user.loadingSubscription = false;
      }
    },
    
    async togglePremiumStatus(user) {
      try {
        const userId = user._id || user.id;
        user.updating = true;
        await api.updateUserPremiumStatus(userId, !user.isPaidUser);
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
        const userId = user._id || user.id;
        user.updating = true;
        await api.updateUserAdminStatus(userId, !user.isAdmin);
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
        if (this.$refs.emailInput && this.$refs.emailInput.length) {
          this.$refs.emailInput[0].focus();
        }
      });
    },
    
    cancelEmailEdit(user) {
      user.editing = false;
      user.newEmail = user.email;
    },
    
    async updateEmail(user) {
      try {
        if (!user.newEmail) {
          this.error = 'Email cannot be empty.';
          return;
        }
        
        user.updating = true;
        const userId = user._id || user.id;
        await api.updateUserEmail(userId, user.newEmail);
        
        // Update the user's email
        user.email = user.newEmail;
        user.editing = false;
        
        this.showSuccess('Email updated successfully.');
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
        if (this.$refs.usernameInput && this.$refs.usernameInput.length) {
          this.$refs.usernameInput[0].focus();
        }
      });
    },
    
    cancelUsernameEdit(user) {
      user.editingUsername = false;
      user.newUsername = user.username;
    },
    
    async updateUsername(user) {
      try {
        if (!user.newUsername) {
          this.error = 'Username cannot be empty.';
          return;
        }
        
        user.updating = true;
        const userId = user._id || user.id;
        await api.updateUsername(userId, user.newUsername);
        
        // Update the user's username
        user.username = user.newUsername;
        user.editingUsername = false;
        
        this.showSuccess('Username updated successfully.');
      } catch (err) {
        this.error = 'Failed to update username. Please try again.';
        console.error('Error updating username:', err);
      } finally {
        user.updating = false;
      }
    },
    
    promptVerification(user) {
      if (confirm(`Send verification email to ${user.email}?`)) {
        this.sendVerificationEmail(user);
      }
    },
    
    async sendVerificationEmail(user) {
      try {
        user.updating = true;
        const userId = user._id || user.id;
        await api.sendVerificationEmail(userId);
        this.showSuccess('Verification email sent successfully.');
      } catch (err) {
        this.error = 'Failed to send verification email. Please try again.';
        console.error('Error sending verification email:', err);
      } finally {
        user.updating = false;
      }
    },
    
    confirmDelete(user) {
      if (confirm(`Are you sure you want to delete user ${user.username}? This action cannot be undone.`)) {
        this.deleteUser(user);
      }
    },
    
    async deleteUser(user) {
      try {
        user.updating = true;
        const userId = user._id || user.id;
        await api.deleteUser(userId);
        
        // Remove the user from the list
        this.users = this.users.filter(u => (u._id || u.id) !== userId);
        
        this.showSuccess('User deleted successfully.');
      } catch (err) {
        this.error = 'Failed to delete user. Please try again.';
        console.error('Error deleting user:', err);
      } finally {
        user.updating = false;
      }
    },
    
    async sendPasswordReset(user) {
      try {
        user.updating = true;
        await api.sendPasswordReset(user._id);
        this.showSuccess('Password reset email sent successfully');
      } catch (err) {
        this.error = 'Failed to send password reset. Please try again.';
        console.error('Error sending password reset:', err);
      } finally {
        user.updating = false;
      }
    },
    
    showSuccess(message) {
      this.successMessage = message;
      
      // Show toast notification
      if (this.$toast) {
        this.$toast.success(message);
      }
      
      // Clear message after 3 seconds
      setTimeout(() => {
        this.successMessage = null;
      }, 3000);
    },
    
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },
    
    formatPlanName(plan) {
      if (!plan) return 'None';
      
      const planNames = {
        'quick': 'Quick Plan (10 Days)',
        'monthly': 'Monthly Plan',
        'quarterly': 'Quarterly Plan',
        'annual': 'Annual Plan'
      };
      
      return planNames[plan] || plan;
    },
    
    openSubscriptionModal(user) {
      this.selectedUser = user;
      this.subscriptionForm = {
        action: 'add',
        plan: 'monthly',
        endDate: this.getTodayDate(),
        processing: false,
        error: null,
        success: null
      };
      this.showSubscriptionModal = true;
    },
    
    closeSubscriptionModal() {
      this.showSubscriptionModal = false;
      this.selectedUser = null;
    },
    
    getTodayDate() {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    
    async updateSubscription() {
      try {
        this.subscriptionForm.processing = true;
        
        const userId = this.selectedUser._id || this.selectedUser.id;
        const { action, plan, endDate } = this.subscriptionForm;
        
        if (action === 'add') {
          await api.adminAddSubscriptionTime(userId, plan);
        } else if (action === 'set-date') {
          await api.adminSetSubscriptionEndDate(userId, endDate);
        } else if (action === 'cancel') {
          await api.adminCancelSubscription(userId);
        }
        
        // Update the user's subscription details
        this.subscriptionForm.success = 'Subscription updated successfully';
        this.subscriptionForm.error = null;
        
        // Reload the subscription details
        const subscriptionResponse = await api.getUserSubscription(userId);
        this.selectedUser.subscriptionDetails = subscriptionResponse.subscription;
        
        // Close the modal after a short delay
        setTimeout(() => {
          this.closeSubscriptionModal();
        }, 1500);
      } catch (err) {
        this.subscriptionForm.error = 'Failed to update subscription. Please try again.';
        this.subscriptionForm.success = null;
        console.error('Error updating subscription:', err);
      } finally {
        this.subscriptionForm.processing = false;
      }
    }
  },

  created() {
    // Check if user is admin
    api.getCurrentUser()
      .then(user => {
        this.isAdmin = user.isAdmin;
        if (this.isAdmin) {
          this.loadUsers();
        }
      })
      .catch(err => {
        console.error('Error checking admin status:', err);
        this.error = 'Failed to verify admin privileges';
        this.isAdmin = false;
      });
  }
};
</script>

<style scoped>
/* Add these styles to your existing styles */
.subscription-cell {
  min-width: 180px;
}

.loading-subscription {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #aaa;
}

.subscription-info {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  position: relative;
}

.subscription-status {
  display: flex;
  align-items: center;
}

.status-badge.active {
  background: linear-gradient(45deg, #27ae60, #2ecc71);
  color: white;
}

.status-badge.inactive {
  background: linear-gradient(45deg, #7f8c8d, #95a5a6);
  color: white;
}

.subscription-details {
  font-size: 0.85rem;
  color: #ddd;
}

.subscription-plan {
  font-weight: bold;
  color: #f39c12;
}

.subscription-dates {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.8rem;
}

.date-info {
  display: flex;
  align-items: center;
  gap: 0.2rem;
}

.date-label {
  color: #aaa;
}

.date-value {
  color: white;
}

.subscription-edit, .subscription-add {
  position: absolute;
  top: 0;
  right: 0;
  color: #3498db;
}

.no-subscription {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #1a1a1a;
  border: 2px solid rgb(238, 175, 17);
  border-radius: 10px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
}

.subscription-modal h3 {
  color: rgb(238, 175, 17);
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.subscription-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.user-info {
  color: white;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  color: #ddd;
  font-size: 1rem;
}

.form-control {
  background: #2c3e50;
  border: 1px solid #34495e;
  color: white;
  padding: 0.7rem;
  border-radius: 5px;
  font-size: 1rem;
}

.radio-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ddd;
  cursor: pointer;
}

.subscription-summary {
  background: rgba(40, 40, 40, 0.5);
  padding: 1rem;
  border-radius: 5px;
  color: #ddd;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.cancel-button, .confirm-button {
  padding: 0.7rem 1.5rem;
  border-radius: 5px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-button {
  background: rgba(52, 73, 94, 0.2);
  color: white;
  border: 1px solid #34495e;
}

.cancel-button:hover {
  background: rgba(52, 73, 94, 0.4);
}

.confirm-button {
  background: rgba(39, 174, 96, 0.2);
  color: #2ecc71;
  border: 1px solid #27ae60;
}

.confirm-button:hover {
  background: rgba(39, 174, 96, 0.4);
}

.confirm-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
