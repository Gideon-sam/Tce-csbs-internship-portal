const express = require('express');
const {
    registerStudent,
    loginStudent,
    loginProctor,
    loginAdmin,
    googleAuth,
    completeGoogleRegistration,
    forgotPassword,
    verifyOTP,
    resetPassword
} = require('../controllers/authController');
const router = express.Router();

// Traditional Auth
router.post('/student/register', registerStudent);
router.post('/student/login', loginStudent);
router.post('/proctor/login', loginProctor);
router.post('/admin/login', loginAdmin);

// Google OAuth
router.post('/google', googleAuth);
router.post('/google/complete', completeGoogleRegistration);

// Password Reset
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

module.exports = router;
