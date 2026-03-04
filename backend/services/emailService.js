const nodemailer = require('nodemailer');

// Create reusable transporter with optimized configuration for fast delivery
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // Use TLS
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        },
        // Optimized settings for faster delivery
        pool: true, // Use pooled connections
        maxConnections: 5,
        maxMessages: 10,
        connectionTimeout: 5000, // 5 seconds
        greetingTimeout: 5000,
        socketTimeout: 10000 // 10 seconds
    });
};

// Email templates
const emailTemplates = {
    welcome: (name, email) => ({
        from: '"TCE CSBS Internship Portal" <no-reply@portal.com>',
        to: email,
        subject: 'Welcome to TCE CSBS Internship Portal',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #830000; color: white; padding: 20px; text-align: center;">
                    <h2>Welcome to TCE CSBS Internship Portal</h2>
                </div>
                <div style="padding: 20px; background: #f9f9f9;">
                    <p>Dear ${name},</p>
                    <p>Your registration has been successful! You can now log in to submit your internship details.</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p>Please ensure you complete <strong>3 credits</strong> before the end of your 5th semester.</p>
                    <hr style="margin: 20px 0;">
                    <div style="background: white; padding: 15px; border-left: 4px solid #830000;">
                        <h3 style="margin-top: 0;">Contact Information</h3>
                        <p><strong>Thiagarajar College of Engineering</strong></p>
                        <p>Madurai - 625 015</p>
                        <p>Tamil Nadu, India</p>
                        <p>📞 +91 452 2482240</p>
                        <p>🌐 www.tce.edu</p>
                    </div>
                </div>
            </div>
        `
    }),

    internshipSubmitted: (studentName, studentEmail, companyName) => ({
        from: '"TCE CSBS Internship Portal" <no-reply@portal.com>',
        to: studentEmail,
        subject: 'Internship Submitted Successfully',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #830000; color: white; padding: 20px; text-align: center;">
                    <h2>Internship Submitted</h2>
                </div>
                <div style="padding: 20px; background: #f9f9f9;">
                    <p>Dear ${studentName},</p>
                    <p>Your internship at <strong>${companyName}</strong> has been submitted successfully and is pending approval from your proctor.</p>
                    <p>You will receive an email notification once your submission is reviewed.</p>
                    <hr style="margin: 20px 0;">
                    <div style="background: white; padding: 15px; border-left: 4px solid #830000;">
                        <h3 style="margin-top: 0;">Contact Information</h3>
                        <p><strong>Thiagarajar College of Engineering</strong></p>
                        <p>Madurai - 625 015</p>
                        <p>Tamil Nadu, India</p>
                        <p>📞 +91 452 2482240</p>
                        <p>🌐 www.tce.edu</p>
                    </div>
                </div>
            </div>
        `
    }),

    internshipStatusUpdate: (studentName, studentEmail, companyName, status, rejectionReason = '') => ({
        from: '"TCE CSBS Internship Portal" <no-reply@portal.com>',
        to: studentEmail,
        subject: `Internship ${status}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: ${status === 'Approved' ? '#4caf50' : '#d32f2f'}; color: white; padding: 20px; text-align: center;">
                    <h2>Internship ${status}</h2>
                </div>
                <div style="padding: 20px; background: #f9f9f9;">
                    <p>Dear ${studentName},</p>
                    <p>Your internship at <strong>${companyName}</strong> has been <strong>${status}</strong>.</p>
                    ${status === 'Rejected' ? `<p style="color: #d32f2f;"><strong>Reason:</strong> ${rejectionReason}</p>` : '<p style="color: #4caf50;">Congratulations! You have earned 1 credit.</p>'}
                    <hr style="margin: 20px 0;">
                    <div style="background: white; padding: 15px; border-left: 4px solid #830000;">
                        <h3 style="margin-top: 0;">Contact Information</h3>
                        <p><strong>Thiagarajar College of Engineering</strong></p>
                        <p>Madurai - 625 015</p>
                        <p>Tamil Nadu, India</p>
                        <p>📞 +91 452 2482240</p>
                        <p>🌐 www.tce.edu</p>
                    </div>
                </div>
            </div>
        `
    }),

    creditAlert: (studentName, studentEmail, credits) => ({
        from: '"TCE CSBS Internship Portal" <no-reply@portal.com>',
        to: studentEmail,
        subject: 'Credit Alert - Action Required',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #830000; color: white; padding: 20px; text-align: center;">
                    <h2>Credit Alert</h2>
                </div>
                <div style="padding: 20px; background: #f9f9f9;">
                    <p>Dear ${studentName},</p>
                    <p>This is to inform you that you have currently earned <strong>${credits} out of 3 required credits</strong>.</p>
                    <p style="color: #d32f2f; font-weight: bold;">You must complete 3 credits before the end of your 5th semester.</p>
                    <p>Please submit your internship details at the earliest to avoid any issues.</p>
                    <hr style="margin: 20px 0;">
                    <div style="background: white; padding: 15px; border-left: 4px solid #830000;">
                        <h3 style="margin-top: 0;">Contact Information</h3>
                        <p><strong>Thiagarajar College of Engineering</strong></p>
                        <p>Madurai - 625 015</p>
                        <p>Tamil Nadu, India</p>
                        <p>📞 +91 452 2482240</p>
                        <p>🌐 www.tce.edu</p>
                    </div>
                </div>
            </div>
        `
    }),

    passwordReset: (name, email, otp) => ({
        from: '"TCE CSBS Internship Portal" <no-reply@portal.com>',
        to: email,
        subject: 'Password Reset OTP',
        text: `Dear ${name},

You have requested to reset your password.

Your OTP: ${otp}

This OTP is valid for 10 minutes.

If you did not request a password reset, please ignore this email.

---
Thiagarajar College of Engineering
Madurai - 625 015, Tamil Nadu, India
Phone: +91 452 2482240
Website: www.tce.edu`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #830000; color: white; padding: 20px; text-align: center;">
                    <h2>Password Reset Request</h2>
                </div>
                <div style="padding: 20px; background: #f9f9f9;">
                    <p>Dear ${name},</p>
                    <p>You have requested to reset your password. Please use the following OTP to proceed:</p>
                    <div style="background: white; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                        <h1 style="color: #830000; letter-spacing: 8px; margin: 0; font-size: 36px;">${otp}</h1>
                    </div>
                    <p><strong>This OTP is valid for 10 minutes.</strong></p>
                    <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
                    <hr style="margin: 20px 0;">
                    <div style="background: white; padding: 15px; border-left: 4px solid #830000;">
                        <h3 style="margin-top: 0;">Contact Information</h3>
                        <p><strong>Thiagarajar College of Engineering</strong></p>
                        <p>Madurai - 625 015</p>
                        <p>Tamil Nadu, India</p>
                        <p>📞 +91 452 2482240</p>
                        <p>🌐 www.tce.edu</p>
                    </div>
                </div>
            </div>
        `
    })
};

// Send email with optimized retry logic for fast delivery
const sendEmail = async (emailOptions, retries = 2) => { // Reduced retries from 3 to 2
    const transporter = createTransporter();

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`Sending email (attempt ${attempt}/${retries})...`);
            console.log('To:', emailOptions.to);
            console.log('Subject:', emailOptions.subject);

            const info = await transporter.sendMail(emailOptions);

            console.log('✅ Email sent successfully!');
            console.log('Message ID:', info.messageId);

            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error(`❌ Email failed (attempt ${attempt}/${retries}):`, error.message);

            if (attempt === retries) {
                console.error('All email attempts failed');
                return { success: false, error: error.message };
            }

            // Shorter wait before retry (500ms instead of 1-3 seconds)
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
};

module.exports = {
    sendEmail,
    emailTemplates
};
