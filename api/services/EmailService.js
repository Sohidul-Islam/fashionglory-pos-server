const nodemailer = require('nodemailer');
const crypto = require('crypto');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    async sendVerificationEmail(user) {
        // Generate verification token
        const token = crypto.randomBytes(32).toString('hex');

        // Save token to user
        await user.update({ verificationToken: token });

        // Create verification URL
        const verificationUrl = `${process.env.APP_URL}/verify-email/${token}`;

        // Email content
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Verify Your Email Address',
            html: `
                <h1>Welcome to Our Platform!</h1>
                <p>Please click the link below to verify your email address:</p>
                <a href="${verificationUrl}">Verify Email</a>
                <p>If you didn't create this account, please ignore this email.</p>
            `
        };

        // Send email
        return this.transporter.sendMail(mailOptions);
    }
}

module.exports = new EmailService(); 