<template>
  <div class="page-container" @open-trade-history="$emit('open-trade-history')" :style="{ overflow: 'auto' }">
    <PremiumLock 
      :show="showPremiumLock" 
      :message="'Upgrade to Premium to access multiple Bingo pages and custom page names'"
      @upgradePremium="handleUpgradePremium"
      @close="closePremiumLock"
    />

    <RiskManagementSidebar 
      ref="riskSidebar"
      @save-settings="handleSaveSettings" 
      @sidebar-toggle="handleSidebarToggle" 
    />
    
    <div class="main-content" :class="{ 'expanded': isSidebarCollapsed }" :style="{ overflow: 'auto' }">
      <!-- This is where we'll render the BingoPage component -->
      <BingoPage 
        :isSidebarCollapsed="isSidebarCollapsed"
        @open-premium-lock="showPremiumLock = true"
      />
      
      <!-- Bottom spacer to ensure margin -->
      <div style="position: fixed; bottom: 0; left: 0; right: 0; height: 3rem; z-index: -1;"></div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import BingoPage from '@/components/app/BingoPage.vue';
import RiskManagementSidebar from '@/components/app/RiskManagementSidebar.vue';
import PremiumLock from '@/components/little_components/PremiumLock.vue';

export default defineComponent({
  name: 'BingoPageContainer',
  
  components: {
    BingoPage,
    RiskManagementSidebar,
    PremiumLock
  },
  
  data() {
    return {
      showPremiumLock: false,
      isSidebarCollapsed: false
    };
  },
  
  methods: {
    closePremiumLock() {
      this.showPremiumLock = false;
    },

    handleUpgradePremium() {
      this.$router.push('/premium');
      this.showPremiumLock = false;
    },

    handleSidebarToggle() {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    },

    handleSaveSettings() {
      // Handle saving risk management settings
    }
  }
});
</script>

<style>
@import '@/assets/styles/BingoPage.css';
</style>
