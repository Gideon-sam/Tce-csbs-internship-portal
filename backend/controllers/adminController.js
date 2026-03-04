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

        // Year-wise internship breakdown
        const yearWiseInternships = await Internship.aggregate([
            {
                $lookup: {
                    from: 'students',
                    localField: 'studentId',
                    foreignField: '_id',
                    as: 'student'
                }
            },
            { $unwind: { path: '$student', preserveNullAndEmptyArrays: false } },
            {
                $match: {
                    'student.year': { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: '$student.year',
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        console.log('Year-wise internships aggregation result:', yearWiseInternships);

        // Calculate average internship duration
        const internshipsWithDuration = await Internship.find({
            durationFrom: { $exists: true },
            durationTo: { $exists: true }
        });

        let totalDurationDays = 0;
        let validDurationCount = 0;

        internshipsWithDuration.forEach(intern => {
            if (intern.durationFrom && intern.durationTo) {
                const duration = Math.abs(new Date(intern.durationTo) - new Date(intern.durationFrom));
                const days = Math.ceil(duration / (1000 * 60 * 60 * 24));
                totalDurationDays += days;
                validDurationCount++;
            }
        });

        const averageDuration = validDurationCount > 0
            ? Math.round(totalDurationDays / validDurationCount)
            : 0;

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
            yearStats,
            yearWiseInternships,
            averageDuration
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllInternships = async (req, res) => {
    try {
        const internships = await Internship.find()
            .populate('studentId', 'name registerNo department year credits')
            .sort({ createdAt: -1 });

        // Group internships by student
        const studentMap = new Map();

        for (const internship of internships) {
            if (!internship.studentId) continue;

            const studentId = internship.studentId._id.toString();

            if (!studentMap.has(studentId)) {
                // Get all internships for this student
                const studentHistory = await Internship.find({
                    studentId: internship.studentId._id
                }).sort({ createdAt: -1 });

                // Find the latest submission (most recent)
                const latestSubmission = studentHistory[0];

                studentMap.set(studentId, {
                    _id: latestSubmission._id,
                    studentId: internship.studentId,
                    companyName: latestSubmission.companyName,
                    description: latestSubmission.description,
                    mode: latestSubmission.mode,
                    status: latestSubmission.status,
                    durationFrom: latestSubmission.durationFrom,
                    durationTo: latestSubmission.durationTo,
                    certificateFilePath: latestSubmission.certificateFilePath,
                    pptFilePath: latestSubmission.pptFilePath,
                    reportFilePath: latestSubmission.reportFilePath,
                    photoFilePath: latestSubmission.photoFilePath,
                    createdAt: latestSubmission.createdAt,
                    rejectionReason: latestSubmission.rejectionReason,
                    studentHistory: studentHistory.map(hist => ({
                        _id: hist._id,
                        companyName: hist.companyName,
                        description: hist.description,
                        mode: hist.mode,
                        status: hist.status,
                        durationFrom: hist.durationFrom,
                        durationTo: hist.durationTo,
                        certificateFilePath: hist.certificateFilePath,
                        pptFilePath: hist.pptFilePath,
                        reportFilePath: hist.reportFilePath,
                        photoFilePath: hist.photoFilePath,
                        createdAt: hist.createdAt,
                        rejectionReason: hist.rejectionReason
                    }))
                });
            }
        }

        // Convert map to array
        const groupedInternships = Array.from(studentMap.values());

        res.json(groupedInternships);
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

// Proctor Management
exports.getAllProctors = async (req, res) => {
    try {
        const Proctor = require('../models/Proctor');

        const proctors = await Proctor.find().select('name email department');

        // Get student count for each proctor
        const proctorsWithStats = await Promise.all(proctors.map(async (proctor) => {
            const studentCount = await Student.countDocuments({ proctorId: proctor._id });
            const internshipCount = await Internship.countDocuments({ proctorId: proctor._id });
            const pendingCount = await Internship.countDocuments({
                proctorId: proctor._id,
                status: 'Pending'
            });

            return {
                _id: proctor._id,
                name: proctor.name,
                email: proctor.email,
                department: proctor.department,
                studentCount,
                internshipCount,
                pendingCount
            };
        }));

        res.json(proctorsWithStats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getProctorStudents = async (req, res) => {
    try {
        const { proctorId } = req.params;

        const students = await Student.find({ proctorId })
            .select('name registerNo email year credits department');

        // Get internship count for each student
        const studentsWithStats = await Promise.all(students.map(async (student) => {
            const internshipCount = await Internship.countDocuments({ studentId: student._id });
            const latestInternship = await Internship.findOne({ studentId: student._id })
                .sort({ createdAt: -1 })
                .select('companyName status createdAt');

            return {
                ...student.toObject(),
                internshipCount,
                latestInternship
            };
        }));

        res.json(studentsWithStats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
