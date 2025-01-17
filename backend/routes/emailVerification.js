const express = require('express');
const router = express.Router();
const emailVerificationController = require('../controllers/emailVerification');

// Check if email exists
router.post('/check-email', emailVerificationController.checkEmail);

// Verify email with token
router.get('/verify-email/:token', emailVerificationController.verifyEmail);

// Resend verification email
router.post('/resend-verification', emailVerificationController.resendVerification);

module.exports = router;
