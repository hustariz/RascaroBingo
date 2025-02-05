<template>
  <div class="profile-page">
    <h2 class="feature-title">Profile</h2>
    <div class="feature-box">
      <div class="profile-content">
        <font-awesome-icon icon="user" class="feature-icon" />
        <h3>Coming Soon!</h3>
        <div v-if="userInfo?.isAdmin" class="user-badge admin-badge">
          Admin User 👑
        </div>
        <div :class="['user-badge', userInfo?.isPaidUser ? 'premium-badge' : 'normal-badge']">
          {{ userInfo?.isPaidUser ? 'Premium User ⭐' : 'Normal User' }}
        </div>
        <div v-if="userInfo?.isEmailVerified" class="user-badge verified-badge">
          Email Verified ✓
        </div>
        <p>
          Customize your <strong>trader profile</strong> and track your <strong>achievements</strong>!
        </p>
        <p>
          View your <strong>trading history</strong>, manage your <strong>settings</strong>, and monitor your <strong>progress</strong>.
        </p>
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
      loading: true,
      error: null
    };
  },

  async created() {
    try {
      this.userInfo = await api.getCurrentUser();
    } catch (error) {
      console.error('Error fetching user info:', error);
      this.error = 'Failed to load user information';
    } finally {
      this.loading = false;
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

.user-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  display: inline-block;
  margin-bottom: 1rem;
  font-weight: bold;
  transition: all 0.3s ease;
}

.admin-badge {
  background: linear-gradient(45deg, #8e44ad, #9b59b6);
  color: white;
  box-shadow: 0 2px 10px rgba(142, 68, 173, 0.3);
  margin-bottom: 0.5rem;
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
</style>