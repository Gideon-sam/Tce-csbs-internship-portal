const Internship = require('../models/Internship');
const Student = require('../models/Student');
const Proctor = require('../models/Proctor');
const { sendEmail, emailTemplates } = require('../services/emailService');

// Submit Internship
exports.submitInternship = async (req, res) => {
    try {
        const { companyName, description, mode, durationFrom, durationTo } = req.body;
        const certificateFilePath = req.files['certificate'] ? req.files['certificate'][0].path : null;
        const pptFilePath = req.files['ppt'] ? req.files['ppt'][0].path : null;
        const reportFilePath = req.files['report'] ? req.files['report'][0].path : null;
        const photoFilePath = req.files['photo'] ? req.files['photo'][0].path : null;

        if (!certificateFilePath) {
            return res.status(400).json({ message: 'Certificate file is required' });
        }

        // Find student to get department
        const student = await Student.findById(req.user.id);

        // Check if student already has internships with assigned proctor
        const existingInternship = await Internship.findOne({
            studentId: req.user.id,
            proctorId: { $exists: true, $ne: null }
        });

        let assignedProctor;

        if (existingInternship && existingInternship.proctorId) {
            // Use the same proctor as previous internships
            assignedProctor = existingInternship.proctorId;
            console.log('Using existing proctor for student:', student.name);
        } else {
            // Find a proctor in the same department for first-time submission
            const proctor = await Proctor.findOne({ department: student.department });
            if (proctor) {
                assignedProctor = proctor._id;
                // Add to proctor's assigned students if not already there
                if (!proctor.assignedStudents.includes(student._id)) {
                    proctor.assignedStudents.push(student._id);
                    await proctor.save();
                }
                console.log('Assigned new proctor for student:', student.name);
            } else {
                console.warn(`No proctor found for department: ${student.department}`);
            }
        }

        const internship = await Internship.create({
            studentId: req.user.id,
            companyName,
            description,
            mode,
            durationFrom,
            durationTo,
            certificateFilePath,
            pptFilePath,
            reportFilePath,
            photoFilePath,
            proctorId: assignedProctor
        });

        // Send Email Notification to Student
        console.log('Sending submission confirmation email to:', student.email);
        const emailResult = await sendEmail(emailTemplates.internshipSubmitted(student.name, student.email, companyName));

        if (!emailResult.success) {
            console.error('Submission confirmation email failed');
        }

        res.status(201).json({ message: 'Internship submitted successfully', internship });
    } catch (error) {
        console.error('Internship submission error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get Student Internships
exports.getMyInternships = async (req, res) => {
    try {
        const internships = await Internship.find({ studentId: req.user.id });
        res.json(internships);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Proctor Assigned Internships with Student History (Grouped by Student)
exports.getAssignedInternships = async (req, res) => {
    try {
        const internships = await Internship.find({ proctorId: req.user.id })
            .populate('studentId', 'name registerNo year credits department')
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

// Approve/Reject Internship
exports.updateInternshipStatus = async (req, res) => {
    try {
        const { status, rejectionReason } = req.body;
        const internship = await Internship.findById(req.params.id);

        if (!internship) {
            return res.status(404).json({ message: 'Internship not found' });
        }

        if (internship.proctorId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this internship' });
        }

        internship.status = status;
        if (status === 'Rejected') {
            internship.rejectionReason = rejectionReason;
        } else {
            internship.rejectionReason = undefined; // Clear reason if approved or pending
        }

        await internship.save();

        // Recalculate Student Credits
        const approvedInternships = await Internship.find({
            studentId: internship.studentId,
            status: 'Approved'
        });

        let totalCredits = 0;

        approvedInternships.forEach(intern => {
            const start = new Date(intern.durationFrom);
            const end = new Date(intern.durationTo);
            const durationInTime = end.getTime() - start.getTime();
            const durationInDays = durationInTime / (1000 * 3600 * 24);

            let credits = 0;
            if (intern.mode === 'Offline') {
                credits = Math.floor(durationInDays / 20) * 1;
            } else if (intern.mode === 'Online') {
                credits = Math.floor(durationInDays / 20) * 0.5;
            }
            totalCredits += credits;
        });

        await Student.findByIdAndUpdate(internship.studentId, { credits: totalCredits });

        // Send Email Notification
        const student = await Student.findById(internship.studentId);
        console.log('Sending status update email to:', student.email);
        const emailResult = await sendEmail(
            emailTemplates.internshipStatusUpdate(student.name, student.email, internship.companyName, status, rejectionReason)
        );

        if (!emailResult.success) {
            console.error('Status update email failed');
        }

        res.json({ message: `Internship ${status}`, internship });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get All Approved Internships (Public)
exports.getApprovedInternships = async (req, res) => {
    try {
        const internships = await Internship.find({ status: 'Approved' })
            .populate('studentId', 'name registerNo department year')
            .sort({ createdAt: -1 });
        res.json(internships);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
