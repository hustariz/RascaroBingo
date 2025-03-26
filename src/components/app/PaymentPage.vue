<template>
  <div class="payment-page">
    <div class="hero-section">
      <h2 class="welcome-title" data-text="Premium Subscription">Premium Subscription</h2>
    </div>
    
    <div class="payment-feature-box payment-container">
      <div class="payment-content">
        <div class="payment-options">
          <!-- Weekly Plan -->
          <div class="payment-plan">
            <div class="payment-plan-header">
              <div class="payment-plan-icon">
                <font-awesome-icon icon="hourglass-start" />
              </div>
              <h4>Quick Plan</h4>
              <p class="payment-price">5€</p>
              <p class="payment-time-period">10 Days</p>
            </div>
            <div class="payment-plan-features">
              <ul class="payment-features-list">
                <li><font-awesome-icon icon="dice" class="payment-feature-check" /><span>Infinite Bingo Boards</span></li>
                <li><font-awesome-icon icon="chart-bar" class="payment-feature-check" /><span>Basic Analytics</span></li>
                <li><font-awesome-icon icon="comment" class="payment-feature-check" /><span>Live Chatbox</span></li>
                <li><font-awesome-icon icon="user" class="payment-feature-check" /><span>Priority Support</span></li>
                <li><font-awesome-icon icon="download" class="payment-feature-check" /><span>Board Export</span></li>
              </ul>
            </div>
            <!-- NOWPayments Button for Weekly Subscription -->
            <div class="payment-nowpayments-button-container">
              <a href="https://nowpayments.io/payment/?iid=4387223950" target="_blank" rel="noreferrer noopener">
                <img src="https://nowpayments.io/images/embeds/payment-button-black.svg" alt="Crypto payment button by NOWPayments">
              </a>
            </div>
            <div class="payment-plan-tag">Try It Out</div>
          </div>
          
          <!-- Monthly Plan -->
          <div class="payment-plan">
            <div class="payment-plan-header">
              <div class="payment-plan-icon">
                <font-awesome-icon icon="calendar-alt" />
              </div>
              <h4>Monthly Plan</h4>
              <p class="payment-price">10€</p>
              <p class="payment-time-period">1 Month</p>
            </div>
            <div class="payment-plan-features">
              <ul class="payment-features-list">
                <li><font-awesome-icon icon="dice" class="payment-feature-check" /><span>Infinite Bingo Boards</span></li>
                <li><font-awesome-icon icon="chart-bar" class="payment-feature-check" /><span>Advanced Analytics</span></li>
                <li><font-awesome-icon icon="comment" class="payment-feature-check" /><span>Live Chatbox</span></li>
                <li><font-awesome-icon icon="user" class="payment-feature-check" /><span>Priority Support</span></li>
                <li><font-awesome-icon icon="download" class="payment-feature-check" /><span>Board Exports</span></li>
                <li><font-awesome-icon icon="calendar-alt" class="payment-feature-check" /><span>Monthly Strategy Updates</span></li>
              </ul>
            </div>
            <!-- NOWPayments Button for Monthly Subscription -->
            <div class="payment-nowpayments-button-container">
              <a href="https://nowpayments.io/payment/?iid=4652589033" target="_blank" rel="noreferrer noopener">
                <img src="https://nowpayments.io/images/embeds/payment-button-black.svg" alt="Crypto payment button by NOWPayments">
              </a>
            </div>
            <div class="payment-plan-tag">Popular</div>
          </div>

          <!-- Quarterly Plan -->
          <div class="payment-plan">
            <div class="payment-plan-header">
              <div class="payment-plan-icon">
                <font-awesome-icon icon="chart-pie" />
              </div>
              <h4>Quarterly Plan</h4>
              <p class="payment-price">25€</p>
              <p class="payment-time-period">3 Months</p>
              <p class="payment-savings">Save 17%</p>
            </div>
            <div class="payment-plan-features">
              <ul class="payment-features-list">
                <li><font-awesome-icon icon="dice" class="payment-feature-check" /><span>Infinite Bingo Boards</span></li>
                <li><font-awesome-icon icon="chart-bar" class="payment-feature-check" /><span>Advanced Analytics</span></li>
                <li><font-awesome-icon icon="comment" class="payment-feature-check" /><span>Live Chatbox</span></li>
                <li><font-awesome-icon icon="user" class="payment-feature-check" /><span>Priority Support</span></li>
                <li><font-awesome-icon icon="download" class="payment-feature-check" /><span>Board Exports</span></li>
                <li><font-awesome-icon icon="code" class="payment-feature-check" /><span>Trading Scripts</span></li>
                <li><font-awesome-icon icon="calendar-alt" class="payment-feature-check" /><span>Monthly Strategy Updates</span></li>
              </ul>
            </div>
            <!-- NOWPayments Button for Quarterly Subscription -->
            <div class="payment-nowpayments-button-container">
              <a href="https://nowpayments.io/payment/?iid=5290712585" target="_blank" rel="noreferrer noopener">
                <img src="https://nowpayments.io/images/embeds/payment-button-black.svg" alt="Crypto payment button by NOWPayments">
              </a>
            </div>
            <div class="payment-plan-tag">Great Value</div>
          </div>
          
          <!-- Annual Plan -->
          <div class="payment-plan payment-featured">
            <div class="payment-plan-header">
              <div class="payment-plan-icon">
                <font-awesome-icon icon="crown" />
              </div>
              <h4>Annual Plan</h4>
              <p class="payment-price">80€</p>
              <p class="payment-time-period">1 Year</p>
              <p class="payment-savings">Save 33%</p>
            </div>
            <div class="payment-plan-features">
              <ul class="payment-features-list">
                <li><font-awesome-icon icon="dice" class="payment-feature-check" /><span>Infinite Bingo Boards</span></li>
                <li><font-awesome-icon icon="chart-bar" class="payment-feature-check" /><span>Premium Analytics</span></li>
                <li><font-awesome-icon icon="comment" class="payment-feature-check" /><span>Live Chatbox</span></li>
                <li><font-awesome-icon icon="user" class="payment-feature-check" /><span>VIP Support</span></li>
                <li><font-awesome-icon icon="download" class="payment-feature-check" /><span>Board Exports</span></li>
                <li><font-awesome-icon icon="code" class="payment-feature-check" /><span>Custom Trading Scripts</span></li>
                <li><font-awesome-icon icon="lightbulb" class="payment-feature-check" /><span>Advanced Strategy Analysis</span></li>
                <li><font-awesome-icon icon="calendar-alt" class="payment-feature-check" /><span>Monthly Strategy Updates</span></li>
                <li><font-awesome-icon icon="users" class="payment-feature-check" /><span>VIP Discord Access</span></li>
              </ul>
            </div>
            <!-- NOWPayments Button for Annual Subscription -->
            <div class="payment-nowpayments-button-container">
              <a href="https://nowpayments.io/payment/?iid=4803568146" target="_blank" rel="noreferrer noopener">
                <img src="https://nowpayments.io/images/embeds/payment-button-black.svg" alt="Crypto payment button by NOWPayments">
              </a>
            </div>
            <div class="payment-plan-tag payment-highlight">Best Value</div>
          </div>
        </div>

        <div class="payment-info">
          <div class="payment-security">
            <font-awesome-icon icon="lock" /> 
            <span>Secure Cryptocurrency Payments via <strong>NOWPayments</strong></span>
          </div>
          <div class="payment-benefits">
            <div class="payment-benefit-item">
              <font-awesome-icon icon="credit-card" />
              <span>Accept 300+ cryptocurrencies</span>
            </div>
            <div class="payment-benefit-item">
              <font-awesome-icon icon="brain" />
              <span>Low 0.5% transaction fee</span>
            </div>
            <div class="payment-benefit-item">
              <font-awesome-icon icon="user-shield" />
              <span>30-day money-back guarantee</span>
            </div>
          </div>
          <p class="payment-cancel-note">
            Cancel anytime. No questions asked.
          </p>
        </div>
      </div>
    </div>

    <div class="payment-premium-features-showcase">
      <div class="section-title-container">
        <h3 class="section-title">What You'll Get With Premium</h3>
      </div>
      <div class="payment-features-grid">
        <div class="payment-feature-card">
          <div class="payment-feature-icon">
            <font-awesome-icon icon="dice" />
          </div>
          <h4>Infinite Bingo Boards</h4>
          <p>Create and customize as many bingo boards as you need for different trading strategies and markets.</p>
        </div>
        
        <div class="payment-feature-card">
          <div class="payment-feature-icon">
            <font-awesome-icon icon="chart-line" />
          </div>
          <h4>Advanced Analytics</h4>
          <p>Gain deeper insights into your trading performance with detailed analytics and performance metrics.</p>
        </div>
        
        <div class="payment-feature-card">
          <div class="payment-feature-icon">
            <font-awesome-icon icon="envelope" />
          </div>
          <h4>Communication Tools</h4>
          <p>Connect with other traders in real-time to share ideas, strategies, and market insights.</p>
        </div>
        
        <div class="payment-feature-card">
          <div class="payment-feature-icon">
            <font-awesome-icon icon="chart-bar" />
          </div>
          <h4>Live Exchange Trading</h4>
          <p>Connect directly to exchanges via API for seamless trading integration with your bingo strategy.</p>
        </div>
        
        <div class="payment-feature-card">
          <div class="payment-feature-icon">
            <font-awesome-icon icon="trophy" />
          </div>
          <h4>Export & Share</h4>
          <p>Export your bingo boards and share them with friends or on social media to showcase your strategy.</p>
        </div>
        
        <div class="payment-feature-card">
          <div class="payment-feature-icon">
            <font-awesome-icon icon="brain" />
          </div>
          <h4>Strategy Analysis</h4>
          <p>Get detailed analysis of your bingo strategy to identify strengths and areas for improvement.</p>
        </div>
        
        <div class="payment-feature-card">
          <div class="payment-feature-icon">
            <font-awesome-icon icon="user-shield" />
          </div>
          <h4>VIP Discord Access</h4>
          <p>Get exclusive access to our VIP Discord channel for premium support and community engagement.</p>
        </div>
      </div>
    </div>

    <div class="payment-faq-section">
      <div class="section-title-container">
        <h3 class="section-title">Frequently Asked Questions</h3>
      </div>
      <div class="payment-faq-grid">
        <div class="payment-faq-item">
          <h4>What payment methods do you accept?</h4>
          <p>We accept over 300 cryptocurrencies through our secure payment processor, NOWPayments.</p>
        </div>
        
        <div class="payment-faq-item">
          <h4>Can I cancel my subscription?</h4>
          <p>Yes, you can cancel your subscription at any time. We also offer a 30-day money-back guarantee.</p>
        </div>
        
        <div class="payment-faq-item">
          <h4>How do I access premium features?</h4>
          <p>Once your payment is confirmed, your account will be automatically upgraded to premium status.</p>
        </div>
        
        <div class="payment-faq-item">
          <h4>Is my payment information secure?</h4>
          <p>Yes, all payments are processed securely through NOWPayments, a trusted cryptocurrency payment processor.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PaymentPage',
  data() {
    return {
      premiumFeatures: [
        'Infinite Customisable Bingo Boards',
        'Advanced Analytics',
        'Access to Live Chatbox',
        'Priority Support',
        'Export and Share Bingo Boards',
        'Exclusive Trading Scripts linked to Bingo Boards',
        'Detailed Success Analysis of your Bingo Strategy',
        'VIP Discord Access'
      ]
    }
  }
}
</script>

<style>
@import '@/assets/styles/payment.css';

.section-title-container {
  background-color: black;
  padding: 8px;
  margin-bottom: 15px;
  border: 2px solid var(--payment-golden-color);
  border-radius: 8px;
  box-shadow: 0 0 15px rgba(238, 175, 17, 0.3);
  position: relative;
  background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.9), rgba(20, 20, 20, 0.8));
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.section-title {
  margin: 0;
  padding: 0;
  color: rgb(238, 175, 17);
  text-shadow: 
    0 0 10px rgba(238, 175, 17, 0.4),
    0 0 20px rgba(238, 175, 17, 0.2);
  font-size: 1.8rem;
}
</style>
