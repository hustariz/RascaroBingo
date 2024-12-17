<template>
    <div class="about-page">
      <h2 class="feature-title">About RascaroBingo</h2>
      <div class="feature-box">
        <div class="about-content">
          <font-awesome-icon icon="info-circle" class="feature-icon" />
          <h3>Trading Made Simple</h3>
          
          <div class="workflow-section">
            <h4>How It Works</h4>
            <div class="workflow-step">
              <strong>1. Bingo Section</strong>
              <p>Complete tasks and earn points to unlock better risk/reward ratios for your trades.</p>
            </div>
            
            <div class="workflow-step">
              <strong>2. Trade's Idea</strong>
              <p>Document your trading ideas and analyze charts with the integrated TradingView widget.</p>
            </div>
            
            <div class="workflow-step">
              <strong>3. Trade's Details</strong>
              <p>Set your entry, stoploss, and target prices. The app automatically calculates your potential profit based on your earned risk/reward ratio.</p>
            </div>
            
            <div class="workflow-step">
              <strong>4. Risk Management</strong>
              <p>Track your position sizes and manage your risk with our advanced calculator.</p>
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
    padding: 1rem;
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
    margin-bottom: 0.5rem;
  }
  
  .workflow-step p {
    color: white;
    font-size: 1.1rem;
    line-height: 1.6;
    margin: 0;
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
      padding: 0.8rem;
    }
  
    .workflow-step p {
      font-size: 1rem;
    }
  }
  </style>
  