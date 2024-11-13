<template>
    <div class="side-panel">
      <div class="risk-reward-area">
        <div class="rr-checkboxes">
          <label class="rr-checkbox">
            <input 
              type="checkbox" 
              :checked="score >= 6"
              disabled
            >
            <span class="checkbox-text">6/20 : 2R/R</span>
          </label>
          <label class="rr-checkbox">
            <input 
              type="checkbox" 
              :checked="score >= 11"
              disabled
            >
            <span class="checkbox-text">11/20 : 3R/R</span>
          </label>
          <label class="rr-checkbox">
            <input 
              type="checkbox" 
              :checked="score >= 16"
              disabled
            >
            <span class="checkbox-text">16/20 : 4R/R</span>
          </label>
        </div>
      </div>
      
      <div class="score-display">
        <h3>Total Score: <span class="score-value">{{ score }}</span></h3>
      </div>
    </div>
  </template>

<script>
import '../assets/styles/RiskRewardSection.css';

export default {
  name: 'RiskRewardSection',
  props: {
    score: {
      type: Number,
      required: true,
      default: 0
    }
  },
  watch: {
    score: {
      immediate: true,
      handler(newScore) {
        // Update rrChecks based on score thresholds
        this.$emit('update:rrChecks', {
          sixPoints: newScore >= 6,
          twelvePoints: newScore >= 11,
          eighteenPoints: newScore >= 16
        });
      }
    }
  }
}
</script>