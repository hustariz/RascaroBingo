// backend/routes/riskManagementRoutes.js
const express = require('express');
const router = express.Router();
const riskManagementController = require('../controllers/riskManagementController');
const auth = require('../middleware/auth');

// Existing routes
router.get('/', auth, riskManagementController.getRiskManagement);
router.post('/update', auth, riskManagementController.updateRiskManagement);
router.post('/settings', auth, riskManagementController.updateSettings);
router.post('/reset-sl', auth, riskManagementController.resetStopLoss);
router.post('/reset-stats', auth, riskManagementController.resetDailyStats); 

module.exports = router;