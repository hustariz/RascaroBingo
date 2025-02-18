<template>
  <div class="tradedetails-tooltip-container">
    <div class="tradedetails-tooltip-icon"
         @mouseenter="show = true">
      <span>i</span>
    </div>
    <teleport to="body">
      <div class="tradedetails-tooltip-content-wrapper" 
           v-show="show" 
           :style="tooltipStyle"
           @mouseenter="show = true"
           @mouseleave="handleMouseLeave">
        <div class="tradedetails-tooltip-bridge"></div>
        <div class="tradedetails-tooltip-content">
          Would you like to manually set it? 
          <div class="tradedetails-tooltip-buttons">
            <button class="tradedetails-tooltip-btn check" @click.stop="$emit('enable')">✓</button>
            <button class="tradedetails-tooltip-btn cross" @click.stop="$emit('disable')">✗</button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script>
export default {
  name: 'TargetTooltip',
  data() {
    return {
      show: false,
      tooltipX: 0,
      tooltipY: 0
    }
  },
  computed: {
    tooltipStyle() {
      return {
        left: `${this.tooltipX}px`,
        top: `${this.tooltipY}px`
      };
    }
  },
  mounted() {
    window.addEventListener('mousemove', this.updatePosition);
  },
  beforeUnmount() {
    window.removeEventListener('mousemove', this.updatePosition);
  },
  methods: {
    updatePosition() {
      if (!this.show) return;
      const icon = this.$el.querySelector('.tradedetails-tooltip-icon');
      if (!icon) return;
      const rect = icon.getBoundingClientRect();
      this.tooltipX = rect.left + (rect.width / 2);
      this.tooltipY = rect.top;
    },
    handleMouseLeave(event) {
      // Check if we're moving to the tooltip content or bridge
      const tooltipContent = this.$el.querySelector('.tradedetails-tooltip-content-wrapper');
      const relatedTarget = event.relatedTarget;
      if (tooltipContent && (tooltipContent.contains(relatedTarget) || this.$el.contains(relatedTarget))) {
        return;
      }
      this.show = false;
    }
  },
  emits: ['enable', 'disable']
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&family=Roboto:wght@400;500&display=swap');

.tradedetails-tooltip-container {
  position: relative;
  display: inline-block;
}

.tradedetails-tooltip-icon {
  width: 19px;
  height: 19px;
  border: 1px solid rgba(255, 215, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: rgb(255, 215, 0);
  cursor: help;
  background: rgba(25, 16, 5, 0.9);
  box-shadow: inset 0 0 8px rgba(255, 215, 0, 0.2);
  transition: all 0.3s ease;
}

.tradedetails-tooltip-icon:hover {
  border-color: rgb(255, 215, 0);
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.2);
}

.tradedetails-tooltip-icon span {
  font-style: italic;
}

.tradedetails-tooltip-content-wrapper {
  position: fixed;
  background: linear-gradient(145deg, rgba(43, 24, 16, 0.95), rgba(25, 16, 5, 0.98));
  border: 1px solid rgba(255, 215, 0, 0.5);
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 1rem;
  color: rgb(238, 175, 17);
  width: 240px;
  z-index: 1500;
  box-shadow: 0 0 10px rgba(238, 175, 17, 0.3);
  font-family: 'Montserrat', 'Roboto', sans-serif;
  transform: translate(-50%, calc(-100% - 10px));
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.tradedetails-tooltip-bridge {
  position: absolute;
  bottom: -10px;
  left: 0;
  width: 100%;
  height: 20px;
  background: transparent;
}

.tradedetails-tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  text-align: center;
  position: relative;
}

.tradedetails-tooltip-buttons {
  display: flex;
  justify-content: center;
  gap: 0.8rem;
}

.tradedetails-tooltip-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
  background: rgba(25, 16, 5, 0.9);
  border: none;
  color: inherit;
}

.tradedetails-tooltip-btn.check {
  background: rgba(0, 255, 0, 0.1);
  border: 1px solid rgba(0, 255, 0, 0.5);
  color: rgb(0, 255, 0);
}

.tradedetails-tooltip-btn.cross {
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 0, 0, 0.5);
  color: rgb(255, 0, 0);
}

.tradedetails-tooltip-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.2);
}

.tradedetails-tooltip-content-wrapper::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid rgba(25, 16, 5, 0.98);
}
</style>
