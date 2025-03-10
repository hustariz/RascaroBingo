// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Public Routes (No auth required)
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/refresh-token', userController.refreshToken);
router.post('/reset-password-request', userController.requestPasswordReset);
router.post('/reset-password/:token', userController.resetPassword);

// Protected Routes (Auth required)
router.get('/me', auth, userController.getCurrentUser);
router.get('/stats', auth, userController.getUserStats);
router.post('/stats/recalculate', auth, userController.recalculateAllStats);

// Admin routes (Auth + Admin required)
router.get('/all', auth, adminAuth, userController.getAllUsers);
router.put('/premium/:userId', auth, adminAuth, userController.updateUserPremiumStatus);
router.put('/admin/:userId', auth, adminAuth, userController.updateUserAdminStatus);
router.put('/email', auth, adminAuth, userController.updateUserEmail);
router.post('/send-verification', auth, adminAuth, userController.sendVerificationEmail);
router.put('/username', auth, adminAuth, userController.updateUsername);
router.delete('/:userId', auth, adminAuth, userController.deleteUser);

// Error handling middleware
router.use((err, req, res, next) => {
  console.error('Route error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

module.exports = router;