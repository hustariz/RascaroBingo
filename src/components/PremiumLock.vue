<template>
  <div class="premium-lock-overlay" v-if="show">
    <div class="premium-lock-content">
      <button class="close-button" @click="$emit('close')">
        <i class="fas fa-times"></i>
      </button>
      <div class="premium-lock-header">
        <i class="fas fa-crown premium-crown-icon"></i>
        <h3>Premium Feature</h3>
      </div>
      <div class="premium-lock-body">
        <i class="fas fa-lock premium-lock-icon"></i>
        <p>{{ message || 'This feature is only available to premium users' }}</p>
        <div class="premium-features">
          <div class="feature">
            <i class="fas fa-layer-group"></i>
            <span>Multiple Bingo Pages</span>
          </div>
          <div class="feature">
            <i class="fas fa-edit"></i>
            <span>Custom Page Names</span>
          </div>
          <div class="feature">
            <i class="fas fa-sync-alt"></i>
            <span>Sync Across Devices</span>
          </div>
        </div>
        <button @click="$emit('upgradePremium')" class="upgrade-button">
          <i class="fas fa-star"></i>
          Upgrade to Premium
        </button>
      </div>
    </div>
  </div>
</template>

<script>
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
  }
}
</script>

<style scoped>
.premium-lock-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(8px);
}

.premium-lock-content {
  position: relative;
  background: linear-gradient(145deg, #1a1a1a, #2d2d2d);
  padding: 2rem;
  border-radius: 15px;
  text-align: center;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 215, 0, 0.1);
  animation: slideIn 0.3s ease-out;
  z-index: 10000;
}

@keyframes slideIn {
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
  margin-bottom: 1.5rem;
  position: relative;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(255, 215, 0, 0.2);
}

.premium-lock-header h3 {
  color: #ffd700;
  font-size: 1.8rem;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.premium-crown-icon {
  color: #ffd700;
  font-size: 2rem;
  margin-bottom: 0.5rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.premium-lock-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.premium-lock-icon {
  font-size: 3rem;
  color: #ffd700;
  margin-bottom: 0.5rem;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.premium-lock-content p {
  color: #ffffff;
  font-size: 1.1rem;
  margin: 0;
  line-height: 1.5;
}

.premium-features {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 1rem 0;
  width: 100%;
}

.feature {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.feature:hover {
  background: rgba(255, 215, 0, 0.15);
  transform: translateX(5px);
}

.feature i {
  color: #ffd700;
  font-size: 1.2rem;
  width: 24px;
}

.feature span {
  color: #ffffff;
  font-size: 1rem;
  text-align: left;
}

.upgrade-button {
  background: linear-gradient(45deg, #ffd700, #ffed4a);
  border: none;
  padding: 1rem 2rem;
  border-radius: 25px;
  color: #000;
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
}

.upgrade-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
  background: linear-gradient(45deg, #ffed4a, #ffd700);
}

.upgrade-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba(255, 215, 0, 0.3);
}

.upgrade-button i {
  font-size: 1.2rem;
}

.close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.2rem;
  cursor: pointer;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-button:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
  transform: rotate(90deg);
}

.close-button:active {
  transform: rotate(90deg) scale(0.9);
}

.close-button i {
  line-height: 1;
}
</style>
