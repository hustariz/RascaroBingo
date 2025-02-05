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
            <i class="fas fa-th"></i>
            <span>Unlimited Customisable Bingo Boards</span>
          </div>
          <div class="premium-lock-feature">
            <i class="fas fa-chart-line"></i>
            <span>Advanced Analytics</span>
          </div>
          <div class="premium-lock-feature">
            <i class="fas fa-comments"></i>
            <span>Access to Live Chatbox</span>
          </div>
          <div class="premium-lock-feature">
            <i class="fas fa-headset"></i>
            <span>Priority Support</span>
          </div>
          <div class="premium-lock-feature">
            <i class="fas fa-file-export"></i>
            <span>Export and Share Bingo Boards</span>
          </div>
          <div class="premium-lock-feature">
            <i class="fas fa-chart-pie"></i>
            <span>Success Analysis of your Bingo Strategy</span>
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
import '@/assets/styles/PremiumLock.css';
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
