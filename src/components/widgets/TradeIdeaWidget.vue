<template>
  <div class="widget-content">
    <TradeIdeaSection />
  </div>
</template>

<script>
import TradeIdeaSection from '@/components/app/TradeIdeaSection.vue';

export default {
  name: 'TradeIdeaWidget',
  components: {
    TradeIdeaSection
  }
}
</script>

<style scoped>
.widget-content {
  height: 100%;
  padding: 10px;
}
</style>
