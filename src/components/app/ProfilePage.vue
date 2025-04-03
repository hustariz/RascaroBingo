<template>
  <div class="profile-page">
    <h2 class="feature-title">Profile</h2>
    <div class="feature-box">
      <div class="profile-content">
        <font-awesome-icon icon="user" class="feature-icon" />
        <h3>User Profile</h3>
        
        <!-- User Badges Section -->
        <div class="user-badges">
          <div v-if="userInfo?.isAdmin" class="user-badge admin-badge">
            Admin User 👑
          </div>
          <div :class="['user-badge', userInfo?.isPaidUser ? 'premium-badge' : 'normal-badge']">
            {{ userInfo?.isPaidUser ? 'Premium User ⭐' : 'Normal User' }}
          </div>
          <div v-if="userInfo?.isEmailVerified" class="user-badge verified-badge">
            Email Verified ✓
          </div>
        </div>
        
        <!-- Subscription Info Section -->
        <div class="subscription-section" v-if="userInfo">
          <h4 class="section-title">Subscription Status</h4>
          
          <div v-if="loading" class="loading-indicator">
            <font-awesome-icon icon="spinner" spin />
            Loading subscription details...
          </div>
          
          <div v-else-if="subscriptionInfo" class="subscription-details">
            <div class="subscription-status" :class="{ active: subscriptionInfo.subscription.active }">
              <font-awesome-icon :icon="subscriptionInfo.subscription.active ? 'check-circle' : 'times-circle'" />
              <span>{{ subscriptionInfo.subscription.active ? 'Active' : 'Inactive' }}</span>
            </div>
            
            <div v-if="subscriptionInfo.subscription.active" class="subscription-info-grid">
              <div class="subscription-info-item">
                <div class="info-label">Plan</div>
                <div class="info-value">{{ formatPlanName(subscriptionInfo.subscription.plan) }}</div>
              </div>
              
              <div class="subscription-info-item">
                <div class="info-label">Start Date</div>
                <div class="info-value">{{ formatDate(subscriptionInfo.subscription.startDate) }}</div>
              </div>
              
              <div class="subscription-info-item">
                <div class="info-label">End Date</div>
                <div class="info-value">{{ formatDate(subscriptionInfo.subscription.endDate) }}</div>
              </div>
              
              <div class="subscription-info-item">
                <div class="info-label">Time Remaining</div>
                <div class="info-value remaining-time">
                  {{ subscriptionInfo.subscription.remainingDays }} days
                </div>
              </div>
            </div>
            
            <div v-if="subscriptionInfo.subscription.active" class="subscription-actions">
              <button @click="showCancelConfirmation = true" class="cancel-button">
                Cancel Subscription
              </button>
            </div>
            
            <div v-else class="subscription-upgrade">
              <p>Upgrade to premium to unlock all features!</p>
              <router-link to="/payment" class="upgrade-button">
                View Plans
              </router-link>
            </div>
          </div>
          
          <div v-else-if="error" class="error-message">
            {{ error }}
          </div>
          
          <!-- Cancel Confirmation Modal -->
          <div v-if="showCancelConfirmation" class="modal-overlay">
            <div class="modal-content">
              <h4>Cancel Subscription?</h4>
              <p>Are you sure you want to cancel your subscription?</p>
              <p class="modal-note">You will still have access until your current subscription period ends.</p>
              
              <div class="modal-actions">
                <button @click="showCancelConfirmation = false" class="cancel-action">
                  No, Keep It
                </button>
                <button @click="cancelSubscription" class="confirm-action">
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Future Features Section -->
        <div class="stats-preview">
          <p>Future features will include:</p>
          <ul>
            <li><strong>Trading Statistics</strong></li>
            <li><strong>Achievement Badges</strong></li>
            <li><strong>Performance Metrics</strong></li>
            <li><strong>Custom Settings</strong></li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/services/api';

export default {
  name: 'ProfilePage',
  
  data() {
    return {
      userInfo: null,
      subscriptionInfo: null,
      loading: true,
      error: null,
      showCancelConfirmation: false
    };
  },

  async created() {
    try {
      // Fetch user info
      this.userInfo = await api.getCurrentUser();
      
      // Fetch subscription details if user is logged in
      if (this.userInfo) {
        try {
          this.subscriptionInfo = await api.getSubscriptionDetails();
        } catch (subError) {
          console.error('Error fetching subscription info:', subError);
          this.error = 'Failed to load subscription information';
        }
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      this.error = 'Failed to load user information';
    } finally {
      this.loading = false;
    }
  },
  
  methods: {
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
    
    async cancelSubscription() {
      try {
        const result = await api.cancelSubscription();
        this.subscriptionInfo = result;
        this.showCancelConfirmation = false;
        // Show success message
        this.$toast.success('Subscription cancelled successfully');
      } catch (error) {
        console.error('Error cancelling subscription:', error);
        this.$toast.error('Failed to cancel subscription');
      }
    }
  }
}
</script>

<style scoped>
.profile-page {
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
    -2px 2px 0 rgba(0, 0, 0, 0.8),
    0 0 15px rgba(238, 175, 17, 0.5);
  padding: 1rem 2rem;
  border-radius: 8px;
}

.feature-box {
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid rgb(238, 175, 17);
  border-radius: 10px;
  padding: 2rem;
  max-width: 800px;
  margin: 2rem auto;
  box-shadow: 0 0 20px rgba(238, 175, 17, 0.2);
  backdrop-filter: blur(5px);
}

.profile-content {
  text-align: center;
}

.feature-icon {
  font-size: 4rem;
  color: rgb(238, 175, 17);
  margin-bottom: 1.5rem;
  filter: drop-shadow(0 0 10px rgba(238, 175, 17, 0.3));
}

h3 {
  color: rgb(238, 175, 17);
  font-size: 2rem;
  margin-bottom: 1.5rem;
}

h4.section-title {
  color: rgb(238, 175, 17);
  font-size: 1.5rem;
  margin: 2rem 0 1rem;
  border-bottom: 1px solid rgba(238, 175, 17, 0.3);
  padding-bottom: 0.5rem;
}

p {
  color: white;
  font-size: 1.2rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

strong {
  color: rgb(238, 175, 17);
  font-weight: bold;
}

.stats-preview {
  margin-top: 2rem;
  text-align: left;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  color: white;
  font-size: 1.1rem;
  margin: 0.8rem 0;
  padding-left: 1.5rem;
  position: relative;
}

li::before {
  content: '▸';
  color: rgb(238, 175, 17);
  position: absolute;
  left: 0;
}

.user-badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.user-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  display: inline-block;
  font-weight: bold;
  transition: all 0.3s ease;
}

.admin-badge {
  background: linear-gradient(45deg, #8e44ad, #9b59b6);
  color: white;
  box-shadow: 0 2px 10px rgba(142, 68, 173, 0.3);
}

.premium-badge {
  background: linear-gradient(45deg, #ffd700, #ffa500);
  color: black;
  box-shadow: 0 2px 10px rgba(255, 215, 0, 0.3);
}

.normal-badge {
  background: linear-gradient(45deg, #2c3e50, #34495e);
  color: white;
  box-shadow: 0 2px 10px rgba(52, 73, 94, 0.3);
}

.verified-badge {
  background: linear-gradient(45deg, #3498db, #2980b9);
  color: white;
  box-shadow: 0 2px 10px rgba(52, 152, 219, 0.3);
}

/* Subscription section styles */
.subscription-section {
  background: rgba(20, 20, 20, 0.5);
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1rem 0 2rem;
  text-align: left;
}

.loading-indicator {
  text-align: center;
  color: white;
  padding: 1rem;
}

.subscription-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #e74c3c;
}

.subscription-status.active {
  color: #2ecc71;
}

.subscription-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
}

.subscription-info-item {
  background: rgba(40, 40, 40, 0.5);
  border-radius: 8px;
  padding: 1rem;
}

.info-label {
  font-size: 0.9rem;
  color: #aaa;
  margin-bottom: 0.3rem;
}

.info-value {
  font-size: 1.1rem;
  color: white;
  font-weight: bold;
}

.remaining-time {
  color: #f39c12;
}

.subscription-actions {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
}

.cancel-button {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
  border: 1px solid #e74c3c;
  border-radius: 20px;
  padding: 0.5rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-button:hover {
  background: rgba(231, 76, 60, 0.3);
}

.subscription-upgrade {
  text-align: center;
  margin: 1.5rem 0;
}

.upgrade-button {
  display: inline-block;
  background: linear-gradient(45deg, #f39c12, #e67e22);
  color: white;
  border: none;
  border-radius: 20px;
  padding: 0.7rem 2rem;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(243, 156, 18, 0.3);
}

.upgrade-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(243, 156, 18, 0.4);
}

.error-message {
  color: #e74c3c;
  text-align: center;
  padding: 1rem;
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
  text-align: center;
}

.modal-content h4 {
  color: rgb(238, 175, 17);
  font-size: 1.8rem;
  margin-bottom: 1rem;
}

.modal-content p {
  color: white;
  margin-bottom: 1rem;
}

.modal-note {
  font-size: 0.9rem;
  color: #aaa;
  font-style: italic;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.cancel-action, .confirm-action {
  padding: 0.7rem 1.5rem;
  border-radius: 20px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-action {
  background: rgba(52, 73, 94, 0.2);
  color: white;
  border: 1px solid #34495e;
}

.cancel-action:hover {
  background: rgba(52, 73, 94, 0.4);
}

.confirm-action {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
  border: 1px solid #e74c3c;
}

.confirm-action:hover {
  background: rgba(231, 76, 60, 0.4);
}
</style>