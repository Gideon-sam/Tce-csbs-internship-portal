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
            photoFilePath
        });

        // Find student to get department and assign proctor
        const student = await Student.findById(req.user.id);
        // Find a proctor in the same department
        const proctor = await Proctor.findOne({ department: student.department });

        if (proctor) {
            internship.proctorId = proctor._id;
            await internship.save();
            // Add to proctor's assigned students if not already there
            if (!proctor.assignedStudents.includes(student._id)) {
                proctor.assignedStudents.push(student._id);
                await proctor.save();
            }
        } else {
            console.warn(`No proctor found for department: ${student.department}`);
        }

        // Send Email Notification to Student
        console.log('Sending submission confirmation email to:', student.email);
        const emailResult = await sendEmail(emailTemplates.internshipSubmitted(student.name, student.email, companyName));

        if (!emailResult.success) {
            console.error('Submission confirmation email failed');
        }

        res.status(201).json({ message: 'Internship submitted successfully', internship });
    } catch (error) {
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

// Get Proctor Assigned Internships
exports.getAssignedInternships = async (req, res) => {
    try {
        const internships = await Internship.find({ proctorId: req.user.id }).populate('studentId', 'name registerNo year');
        res.json(internships);
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
