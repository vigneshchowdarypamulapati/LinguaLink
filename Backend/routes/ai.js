const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AIChat } = require('../models');

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// AI Chat - send message and get response
router.post('/chat', async (req, res) => {
    try {
        const userId = req.cookies.userId;
        const { messages, chatId } = req.body;
        const lastMessage = messages[messages.length - 1]?.content || "";
        
        if (!genAI) {
            return res.json({ 
                message: "AI Assistant requires a GEMINI_API_KEY. Please configure it in your environment.",
                chatId: null
            });
        }
        
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(lastMessage);
        const response = await result.response;
        const aiMessage = response.text();

        // Save to database if user is authenticated
        let savedChat = null;
        if (userId) {
            if (chatId) {
                // Update existing chat
                savedChat = await AIChat.findByIdAndUpdate(
                    chatId,
                    { 
                        $push: { 
                            messages: [
                                { role: 'user', content: lastMessage },
                                { role: 'assistant', content: aiMessage }
                            ]
                        }
                    },
                    { new: true }
                );
            } else {
                // Create new chat
                const title = lastMessage.slice(0, 50) + (lastMessage.length > 50 ? '...' : '');
                savedChat = await AIChat.create({
                    userId,
                    title,
                    messages: [
                        { role: 'user', content: lastMessage },
                        { role: 'assistant', content: aiMessage }
                    ]
                });
            }
        }

        res.json({ 
            message: aiMessage,
            chatId: savedChat?._id || null
        });
    } catch (err) {
        console.error("AI chat error:", err);
        res.status(500).json({ error: "AI chat failed: " + err.message });
    }
});

// Get all chats for user (sidebar)
router.get('/chats', async (req, res) => {
    try {
        const userId = req.cookies.userId;
        if (!userId) {
            return res.json([]);
        }
        const chats = await AIChat.find({ userId })
            .select('_id title createdAt updatedAt')
            .sort({ updatedAt: -1 })
            .limit(50);
        res.json(chats);
    } catch (err) {
        console.error("Get chats error:", err);
        res.status(500).json({ error: "Failed to get chats" });
    }
});

// Get single chat with messages
router.get('/chats/:id', async (req, res) => {
    try {
        const userId = req.cookies.userId;
        const chat = await AIChat.findOne({ _id: req.params.id, userId });
        if (!chat) {
            return res.status(404).json({ error: "Chat not found" });
        }
        res.json(chat);
    } catch (err) {
        console.error("Get chat error:", err);
        res.status(500).json({ error: "Failed to get chat" });
    }
});

// Delete a chat
router.delete('/chats/:id', async (req, res) => {
    try {
        const userId = req.cookies.userId;
        await AIChat.findOneAndDelete({ _id: req.params.id, userId });
        res.json({ status: "success" });
    } catch (err) {
        console.error("Delete chat error:", err);
        res.status(500).json({ error: "Failed to delete chat" });
    }
});

// AI Explain translation
router.post('/explain', async (req, res) => {
    try {
        const { original, translated, sourceLang, targetLang } = req.body;
        
        if (!genAI) {
            return res.json({ 
                explanation: `"${original}" (${sourceLang}) → "${translated}" (${targetLang}). Enable Gemini API for detailed explanations.` 
            });
        }
        
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Explain this translation:\nOriginal (${sourceLang}): "${original}"\nTranslated (${targetLang}): "${translated}"\n\nProvide a brief explanation of any nuances, idioms, or cultural context.`;
        
        const result = await model.generateContent(prompt);
        res.json({ explanation: result.response.text() });
    } catch (err) {
        console.error("AI explain error:", err);
        res.status(500).json({ error: "AI explain failed" });
    }
});

module.exports = router;
