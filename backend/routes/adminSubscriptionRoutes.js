// routes/adminSubscriptionRoutes.js
const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// All routes require authentication and admin privileges

// @route   GET /api/admin/users/:userId/subscription
// @desc    Get subscription details for a specific user
// @access  Admin only
router.get('/users/:userId/subscription', auth, adminAuth, subscriptionController.getUserSubscription);

// @route   POST /api/admin/users/:userId/subscription/cancel
// @desc    Cancel a user's subscription
// @access  Admin only
router.post('/users/:userId/subscription/cancel', auth, adminAuth, subscriptionController.adminCancelSubscription);

// @route   POST /api/admin/users/:userId/subscription/add
// @desc    Add subscription time based on plan
// @access  Admin only
router.post('/users/:userId/subscription/add', auth, adminAuth, subscriptionController.adminAddSubscriptionTime);

// @route   POST /api/admin/users/:userId/subscription/set-date
// @desc    Set subscription end date
// @access  Admin only
router.post('/users/:userId/subscription/set-date', auth, adminAuth, subscriptionController.adminSetSubscriptionEndDate);

module.exports = router;
