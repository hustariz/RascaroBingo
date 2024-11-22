// backend/routes/riskManagementRoutes.js
const express = require('express');
const router = express.Router();
const riskManagementController = require('../controllers/riskManagementController');
const auth = require('../middleware/auth');

// Existing routes
router.get('/', auth, riskManagementController.getRiskManagement);
router.post('/update', auth, riskManagementController.updateRiskManagement);
router.post('/settings', auth, riskManagementController.updateSettings);
router.post('/reset', auth, riskManagementController.resetStopLoss);

module.exports = router;