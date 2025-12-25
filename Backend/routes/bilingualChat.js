const express = require('express');
const router = express.Router();
const { BilingualChat } = require('../models');

// Get bilingual chat history
router.get('/', async (req, res) => {
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
router.post('/', async (req, res) => {
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

// Delete bilingual chat history
router.delete('/', async (req, res) => {
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
