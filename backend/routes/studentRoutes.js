const express = require('express');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/authMiddleware');
const { sendEmail, emailTemplates } = require('../services/emailService');
const router = express.Router();

// Get student credits
router.get('/credits', protect, authorize('student'), async (req, res) => {
    try {
        const student = await Student.findById(req.user.id);
        res.json({ credits: student.credits || 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check credits and send alert if needed
router.post('/check-credits', protect, authorize('student'), async (req, res) => {
    try {
        const student = await Student.findById(req.user.id);

        if (student.credits < 3) {
            // Send credit alert email
            console.log('Sending credit alert email to:', student.email);
            const emailResult = await sendEmail(emailTemplates.creditAlert(student.name, student.email, student.credits));

            if (!emailResult.success) {
                console.error('Credit alert email failed');
            }
        }

        res.json({ message: 'Credit check completed' });
    } catch (error) {
        console.error('Credit check error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
