<template>
  <div class="trade-idea-widget">
    <TradeIdeaSection />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import TradeIdeaSection from '@/components/app/TradeIdeaSection.vue';

export default defineComponent({
  name: 'TradeIdeaWidget',
  components: {
    TradeIdeaSection
  }
});
</script>

<style scoped>
.trade-idea-widget {
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
