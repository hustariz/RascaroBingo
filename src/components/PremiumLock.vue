<template>
  <div class="premium-lock-overlay" v-if="show">
    <div class="premium-lock-modal">
      <button class="premium-lock-close" @click="$emit('close')">
        <i class="fas fa-times"></i>
      </button>
      <div class="premium-lock-header">
        <i class="fas fa-crown premium-lock-crown"></i>
        <h3>Premium Feature</h3>
      </div>
      <div class="premium-lock-body">
        <i class="fas fa-lock premium-lock-icon"></i>
        <p>{{ message || 'This feature is only available to premium users' }}</p>
        <div class="premium-lock-features">
          <div class="premium-lock-feature">
            <i class="fas fa-layer-group"></i>
            <span>Multiple Bingo Pages</span>
          </div>
          <div class="premium-lock-feature">
            <i class="fas fa-edit"></i>
            <span>Custom Page Names</span>
          </div>
          <div class="premium-lock-feature">
            <i class="fas fa-sync-alt"></i>
            <span>Sync Across Devices</span>
          </div>
          <div class="premium-lock-feature">
            <i class="fas fa-share-alt"></i>
            <span>Export and Share your Board to Users</span>
          </div>
        </div>
        <button @click="handleUpgrade" class="premium-lock-upgrade">
          <i class="fas fa-star"></i>
          Upgrade to Premium
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { useRouter } from 'vue-router'

export default {
  name: 'PremiumLock',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    message: {
      type: String,
      default: ''
    }
  },
  setup() {
    const router = useRouter()
    
    const handleUpgrade = () => {
      router.push('/payment')
    }

    return {
      handleUpgrade
    }
  }
}
</script>

<style scoped>
.premium-lock-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.25);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(1px);
}

.premium-lock-modal {
  position: relative;
  background: linear-gradient(145deg, rgba(43, 24, 16, 0.95), rgba(25, 16, 5, 0.98));
  padding: 2.5rem 2rem;
  border-radius: 15px;
  text-align: center;
  max-width: 450px;
  width: 90%;
  box-shadow: 
    inset 0 0 15px rgba(255, 215, 0, 0.1),
    0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 215, 0, 0.5);
  animation: premiumLockSlideIn 0.3s ease-out;
  z-index: 10000;
}

@keyframes premiumLockSlideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.premium-lock-header {
  margin-bottom: 1.25rem;
  position: relative;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(255, 215, 0, 0.2);
}

.premium-lock-header h3 {
  color: rgb(238, 175, 17);
  font-size: 1.8rem;
  margin: 0;
  font-weight: 600;
}

.premium-lock-crown {
  color: rgb(238, 175, 17);
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.premium-lock-icon {
  color: rgb(238, 175, 17);
  font-size: 3rem;
  margin-bottom: 1rem;
}

.premium-lock-body {
  color: #fff;
}

.premium-lock-body p {
  margin: 0.5rem 0;
  font-size: 1rem;
  line-height: 1.5;
  padding: 0 1rem;
}

.premium-lock-features {
  margin: 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0 0.5rem;
}

.premium-lock-feature {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(255, 215, 0, 0.2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.premium-lock-feature:hover {
  transform: translateY(-2px);
  background: rgba(255, 215, 0, 0.15);
  border-color: rgba(255, 215, 0, 0.3);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.1);
}

.premium-lock-feature:hover i {
  transform: scale(1.1);
  color: #ffd700;
}

.premium-lock-feature i {
  color: rgb(238, 175, 17);
  font-size: 1.2rem;
}

.premium-lock-feature span {
  color: #fff;
  font-size: 1rem;
}

.premium-lock-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: transparent;
  border: none;
  color: rgb(238, 175, 17);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border-radius: 50%;
}

.premium-lock-close:hover {
  color: #ffd700;
  transform: scale(1.1);
}

.premium-lock-upgrade {
  background: linear-gradient(145deg, rgb(238, 175, 17), rgb(218, 165, 32));
  color: #000;
  border: none;
  padding: 0.8rem 2rem;
  border-radius: 25px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin: 1.5rem auto 0;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.2);
}

.premium-lock-upgrade:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(255, 215, 0, 0.3);
}

.premium-lock-upgrade i {
  font-size: 1.2rem;
}
</style>
