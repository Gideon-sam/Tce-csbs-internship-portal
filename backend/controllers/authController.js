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
        const proctor = await Proctor.findOne({ email });
        if (!proctor || !(await proctor.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        res.json({
            token: generateToken(proctor._id, 'proctor'),
            user: { ...proctor._doc, role: 'proctor' }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Admin Auth
exports.loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await Admin.findOne({ email });
        if (!admin || !(await admin.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        res.json({
            token: generateToken(admin._id, 'admin'),
            user: { ...admin._doc, role: 'admin' }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
