const nodemailer = require('nodemailer');

// Email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'lingualink.app@gmail.com',
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(email, resetUrl) {
    await transporter.sendMail({
        from: process.env.EMAIL_USER || 'lingualink.app@gmail.com',
        to: email,
        subject: 'LinguaLink - Password Reset',
        html: `
            <h2>Password Reset Request</h2>
            <p>Click the link below to reset your password:</p>
            <a href="${resetUrl}">${resetUrl}</a>
            <p>This link expires in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
        `
    });
}

/**
 * Send workspace invitation email
 */
async function sendInvitationEmail(email, inviterName, workspaceName, isNewUser) {
    const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://lingualink-422af.web.app' 
        : 'http://localhost:5173';
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `You've been invited to join ${workspaceName} on LinguaLink!`,
        html: isNewUser 
            ? `
                <h2>You're Invited to LinguaLink! 🌐</h2>
                <p><strong>${inviterName}</strong> has invited you to join the workspace "<strong>${workspaceName}</strong>".</p>
                <p>To get started, you'll need to create an account:</p>
                <p><a href="${baseUrl}/signup" style="background-color: #06b6d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Sign Up Now</a></p>
                <p>Use this email address (<strong>${email}</strong>) when signing up to automatically join the workspace.</p>
                <p>Start collaborating across languages in real-time!</p>
            `
            : `
                <h2>You've been invited! 🎉</h2>
                <p><strong>${inviterName}</strong> has invited you to join the workspace "<strong>${workspaceName}</strong>" on LinguaLink.</p>
                <p><a href="${baseUrl}/login" style="background-color: #06b6d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Log In Now</a></p>
            `
    };
    
    await transporter.sendMail(mailOptions);
}

module.exports = {
    transporter,
    sendPasswordResetEmail,
    sendInvitationEmail
};
