const express = require('express');
const { getStats, getAllInternships, getLowCreditStudents, sendLowCreditAlerts } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/stats', protect, authorize('admin'), getStats);
router.get('/internships', protect, authorize('admin'), getAllInternships);
router.get('/low-credits', protect, authorize('admin'), getLowCreditStudents);
router.post('/send-alerts', protect, authorize('admin'), sendLowCreditAlerts);

module.exports = router;
