const express = require('express');
const { submitInternship, getMyInternships, getAssignedInternships, updateInternshipStatus, getApprovedInternships } = require('../controllers/internshipController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const router = express.Router();

router.post('/submit', protect, authorize('student'), upload.fields([
    { name: 'certificate', maxCount: 1 },
    { name: 'ppt', maxCount: 1 },
    { name: 'report', maxCount: 1 },
    { name: 'photo', maxCount: 1 }
]), submitInternship);
router.get('/my-internships', protect, authorize('student'), getMyInternships);
router.get('/assigned', protect, authorize('proctor'), getAssignedInternships);
router.put('/:id/status', protect, authorize('proctor'), updateInternshipStatus);
router.get('/approved', getApprovedInternships);

module.exports = router;
