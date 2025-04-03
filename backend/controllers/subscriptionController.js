// controllers/subscriptionController.js
const User = require('../models/User');

/**
 * Activate a subscription for a user
 * @param {string} userId - User ID
 * @param {string} plan - Subscription plan ('quick', 'monthly', 'quarterly', 'annual')
 * @param {string} paymentId - Payment ID from payment processor
 */
exports.activateSubscription = async (req, res) => {
  try {
    const { userId, plan, paymentId } = req.body;
    
    if (!userId || !plan || !paymentId) {
      return res.status(400).json({ msg: 'Missing required fields' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    await user.extendSubscription(plan, paymentId);
    
    res.json({
      msg: 'Subscription activated successfully',
      subscription: {
        active: user.subscription.active,
        plan: user.subscription.plan,
        endDate: user.subscription.endDate,
        remainingDays: user.getRemainingSubscriptionDays()
      }
    });
  } catch (err) {
    console.error('Error activating subscription:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

/**
 * Get subscription details for a user
 */
exports.getSubscriptionDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    const hasActiveSubscription = user.hasActiveSubscription();
    const remainingDays = user.getRemainingSubscriptionDays();
    
    // Calculate remaining days manually if the method returns 0 but there's an active subscription
    let calculatedRemainingDays = remainingDays;
    if (hasActiveSubscription && remainingDays === 0 && user.subscription.endDate) {
      const now = new Date();
      const endDate = new Date(user.subscription.endDate);
      const diffTime = Math.abs(endDate - now);
      calculatedRemainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    res.json({
      subscription: {
        active: hasActiveSubscription,
        plan: user.subscription.plan,
        startDate: user.subscription.startDate,
        endDate: user.subscription.endDate,
        remainingDays: calculatedRemainingDays
      }
    });
  } catch (err) {
    console.error('Error getting subscription details:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

/**
 * Cancel a subscription
 */
exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Add to history before cancelling
    if (user.subscription.active) {
      user.subscription.history.push({
        plan: user.subscription.plan,
        startDate: user.subscription.startDate,
        endDate: user.subscription.endDate,
        paymentId: user.subscription.paymentId
      });
    }
    
    // Cancel subscription but keep it active until end date
    // We're not actually deactivating it immediately, just marking it as not to be renewed
    user.subscription.active = false;
    await user.save();
    
    res.json({
      msg: 'Subscription cancelled successfully. You will have access until your current subscription period ends.',
      subscription: {
        active: false,
        endDate: user.subscription.endDate,
        remainingDays: user.getRemainingSubscriptionDays()
      }
    });
  } catch (err) {
    console.error('Error cancelling subscription:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

/**
 * Process payment webhook from NOWPayments
 */
exports.processPaymentWebhook = async (req, res) => {
  try {
    // Verify webhook signature (implement proper security)
    // This is a placeholder - you should implement proper signature verification
    // based on NOWPayments documentation
    
    const { payment_id, payment_status, order_id } = req.body;
    
    // Check if payment is completed
    if (payment_status !== 'finished') {
      console.log(`Payment ${payment_id} status: ${payment_status}`);
      return res.status(200).json({ received: true });
    }
    
    // Extract user ID and plan from order_id
    // Assuming order_id format: userId_planType
    const [userId, planType] = order_id.split('_');
    
    if (!userId || !planType) {
      console.error('Invalid order_id format:', order_id);
      return res.status(400).json({ error: 'Invalid order_id format' });
    }
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found for order:', order_id);
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Activate subscription
    await user.extendSubscription(planType, payment_id);
    
    console.log(`Subscription activated for user ${userId}, plan: ${planType}`);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error processing payment webhook:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Check and update subscription status for all users
 * This should be run by a scheduled job
 */
exports.checkSubscriptionStatus = async () => {
  try {
    const now = new Date();
    
    // Find users with active subscriptions that have expired
    const users = await User.find({
      'subscription.active': true,
      'subscription.endDate': { $lt: now }
    });
    
    console.log(`Found ${users.length} expired subscriptions to process`);
    
    for (const user of users) {
      // Deactivate subscription
      user.subscription.active = false;
      user.isPaidUser = false;
      await user.save();
      
      console.log(`Deactivated expired subscription for user: ${user._id}`);
      
      // Here you could also send an email notification about expiration
    }
    
    return { processed: users.length };
  } catch (err) {
    console.error('Error checking subscription status:', err);
    throw err;
  }
};

// Admin endpoints for subscription management

// Get subscription details for the current user
exports.getSubscriptionDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const subscription = {
      active: user.isPaidUser,
      plan: user.subscriptionPlan,
      startDate: user.subscriptionStartDate,
      endDate: user.subscriptionEndDate,
      remainingDays: 0
    };
    
    // Calculate remaining days if subscription is active
    if (user.isPaidUser && user.subscriptionEndDate) {
      const endDate = new Date(user.subscriptionEndDate);
      const today = new Date();
      const diffTime = endDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      subscription.remainingDays = diffDays > 0 ? diffDays : 0;
    }
    
    res.json({ subscription });
  } catch (error) {
    console.error('Error getting subscription details:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get subscription details for a specific user (admin only)
exports.getUserSubscription = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    const userId = req.params.userId;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const subscription = {
      active: user.subscription.active || user.isPaidUser,
      plan: user.subscription.plan,
      startDate: user.subscription.startDate,
      endDate: user.subscription.endDate,
      remainingDays: 0
    };
    
    // Calculate remaining days if subscription is active
    if (subscription.active && subscription.endDate) {
      const endDate = new Date(subscription.endDate);
      const today = new Date();
      const diffTime = endDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      subscription.remainingDays = diffDays > 0 ? diffDays : 0;
    }
    
    res.json({ subscription });
  } catch (error) {
    console.error('Error getting user subscription details:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel a user's subscription (admin only)
exports.adminCancelSubscription = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    const userId = req.params.userId;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user subscription status
    user.subscription.active = false;
    user.subscription.endDate = new Date(); // Set end date to now
    user.isPaidUser = false; // Keep this for backward compatibility
    
    await user.save();
    
    // Get updated subscription details
    const subscription = {
      active: user.subscription.active,
      plan: user.subscription.plan,
      startDate: user.subscription.startDate,
      endDate: user.subscription.endDate,
      remainingDays: 0
    };
    
    res.json({ 
      message: 'Subscription cancelled successfully',
      subscription 
    });
  } catch (error) {
    console.error('Error cancelling user subscription:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add subscription time based on plan (admin only)
exports.adminAddSubscriptionTime = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    const userId = req.params.userId;
    const { plan } = req.body;
    
    if (!plan) {
      return res.status(400).json({ message: 'Subscription plan is required' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Determine days to add based on plan
    let daysToAdd = 0;
    switch (plan) {
      case 'quick':
        daysToAdd = 10;
        break;
      case 'monthly':
        daysToAdd = 30;
        break;
      case 'quarterly':
        daysToAdd = 90;
        break;
      case 'annual':
        daysToAdd = 365;
        break;
      default:
        return res.status(400).json({ message: 'Invalid subscription plan' });
    }
    
    // Calculate new end date
    const today = new Date();
    let newEndDate;
    
    if (user.subscription.active && user.subscription.endDate && new Date(user.subscription.endDate) > today) {
      // If user has an active subscription, add days to current end date
      newEndDate = new Date(user.subscription.endDate);
    } else {
      // Otherwise, start from today
      newEndDate = today;
      user.subscription.startDate = today;
    }
    
    // Add days to end date
    newEndDate.setDate(newEndDate.getDate() + daysToAdd);
    
    // Update user subscription
    user.subscription.active = true;
    user.subscription.plan = plan;
    user.subscription.endDate = newEndDate;
    user.isPaidUser = true; // Keep this for backward compatibility
    
    await user.save();
    
    // Calculate remaining days
    const diffTime = newEndDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Get updated subscription details
    const subscription = {
      active: user.subscription.active,
      plan: user.subscription.plan,
      startDate: user.subscription.startDate,
      endDate: user.subscription.endDate,
      remainingDays: diffDays > 0 ? diffDays : 0
    };
    
    res.json({ 
      message: 'Subscription time added successfully',
      subscription 
    });
  } catch (error) {
    console.error('Error adding subscription time:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Set subscription end date (admin only)
exports.adminSetSubscriptionEndDate = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    const userId = req.params.userId;
    const { endDate } = req.body;
    
    if (!endDate) {
      return res.status(400).json({ message: 'End date is required' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Validate end date is in the future
    const newEndDate = new Date(endDate);
    const today = new Date();
    
    if (newEndDate <= today) {
      return res.status(400).json({ message: 'End date must be in the future' });
    }
    
    // If user doesn't have a subscription start date, set it to today
    if (!user.subscription.startDate) {
      user.subscription.startDate = today;
    }
    
    // Update user subscription
    user.subscription.active = true;
    user.subscription.endDate = newEndDate;
    
    await user.save();
    
    // Calculate remaining days
    const diffTime = newEndDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Get updated subscription details
    const subscription = {
      active: user.subscription.active,
      plan: user.subscription.plan,
      startDate: user.subscription.startDate,
      endDate: user.subscription.endDate,
      remainingDays: diffDays
    };
    
    res.json({ 
      message: 'Subscription end date set successfully',
      subscription 
    });
  } catch (error) {
    console.error('Error setting subscription end date:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = exports;
