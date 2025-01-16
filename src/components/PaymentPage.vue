<template>
  <div class="payment-page">
    <h2 class="feature-title">Payment</h2>
    <div class="feature-box">
      <div class="payment-content">
        <font-awesome-icon icon="credit-card" class="feature-icon" />
        <h3>Premium Features</h3>
        <div class="payment-options">
          <div class="payment-plan">
            <h4>Weekly Access</h4>
            <div class="price">1.99$<span>/week</span></div>
            <ul class="features-list">
              <li v-for="(feature, index) in premiumFeatures.slice(0, 3)" :key="index">
                <strong>{{ feature.split(' ')[0] }}</strong> {{ feature.split(' ').slice(1).join(' ') }}
              </li>
            </ul>
            <button class="payment-button" @click="selectPlan('weekly')">Subscribe Weekly</button>
          </div>
          
          <div class="payment-plan">
            <h4>Monthly Access</h4>
            <div class="price">5.99$<span>/month</span></div>
            <ul class="features-list">
              <li v-for="(feature, index) in premiumFeatures.slice(0, 4)" :key="index">
                <strong>{{ feature.split(' ')[0] }}</strong> {{ feature.split(' ').slice(1).join(' ') }}
              </li>
            </ul>
            <button class="payment-button" @click="selectPlan('monthly')">Subscribe Monthly</button>
          </div>

          <div class="payment-plan">
            <h4>Quarterly Access</h4>
            <div class="price">15$<span>/3 months</span></div>
            <ul class="features-list">
              <li v-for="(feature, index) in premiumFeatures.slice(0, 5)" :key="index">
                <strong>{{ feature.split(' ')[0] }}</strong> {{ feature.split(' ').slice(1).join(' ') }}
              </li>
            </ul>
            <button class="payment-button" @click="selectPlan('quarterly')">Subscribe Quarterly</button>
          </div>
          
          <div class="payment-plan featured">
            <div class="best-value">Best Value</div>
            <h4>Annual Access</h4>
            <div class="price">55$<span>/year</span></div>
            <div class="savings">Save over 30%</div>
            <ul class="features-list">
              <li v-for="(feature, index) in premiumFeatures" :key="index">
                <strong>{{ feature.split(' ')[0] }}</strong> {{ feature.split(' ').slice(1).join(' ') }}
              </li>
            </ul>
            <button class="payment-button featured" @click="selectPlan('yearly')">Subscribe Yearly</button>
          </div>
        </div>

        <div class="payment-info">
          <p>
            <font-awesome-icon icon="lock" /> Secure Payment Processing
          </p>
          <p class="small">
            Cancel anytime. 100% money-back guarantee for the first 30 days.
          </p>
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
        'Unlimited Customisable Bingo Boards',
        'Advanced Analytics',
        'Priority Support',
        'Export and Share Bingo Boards',
        'Exclusive Trading Scripts linked to Bingo Boards',
        'Detailed Success Analysis of your Bingo Strategy',
        'VIP Discord Access'
      ]
    }
  },
  methods: {
    selectPlan(plan) {
      // TODO: Implement payment processing
      console.log('Selected plan:', plan)
    }
  }
}
</script>

<style scoped>
.payment-page {
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
  max-width: 1200px;
  margin: 2rem auto;
  box-shadow: 0 0 20px rgba(238, 175, 17, 0.2);
  backdrop-filter: blur(5px);
}

.payment-content {
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

.payment-options {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin: 2rem 0;
  flex-wrap: wrap;
}

.payment-plan {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(238, 175, 17, 0.3);
  border-radius: 15px;
  padding: 2rem;
  width: 250px;
  position: relative;
  transition: transform 0.3s ease;
}

.payment-plan:hover {
  transform: translateY(-5px);
}

.payment-plan.featured {
  border: 2px solid rgb(238, 175, 17);
  background: rgba(238, 175, 17, 0.1);
}

.best-value {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: rgb(238, 175, 17);
  color: black;
  padding: 0.3rem 1rem;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.9rem;
}

h4 {
  color: white;
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.price {
  color: rgb(238, 175, 17);
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.price span {
  font-size: 1rem;
  opacity: 0.8;
}

.savings {
  color: #4CAF50;
  font-weight: bold;
  margin-bottom: 1rem;
}

.features-list {
  list-style: none;
  padding: 0;
  margin: 1.5rem 0;
  text-align: left;
}

.features-list li {
  color: white;
  margin-bottom: 0.8rem;
  padding-left: 1.5rem;
  position: relative;
}

.features-list li::before {
  content: "✓";
  color: rgb(238, 175, 17);
  position: absolute;
  left: 0;
}

.payment-button {
  background: rgba(238, 175, 17, 0.8);
  color: black;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 25px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.payment-button:hover {
  background: rgb(238, 175, 17);
  transform: translateY(-2px);
}

.payment-button.featured {
  background: rgb(238, 175, 17);
}

.payment-info {
  margin-top: 2rem;
  color: white;
}

.payment-info .small {
  font-size: 0.9rem;
  opacity: 0.8;
}

strong {
  color: rgb(238, 175, 17);
  font-weight: bold;
}

@media (max-width: 768px) {
  .payment-options {
    flex-direction: column;
    align-items: center;
  }
  
  .payment-plan {
    width: 100%;
    max-width: 300px;
  }
}
</style>
