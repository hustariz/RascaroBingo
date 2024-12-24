// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Public Routes (No auth required)
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected Routes (Auth required)
router.get('/me', auth, userController.getCurrentUser);
router.post('/refresh-token', userController.refreshToken);

// Admin routes (Auth + Admin required)
router.get('/all', auth, adminAuth, userController.getAllUsers);
router.put('/premium-status', auth, adminAuth, userController.updateUserPremiumStatus);

// Error handling middleware
router.use((err, req, res, next) => {
  console.error('Route error:', err);
  res.status(500).json({ message: 'Server Error', error: err.message });
});

module.exports = router;