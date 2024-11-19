// backend/routes/riskManagementRoutes.js
const express = require('express');
const router = express.Router();
const riskManagementController = require('../controllers/riskManagementController');
const auth = require('../middleware/auth');

router.post('/update', auth, riskManagementController.updateRiskManagement);
router.get('/', auth, riskManagementController.getRiskManagement);
router.post('/settings', auth, riskManagementController.updateSettings);

module.exports = router;