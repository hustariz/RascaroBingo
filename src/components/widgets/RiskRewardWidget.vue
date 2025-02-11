<template>
  <div class="widget-content">
    <RiskRewardSection :score="score" />
  </div>
</template>

<script>
import RiskRewardSection from '@/components/app/RiskRewardSection.vue';

export default {
  name: 'RiskRewardWidget',
  components: {
    RiskRewardSection
  },
  props: {
    score: {
      type: Number,
      default: 0
    }
  }
}
</script>

<style scoped>
.widget-content {
  height: 100%;
  padding: 10px;
}
</style>
