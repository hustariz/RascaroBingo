<template>
  <div class="risk-reward-widget">
    <RiskRewardSection />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import RiskRewardSection from '@/components/app/RiskRewardSection.vue';

export default defineComponent({
  name: 'RiskRewardWidget',
  components: {
    RiskRewardSection
  }
});
</script>

<style scoped>
.risk-reward-widget {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
}
</style>
