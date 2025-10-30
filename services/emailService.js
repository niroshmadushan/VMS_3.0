const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    async sendEmail(to, subject, html, text) {
        try {
            const result = await this.transporter.sendMail({
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to: to,
                subject: subject,
                html: html,
                text: text
            });
            return { success: true, messageId: result.messageId };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async sendVerificationEmail(email, firstName, verificationToken) {
        const subject = 'Email Verification - Booking System';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">📧 Email Verification</h2>
                <p>Dear ${firstName},</p>
                <p>Please click the link below to verify your email address:</p>
                <a href="${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}" 
                   style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Verify Email
                </a>
                <p>If you didn't request this verification, please ignore this email.</p>
            </div>
        `;
        const text = `Email Verification - Please visit ${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        
        return await this.sendEmail(email, subject, html, text);
    }

    async sendPasswordResetEmail(email, firstName, resetToken) {
        const subject = 'Password Reset - Booking System';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #e74c3c;">🔒 Password Reset</h2>
                <p>Dear ${firstName},</p>
                <p>You requested a password reset. Click the link below to reset your password:</p>
                <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}" 
                   style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Reset Password
                </a>
                <p>This link will expire in 1 hour.</p>
            </div>
        `;
        const text = `Password Reset - Please visit ${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        
        return await this.sendEmail(email, subject, html, text);
    }

    async sendEmailVerificationOTP(email, firstName, otpCode) {
        const subject = 'Email Verification OTP - Booking System';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">🔐 Email Verification OTP</h2>
                <p>Dear ${firstName},</p>
                <p>Your email verification code is:</p>
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; color: #007bff; border-radius: 8px; margin: 20px 0;">
                    ${otpCode}
                </div>
                <p>This code will expire in 10 minutes.</p>
            </div>
        `;
        const text = `Email Verification OTP: ${otpCode}`;
        
        return await this.sendEmail(email, subject, html, text);
    }

    async sendOTPEmail(email, firstName, otpCode, type = 'login') {
        const subject = `${type === 'login' ? 'Login' : 'Verification'} OTP - Booking System`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">🔐 ${type === 'login' ? 'Login' : 'Verification'} OTP</h2>
                <p>Dear ${firstName},</p>
                <p>Your ${type === 'login' ? 'login' : 'verification'} code is:</p>
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; color: #007bff; border-radius: 8px; margin: 20px 0;">
                    ${otpCode}
                </div>
                <p>This code will expire in 10 minutes.</p>
            </div>
        `;
        const text = `${type === 'login' ? 'Login' : 'Verification'} OTP: ${otpCode}`;
        
        return await this.sendEmail(email, subject, html, text);
    }
}

const emailService = new EmailService();

module.exports = {
    transporter: emailService.transporter,
    sendEmail: (emailData) => emailService.sendEmail(emailData.to, emailData.subject, emailData.html, emailData.text),
    sendVerificationEmail: (email, firstName, verificationToken) => emailService.sendVerificationEmail(email, firstName, verificationToken),
    sendPasswordResetEmail: (email, firstName, resetToken) => emailService.sendPasswordResetEmail(email, firstName, resetToken),
    sendEmailVerificationOTP: (email, firstName, otpCode) => emailService.sendEmailVerificationOTP(email, firstName, otpCode),
    sendOTPEmail: (email, firstName, otpCode, type) => emailService.sendOTPEmail(email, firstName, otpCode, type)
};
