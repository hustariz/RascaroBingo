<template>
    <div class="shop-page">
      <h2 class="feature-title">Shop</h2>
      <div class="feature-box">
        <div class="coming-soon-content">
          <font-awesome-icon icon="store" class="feature-icon" />
          <h3>Coming Soon!</h3>
          <p>
            Unlock <strong>exclusive items</strong> and <strong>special features</strong> to enhance your trading experience!
          </p>
          <p>
            Use your <strong>trading achievements</strong> to access unique rewards and customization options.
          </p>
          <p>
           Purchase exclusive <strong>Bingo case</strong> with fixed score based on the performance of the <strong>trading script</strong> it uses!
          </p>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'ShopPage'
  }
  </script>
  
  <style scoped>
  .shop-page {
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
  
  .coming-soon-content {
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
  </style>