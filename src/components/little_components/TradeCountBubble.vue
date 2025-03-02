<template>
  <span v-if="openTradesCount > 0" class="notification-bubble">{{ openTradesCount }}</span>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'TradeCountBubble',
  setup() {
    const store = useStore();
    const openTradesCount = computed(() => store.getters['trades/openTradesCount']);

    return {
      openTradesCount
    };
  }
};
</script>

<style scoped>
.notification-bubble {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #ff4757;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 12px;
  min-width: 16px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  font-weight: bold;
  z-index: 1000;
}
</style>
