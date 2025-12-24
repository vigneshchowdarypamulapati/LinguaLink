const express = require('express');
const router = express.Router();
const { User, BilingualChat } = require('../models');

// Get user profile
router.get('/profile', async (req, res) => {
    try {
        const userId = req.cookies.userId;
        if (!userId) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const user = await User.findById(userId).select('fname lname email username preferredLanguage');
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(user);
    } catch (err) {
        console.error("Get user profile error:", err);
        res.status(500).json({ error: "Failed to get user profile" });
    }
});

// Update preferred language
router.put('/language', async (req, res) => {
    try {
        const userId = req.cookies.userId;
        if (!userId) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const { language } = req.body;
        await User.findByIdAndUpdate(userId, { preferredLanguage: language });
        res.json({ status: "success", language });
    } catch (err) {
        console.error("Update language error:", err);
        res.status(500).json({ error: "Failed to update language preference" });
    }
});

// Get bilingual chat history
router.get('/bilingual-chat', async (req, res) => {
    try {
        const userId = req.cookies.userId;
        if (!userId) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const messages = await BilingualChat.find({ userId }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (err) {
        console.error("Get bilingual chat error:", err);
        res.status(500).json({ error: "Failed to get chat history" });
    }
});

// Save bilingual chat message
router.post('/bilingual-chat', async (req, res) => {
    try {
        const userId = req.cookies.userId;
        if (!userId) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const { sender, original, translated, sourceLang, targetLang } = req.body;
        const message = await BilingualChat.create({
            userId, sender, original, translated, sourceLang, targetLang
        });
        res.json(message);
    } catch (err) {
        console.error("Save bilingual chat error:", err);
        res.status(500).json({ error: "Failed to save message" });
    }
});

// Delete bilingual chat
router.delete('/bilingual-chat', async (req, res) => {
    try {
        const userId = req.cookies.userId;
        if (!userId) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        await BilingualChat.deleteMany({ userId });
        res.json({ status: "success", message: "Chat history deleted" });
    } catch (err) {
        console.error("Delete bilingual chat error:", err);
        res.status(500).json({ error: "Failed to delete chat history" });
    }
});

module.exports = router;
