<template>
  <div class="trade-details-widget">
    <TradeDetailsSection />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import TradeDetailsSection from '@/components/app/TradeDetailsSection.vue';

export default defineComponent({
  name: 'TradeDetailsWidget',
  components: {
    TradeDetailsSection
  }
});
</script>

<style scoped>
.trade-details-widget {
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
