import { computed } from 'vue'
import { useStore } from 'vuex'

export function usePremiumCheck() {
  const store = useStore()
  
  const isPremiumUser = computed(() => store.getters['user/isPaidUser'])
  
  const checkPremiumFeature = (feature) => {
    if (!isPremiumUser.value) {
      return {
        allowed: false,
        message: `Upgrade to premium to access ${feature}`
      }
    }
    return {
      allowed: true,
      message: ''
    }
  }

  const handleUpgradePremium = () => {
    // You can implement the upgrade flow here
    // For now, we'll just redirect to the shop
    window.location.href = '/#/shop'
  }

  return {
    isPremiumUser,
    checkPremiumFeature,
    handleUpgradePremium
  }
}
