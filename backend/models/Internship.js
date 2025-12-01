const mongoose = require('mongoose');

const internshipSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    companyName: { type: String, required: true },
    description: { type: String, required: true },
    mode: { type: String, required: true, enum: ['Online', 'Offline'] },
    durationFrom: { type: Date, required: true },
    durationTo: { type: Date, required: true },
    certificateFilePath: { type: String, required: true },
    pptFilePath: { type: String },
    reportFilePath: { type: String },
    photoFilePath: { type: String },
    status: { type: String, default: 'Pending', enum: ['Pending', 'Approved', 'Rejected'] },
    proctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Proctor' },
    rejectionReason: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Internship', internshipSchema);
