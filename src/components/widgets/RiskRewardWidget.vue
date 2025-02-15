<template>
  <div class="risk-reward-widget">
    <div class="riskreward-area">
      <div class="riskreward-checkboxes">
        <label class="riskreward-checkbox">
          <input 
            type="checkbox" 
            :checked="score >= 6 && score < 11"
            disabled
          >
          <span class="riskreward-checkbox-text">6/20 : 2R/R</span>
        </label>
        <label class="riskreward-checkbox">
          <input 
            type="checkbox" 
            :checked="score >= 11 && score < 16"
            disabled
          >
          <span class="riskreward-checkbox-text">11/20 : 3R/R</span>
        </label>
        <label class="riskreward-checkbox">

          <input 
            type="checkbox" 
            :checked="score >= 16 && score < 20"
            disabled
          >
          <span class="riskreward-checkbox-text">16/20 : 4R/R</span>
        </label>
      </div>
    </div>
    
    <div class="riskreward-score">
      <h3>Total Score: <br>
        <span class="riskreward-score-value">{{ score }}</span>
      </h3>
    </div>
    <div v-if="score >= 20" 
         class="riskreward-bingo" 
         @mouseenter="updateTooltipPosition"
         @mouseleave="showTooltip = false"
         ref="bingoText"
    >
        Bingo!
        <teleport to="body">
          <div 
            v-show="showTooltip" 
            class="riskreward-bingo-tooltip"
            :style="tooltipStyle"
          >
              Hidden Bingo! <br> 5R/R Maximum risk allowed!
          </div>
        </teleport>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed } from 'vue';
import '@/assets/styles/widgets/RiskRewardWidget.css';

export default defineComponent({
  name: 'RiskRewardWidget',
  props: {
    score: {
      type: Number,
      required: true,
      default: 0
    }
  },
  setup() {
    const showTooltip = ref(false);
    const bingoText = ref(null);
    const tooltipX = ref(0);
    const tooltipY = ref(0);

    const tooltipStyle = computed(() => {
      if (!tooltipX.value || !tooltipY.value) return {};
      return {
        left: `${tooltipX.value}px`,
        top: `${tooltipY.value}px`
      };
    });

    const updateTooltipPosition = () => {
      if (!bingoText.value) return;
      const rect = bingoText.value.getBoundingClientRect();
      tooltipX.value = rect.left + (rect.width / 2);
      tooltipY.value = rect.top;
      showTooltip.value = true;
    };

    return {
      showTooltip,
      bingoText,
      tooltipStyle,
      updateTooltipPosition
    };
  },
  watch: {
    score: {
      immediate: true,
      handler(newScore) {
        // Update rrChecks based on new score ranges
        this.$emit('update:rrChecks', {
          sixPoints: newScore >= 6 && newScore < 11,    // 2R/R
          elevenPoints: newScore >= 11 && newScore < 16, // 3R/R
          sixteenPoints: newScore >= 16 && newScore < 20, // 4R/R
          twentyPoints: newScore >= 20  // 5R/R (Hidden Bingo)
        });
      }
    }
  }
});
</script>

<style>
@import '@/assets/styles/widgets/common.css';
@import '@/assets/styles/widgets/RiskRewardWidget.css';

.riskreward-bingo-tooltip {
  position: fixed;
}
</style>
