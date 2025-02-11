<template>
  <div class="widget-content">
    <TradeDetailsSection />
  </div>
</template>

<script>
import TradeDetailsSection from '@/components/app/TradeDetailsSection.vue';

export default {
  name: 'TradeDetailsWidget',
  components: {
    TradeDetailsSection
  }
}
</script>

<style scoped>
.widget-content {
  height: 100%;
  padding: 10px;
}
</style>
