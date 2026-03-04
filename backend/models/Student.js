const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false }, // Optional for Google OAuth users
    registerNo: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    year: { type: String, required: true, enum: ['1st', '2nd', '3rd', '4th'] },
    credits: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    googleId: { type: String, unique: true, sparse: true }, // For Google OAuth
    resetPasswordOTP: { type: String }, // Hashed OTP for password reset
    resetPasswordExpires: { type: Date }, // OTP expiration time
}, { timestamps: true });

studentSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

studentSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Student', studentSchema);
