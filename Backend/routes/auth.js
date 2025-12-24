const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { User, Workspace, PasswordReset } = require('../models');
const { cookieOptions, isProduction } = require('../config');
const { sendPasswordResetEmail } = require('../utils/email');
const { validate } = require('../middleware/validate');

// Verify authentication
router.get('/verify', async (req, res) => {
    try {
        const userId = req.cookies.userId;
        if (!userId) {
            return res.json({ status: false, message: "Not authenticated" });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.json({ status: false, message: "User not found" });
        }
        
        const userWorkspaces = await Workspace.find({
            $or: [
                { owner: user.email },
                { members: user.email }
            ]
        }).select('_id name');
        
        res.json({ 
            status: true, 
            user: { 
                _id: user._id, 
                email: user.email, 
                fname: user.fname,
                lname: user.lname,
                dob: user.dob,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                workspaces: userWorkspaces
            }
        });
    } catch (err) {
        console.error("Auth verify error:", err);
        res.json({ status: false, message: "Authentication failed" });
    }
});

// Sign up
router.post('/signup', validate('signup'), async (req, res) => {
    const { fname, lname, username, dob, email, pass } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.json({ status: "error", message: "User already exists" });
        }
        if (username) {
            const existingUsername = await User.findOne({ username });
            if (existingUsername) {
                return res.json({ status: "error", message: "Username already taken" });
            }
        }
        const hashedPassword = await bcrypt.hash(pass, 10);
        const newUser = await User.create({ fname, lname, username, dob, email, pass: hashedPassword });
        res.cookie("userId", newUser._id.toString(), cookieOptions);
        res.json({ 
            status: "Registration successful", 
            user: { _id: newUser._id, email: newUser.email, fname: newUser.fname, username: newUser.username }
        });
    } catch (err) {
        console.error("Signup error:", err);
        res.json({ status: "error", message: "Registration failed" });
    }
});

// Sign in
router.post('/signin', validate('signin'), async (req, res) => {
    const { email, pass } = req.body;
    try {
        console.log('Signin attempt for:', email);
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found:', email);
            return res.json({ status: "error", message: "User not found" });
        }
        const isPasswordValid = await bcrypt.compare(pass, user.pass);
        if (!isPasswordValid) {
            console.log('Invalid password for:', email);
            return res.json({ status: "error", message: "Invalid password" });
        }
        res.cookie("userId", user._id.toString(), cookieOptions);
        console.log('Login successful for:', email);
        res.json({ 
            status: "Login successful", 
            user: { _id: user._id, email: user.email, fname: user.fname }
        });
    } catch (err) {
        console.error("Signin error:", err);
        res.json({ status: "error", message: "Login failed: " + err.message });
    }
});

// Logout
router.post('/logout', (req, res) => {
    res.clearCookie("userId");
    res.json({ status: "Logged out" });
});

// Forgot password
router.post('/forgot-password', validate('forgotPassword'), async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ status: "success", message: "If the email exists, a reset link will be sent." });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await PasswordReset.create({ email, token, expiresAt });

        const resetUrl = `${isProduction ? 'https://lingualink-422af.web.app' : 'http://localhost:5173'}/reset-password/${token}`;
        await sendPasswordResetEmail(email, resetUrl);

        res.json({ status: "success", message: "Reset link sent to your email." });
    } catch (err) {
        console.error("Forgot password error:", err);
        res.json({ status: "error", message: "Failed to send recovery email." });
    }
});

// Reset password
router.post('/reset-password', validate('resetPassword'), async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const resetRequest = await PasswordReset.findOne({ 
            token, 
            used: false,
            expiresAt: { $gt: new Date() }
        });

        if (!resetRequest) {
            return res.json({ status: "error", message: "Invalid or expired reset link." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.updateOne({ email: resetRequest.email }, { pass: hashedPassword });
        
        resetRequest.used = true;
        await resetRequest.save();

        res.json({ status: "success", message: "Password reset successfully." });
    } catch (err) {
        console.error("Reset password error:", err);
        res.json({ status: "error", message: "Failed to reset password." });
    }
});

// Update profile
router.put('/profile', async (req, res) => {
    try {
        const userId = req.cookies.userId;
        if (!userId) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const { fname, lname, email } = req.body;
        const user = await User.findByIdAndUpdate(userId, { fname, lname, email }, { new: true });
        res.json({ status: "success", user: { _id: user._id, fname: user.fname, email: user.email } });
    } catch (err) {
        console.error("Update profile error:", err);
        res.status(500).json({ error: "Failed to update profile" });
    }
});

// Change password
router.put('/password', async (req, res) => {
    try {
        const userId = req.cookies.userId;
        if (!userId) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(userId);
        
        const isValid = await bcrypt.compare(currentPassword, user.pass);
        if (!isValid) {
            return res.status(400).json({ error: "Current password is incorrect" });
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.pass = hashedPassword;
        await user.save();
        
        res.json({ status: "success", message: "Password changed successfully" });
    } catch (err) {
        console.error("Change password error:", err);
        res.status(500).json({ error: "Failed to change password" });
    }
});

module.exports = router;
