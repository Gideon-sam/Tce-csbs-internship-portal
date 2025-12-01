const nodemailer = require('nodemailer');

// Create reusable transporter with proper configuration
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
            rejectUnauthorized: false,
            ciphers: 'SSLv3'
        },
        debug: true, // Enable debug output
        logger: true // Log information
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
    })
};

// Send email with retry logic
const sendEmail = async (emailOptions, retries = 3) => {
    const transporter = createTransporter();

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`Attempting to send email (attempt ${attempt}/${retries})...`);
            console.log('Email recipient:', emailOptions.to);
            console.log('Email subject:', emailOptions.subject);

            const info = await transporter.sendMail(emailOptions);

            console.log('Email sent successfully!');
            console.log('Message ID:', info.messageId);
            console.log('Response:', info.response);

            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error(`Email sending failed (attempt ${attempt}/${retries}):`, error.message);

            if (attempt === retries) {
                console.error('All email sending attempts failed');
                console.error('Error details:', {
                    message: error.message,
                    code: error.code,
                    command: error.command
                });
                return { success: false, error: error.message };
            }

            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
};

module.exports = {
    sendEmail,
    emailTemplates
};
