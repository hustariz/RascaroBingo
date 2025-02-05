<template>
  <div class="analytics-page">
    <h2 class="feature-title">Analytics</h2>
    <div class="feature-box">
      <div class="analytics-content">
        <font-awesome-icon icon="chart-bar" class="feature-icon" />
        <h3>Coming Soon!</h3>
        <p>
          Dive deep into your <strong>trading performance</strong> with advanced analytics!
        </p>
        <p>
          Track your <strong>progress</strong>, analyze your <strong>trading patterns</strong>, and improve your <strong>strategy</strong>.
        </p>
        <div class="analytics-preview">
          <p>Future analytics will include:</p>
          <ul>
            <li><strong>Win Rate Analysis</strong></li>
            <li><strong>Risk Management Metrics</strong></li>
            <li><strong>Performance Charts</strong></li>
            <li><strong>Trading Patterns Recognition</strong></li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AnalyticsPage'
}
</script>

<style scoped>
.analytics-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  min-height: 100vh;
}

.feature-title {
  font-family: 'Legendarie', sans-serif;
  color: rgb(238, 175, 17);
  font-size: 2.5rem;
  text-shadow: 
    2px 2px 0 rgba(0, 0, 0, 0.8),
    -2px -2px 0 rgba(0, 0, 0, 0.8),
    2px -2px 0 rgba(0, 0, 0, 0.8),
    -2px 2px 0 rgba(0, 0, 0, 0.8),
    0 0 15px rgba(238, 175, 17, 0.5);
  padding: 1rem 2rem;
  border-radius: 8px;
}

.feature-box {
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid rgb(238, 175, 17);
  border-radius: 10px;
  padding: 2rem;
  max-width: 800px;
  margin: 2rem auto;
  box-shadow: 0 0 20px rgba(238, 175, 17, 0.2);
  backdrop-filter: blur(5px);
}

.analytics-content {
  text-align: center;
}

.feature-icon {
  font-size: 4rem;
  color: rgb(238, 175, 17);
  margin-bottom: 1.5rem;
  filter: drop-shadow(0 0 10px rgba(238, 175, 17, 0.3));
}

h3 {
  color: rgb(238, 175, 17);
  font-size: 2rem;
  margin-bottom: 1.5rem;
}

p {
  color: white;
  font-size: 1.2rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

strong {
  color: rgb(238, 175, 17);
  font-weight: bold;
}

.analytics-preview {
  margin-top: 2rem;
  text-align: left;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  color: white;
  font-size: 1.1rem;
  margin: 0.8rem 0;
  padding-left: 1.5rem;
  position: relative;
}

li::before {
  content: '📊';
  position: absolute;
  left: 0;
}
</style>