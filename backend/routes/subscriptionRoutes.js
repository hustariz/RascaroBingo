// routes/subscriptionRoutes.js
const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// @route   POST /api/subscription/activate
// @desc    Activate a subscription for a user
// @access  Admin only (for manual activation)
router.post('/activate', auth, adminAuth, subscriptionController.activateSubscription);

// @route   GET /api/subscription
// @desc    Get subscription details for current user
// @access  Private
router.get('/', auth, subscriptionController.getSubscriptionDetails);

// @route   POST /api/subscription/cancel
// @desc    Cancel a subscription
// @access  Private
router.post('/cancel', auth, subscriptionController.cancelSubscription);

// @route   POST /api/subscription/webhook
// @desc    Process payment webhook from NOWPayments
// @access  Public (secured by webhook signature)
router.post('/webhook', subscriptionController.processPaymentWebhook);

module.exports = router;
