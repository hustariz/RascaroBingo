// cron/subscriptionCron.js
const cron = require('node-cron');
const subscriptionController = require('../controllers/subscriptionController');

// Schedule task to run at midnight every day
const scheduleSubscriptionCheck = () => {
  console.log('Scheduling subscription status check to run daily at midnight');
  
  cron.schedule('0 0 * * *', async () => {
    console.log('Running scheduled subscription status check');
    try {
      const result = await subscriptionController.checkSubscriptionStatus();
      console.log(`Subscription check completed: ${result.processed} subscriptions processed`);
    } catch (error) {
      console.error('Error in subscription check cron job:', error);
    }
  });
};

module.exports = { scheduleSubscriptionCheck };
