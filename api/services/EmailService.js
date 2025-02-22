const nodemailer = require('nodemailer');
const crypto = require('crypto');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 415,
            auth: {
                user: process.env.ADMIN_EMAIL,
                pass: process.env.ADMIN_PASSWORD
            }
        });
    }

    async sendVerificationEmail(user) {
        // Generate verification token
        const token = crypto.randomBytes(32).toString('hex');

        // Save token to user
        await user.update({ verificationToken: token });

        // Create verification URL
        const verificationUrl = `${process.env.BASE_URL}/verify-email?token=${token}&email=${user.email}`;
        // Email content
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Verify Your Email Address',
            html: `
                <h1>Welcome to FG POS!</h1>
                <p>Please click the link below to verify your email address:</p>
                <a href="${verificationUrl}">Verify Email</a>
                <p>If you didn't create this account, please ignore this email.</p>
            `
        };

        // Send email
        return this.transporter.sendMail(mailOptions);
    }

    async sendResetPasswordEmail(email, token) {
        const resetLink = `${process.env.BASE_URL}/reset-password?token=${token}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request',
            html: `
                <h1>Password Reset Request</h1>
                <p>You requested to reset your password. Please click the link below to reset your password:</p>
                <a href="${resetLink}">Reset Password</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error('Email sending failed:', error);
            throw new Error('Failed to send reset password email');
        }
    }
}

module.exports = new EmailService(); 