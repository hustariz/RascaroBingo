<template>
  <div class="about-page">
    <h2 class="feature-title">About RascaroBingo</h2>
    <div class="feature-box">
      <div class="about-content">
        <h3>Keep your winners ditch the others</h3>
        
        <div class="workflow-section">
          <h4>How It Works</h4>

          <div class="workflow-step">
            <strong>1. Bingo Section</strong>
            <p>Create and customize your trading strategy board:</p>
            <ul>
              <li>Fill bingo cases with your trading practices, indicators, and strategies</li>
              <li>Assign points to each case based on their proven effectiveness</li>
              <li>Check cases when you follow your predefined strategies</li>
              <li>Earn points that unlock better risk/reward ratios</li>
              <li>Build and maintain trading discipline through consistent practice</li>
            </ul>
          </div>
          
          <div class="workflow-step">
            <strong>2. Trade's Idea</strong>
            <p>Document and analyze your trades effectively:</p>
            <ul>
              <li>Write detailed trade ideas and analysis</li>
              <li>Access TradingView charts directly within the app</li>
              <li>Save and track your trading symbols</li>
              <li>Review your trading thoughts and strategies</li>
            </ul>
          </div>
          
          <div class="workflow-step">
            <strong>3. Trade's Details</strong>
            <p>Set up your trades with precision:</p>
            <ul>
              <li>Toggle between long and short positions</li>
              <li>Enter your trade parameters (entry, stoploss, target)</li>
              <li>The app suggests risk/reward ratios based on your bingo score</li>
              <li>Manually adjust target prices to override suggested target if needed</li>
              <li>Calculate potential profit and loss scenarios based on your position size</li>
              <li>Save trade setups for performance tracking</li>
            </ul>
          </div>
          
          <div class="workflow-step">
            <strong>4. Risk Management</strong>
            <p>Maintain disciplined position sizing:</p>
            <ul>
              <li>Calculate optimal position sizes based on a system of streaks</li>
              <li>Track your account balance and risk per trade</li>
              <li>Monitor win/loss ratios and performance</li>
              <li>Adjust risk parameters based on market conditions</li>
            </ul>
          </div>
                  
        <div class="workflow-step">
          <strong>5. Analytics Dashboard</strong>
          <p>Track and optimize your trading performance:</p>
          <ul>
            <li>Identify your most successful bingo strategies with detailed winrate analysis</li>
            <li>Share winning bingo boards with the trading community</li>
            <li>Track performance metrics for each bingo case</li>
            <li>View historical performance data and trends</li>
            <li>Generate insights about your most profitable trading patterns</li>
            <li>Compare strategy performance across different market conditions</li>
            <li>Adjust your trading approach based on statistical evidence</li>
            <li>Monitor risk/reward efficiency for different strategies</li>
            <li>Track consistency in strategy implementation</li>
          </ul>
        </div>

          
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AboutPage'
}
</script>

<style scoped>
.about-page {
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

.about-content {
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

.workflow-section {
  text-align: left;
  margin-top: 2rem;
}

.workflow-section h4 {
  color: rgb(238, 175, 17);
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.workflow-step {
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  border: 1px solid rgba(238, 175, 17, 0.3);
  border-radius: 8px;
  background: rgba(238, 175, 17, 0.1);
  transition: all 0.3s ease;
}

.workflow-step:hover {
  background: rgba(238, 175, 17, 0.15);
  transform: translateX(5px);
  box-shadow: 0 0 15px rgba(238, 175, 17, 0.2);
}

.workflow-step strong {
  display: block;
  color: rgb(238, 175, 17);
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.workflow-step p {
  color: white;
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.workflow-step ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.workflow-step ul li {
  color: white;
  margin-bottom: 0.5rem;
  padding-left: 1.5rem;
  position: relative;
}

.workflow-step ul li::before {
  content: '•';
  color: rgb(238, 175, 17);
  position: absolute;
  left: 0;
  font-size: 1.2rem;
}

@media (max-width: 768px) {
  .about-page {
    padding: 1rem;
  }

  .feature-title {
    font-size: 2rem;
    padding: 0.8rem 1.5rem;
  }

  .feature-box {
    padding: 1.5rem;
    margin: 1rem;
  }

  .workflow-step {
    padding: 1rem;
  }

  .workflow-step p, .workflow-step ul li {
    font-size: 1rem;
  }
}
</style>
