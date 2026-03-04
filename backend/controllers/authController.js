const Student = require('../models/Student');
const Proctor = require('../models/Proctor');
const Admin = require('../models/Admin');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendEmail, emailTemplates } = require('../services/emailService');

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

// Student Auth
exports.registerStudent = async (req, res) => {
    try {
        const { name, email, password, registerNo, department, year } = req.body;

        if (!email.endsWith('@student.tce.edu')) {
            return res.status(400).json({ message: 'Only @student.tce.edu emails are allowed.' });
        }

        const student = await Student.create({ name, email, password, registerNo, department, year });

        // Send Welcome Email
        console.log('Sending welcome email to:', email);
        const emailResult = await sendEmail(emailTemplates.welcome(name, email));

        if (!emailResult.success) {
            console.error('Welcome email failed but continuing registration');
        }

        res.status(201).json({ message: 'Student registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.loginStudent = async (req, res) => {
    try {
        const { email, password } = req.body;
        const student = await Student.findOne({ email });
        if (!student || !(await student.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        res.json({
            token: generateToken(student._id, 'student'),
            user: { ...student._doc, role: 'student' }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Proctor Auth
exports.loginProctor = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Proctor login attempt:', email);
        const proctor = await Proctor.findOne({ email });
        console.log('Proctor found:', proctor ? 'Yes' : 'No');
        if (!proctor || !(await proctor.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        res.json({
            token: generateToken(proctor._id, 'proctor'),
            user: { ...proctor._doc, role: 'proctor' }
        });
    } catch (error) {
        console.error('Proctor login error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Admin Auth
exports.loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Admin login attempt:', email);
        const admin = await Admin.findOne({ email });
        console.log('Admin found:', admin ? 'Yes' : 'No');
        if (!admin || !(await admin.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        res.json({
            token: generateToken(admin._id, 'admin'),
            user: { ...admin._doc, role: 'admin' }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Google OAuth
exports.googleAuth = async (req, res) => {
    try {
        const { credential, role = 'student' } = req.body;

        // Decode Google JWT token
        const base64Url = credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(Buffer.from(base64, 'base64').toString().split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const googleUser = JSON.parse(jsonPayload);
        const { sub: googleId, email, name } = googleUser;

        // Only allow student.tce.edu emails
        if (!email.endsWith('@student.tce.edu')) {
            return res.status(400).json({ message: 'Only @student.tce.edu emails are allowed.' });
        }

        // Check if user exists
        let student = await Student.findOne({ $or: [{ email }, { googleId }] });

        if (student) {
            // User exists, log them in
            if (!student.googleId) {
                student.googleId = googleId;
                await student.save();
            }
        } else {
            // Create new user - need additional info
            return res.status(206).json({
                message: 'Additional information required',
                partialUser: { name, email, googleId }
            });
        }

        res.json({
            token: generateToken(student._id, 'student'),
            user: { ...student._doc, role: 'student' }
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Complete Google OAuth registration with additional details
exports.completeGoogleRegistration = async (req, res) => {
    try {
        const { googleId, name, email, registerNo, department, year } = req.body;

        if (!email.endsWith('@student.tce.edu')) {
            return res.status(400).json({ message: 'Only @student.tce.edu emails are allowed.' });
        }

        const student = await Student.create({
            name,
            email,
            googleId,
            registerNo,
            department,
            year,
            password: null // No password for OAuth users
        });

        // Send Welcome Email
        console.log('Sending welcome email to:', email);
        await sendEmail(emailTemplates.welcome(name, email));

        res.status(201).json({
            token: generateToken(student._id, 'student'),
            user: { ...student._doc, role: 'student' }
        });
    } catch (error) {
        console.error('Complete Google registration error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Forgot Password - Send OTP
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const student = await Student.findOne({ email });

        if (!student) {
            return res.status(404).json({ message: 'No account found with this email.' });
        }

        if (student.googleId && !student.password) {
            return res.status(400).json({ message: 'This account uses Google Sign-In. Please login with Google.' });
        }

        // Generate 6-digit OTP
        const crypto = require('crypto');
        const otp = crypto.randomInt(100000, 999999).toString();

        // Hash OTP before storing
        const hashedOTP = await bcrypt.hash(otp, 10);

        // Set OTP and expiration (10 minutes)
        student.resetPasswordOTP = hashedOTP;
        student.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await student.save();

        // Send OTP email
        console.log('Sending password reset OTP to:', email);
        const emailResult = await sendEmail(emailTemplates.passwordReset(student.name, email, otp));

        if (!emailResult.success) {
            return res.status(500).json({ message: 'Failed to send OTP email. Please try again.' });
        }

        res.json({ message: 'OTP sent to your email. Valid for 10 minutes.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const student = await Student.findOne({ email });

        if (!student || !student.resetPasswordOTP || !student.resetPasswordExpires) {
            return res.status(400).json({ message: 'Invalid or expired OTP request.' });
        }

        // Check if OTP is expired
        if (Date.now() > student.resetPasswordExpires) {
            student.resetPasswordOTP = undefined;
            student.resetPasswordExpires = undefined;
            await student.save();
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        // Verify OTP
        const isValid = await bcrypt.compare(otp, student.resetPasswordOTP);
        if (!isValid) {
            return res.status(400).json({ message: 'Invalid OTP.' });
        }

        res.json({ message: 'OTP verified successfully.' });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Reset Password
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const student = await Student.findOne({ email });

        if (!student || !student.resetPasswordOTP || !student.resetPasswordExpires) {
            return res.status(400).json({ message: 'Invalid or expired OTP request.' });
        }

        // Check if OTP is expired
        if (Date.now() > student.resetPasswordExpires) {
            student.resetPasswordOTP = undefined;
            student.resetPasswordExpires = undefined;
            await student.save();
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        // Verify OTP
        const isValid = await bcrypt.compare(otp, student.resetPasswordOTP);
        if (!isValid) {
            return res.status(400).json({ message: 'Invalid OTP.' });
        }

        // Update password
        student.password = newPassword; // Will be hashed by pre-save hook
        student.resetPasswordOTP = undefined;
        student.resetPasswordExpires = undefined;
        await student.save();

        res.json({ message: 'Password reset successfully. You can now login with your new password.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: error.message });
    }
};
