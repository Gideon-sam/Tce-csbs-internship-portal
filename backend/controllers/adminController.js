const Student = require('../models/Student');
const Internship = require('../models/Internship');

const { sendEmail, emailTemplates } = require('../services/emailService');

exports.getStats = async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments();
        const totalInternships = await Internship.countDocuments();
        const pendingInternships = await Internship.countDocuments({ status: 'Pending' });
        const approvedInternships = await Internship.countDocuments({ status: 'Approved' });
        const rejectedInternships = await Internship.countDocuments({ status: 'Rejected' });

        const onlineCount = await Internship.countDocuments({ mode: 'Online' });
        const offlineCount = await Internship.countDocuments({ mode: 'Offline' });

        const studentsCompletedCredits = await Student.countDocuments({ credits: { $gte: 3 } });
        const studentsPendingCredits = await Student.countDocuments({ credits: { $lt: 3 } });

        // Count students with at least one approved internship
        const uniqueInternshipStudents = await Internship.distinct('studentId', { status: 'Approved' });
        const studentsWithInternships = uniqueInternshipStudents.length;

        // Year-wise stats
        const yearStats = await Student.aggregate([
            { $group: { _id: '$year', count: { $sum: 1 } } }
        ]);

        res.json({
            totalStudents,
            totalInternships,
            pendingInternships,
            approvedInternships,
            rejectedInternships,
            studentsCompletedCredits,
            studentsPendingCredits,
            studentsWithInternships,
            modeStats: { online: onlineCount, offline: offlineCount },
            yearStats
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllInternships = async (req, res) => {
    try {
        const internships = await Internship.find().populate('studentId', 'name registerNo department year');
        res.json(internships);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getLowCreditStudents = async (req, res) => {
    try {
        const students = await Student.find({ credits: { $lt: 3 } }).select('name registerNo email department year credits');
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.sendLowCreditAlerts = async (req, res) => {
    try {
        const students = await Student.find({ credits: { $lt: 3 } });
        let sentCount = 0;
        let failedCount = 0;

        for (const student of students) {
            const emailResult = await sendEmail(emailTemplates.creditAlert(student.name, student.email, student.credits));
            if (emailResult.success) {
                sentCount++;
            } else {
                failedCount++;
            }
        }

        res.json({
            message: 'Alerts process completed',
            sent: sentCount,
            failed: failedCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
