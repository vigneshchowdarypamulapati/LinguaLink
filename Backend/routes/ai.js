const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AIChat } = require('../models');

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// AI Chat - send message and get response
router.get('/models', async (req, res) => {
    try {
        if (!genAI) return res.json({ error: "No API Key" });
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        // There isn't a direct listModels on the client instance in some versions, 
        // but let's try accessing the model list if available or infer from error.
        // Actually best way in SDK is usually separate, but let's try a simple generation test on known models.
        
        // Better: Try to list models using the API directly if SDK doesn't expose it easily in this version.
        // The SDK usually does not expose listModels on the client object directly in older versions?
        // Let's rely on checking specific models.
        
        const modelsToCheck = ["gemini-pro", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro"];
        const results = {};
        
        for (const m of modelsToCheck) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                await model.generateContent("Test");
                results[m] = "Available";
            } catch (e) {
                results[m] = e.message;
            }
        }
        res.json(results);
    } catch (e) {
        res.json({ error: e.message }); 
    }
});

router.post('/chat', async (req, res) => {
    try {
        const userId = req.cookies.userId;
        const { messages, chatId } = req.body;
        const lastMessage = messages?.[messages.length - 1]?.content || "";
        
        if (!lastMessage) {
            return res.status(400).json({ error: "No message content provided" });
        }
        
        if (!genAI) {
            return res.json({ 
                message: "AI Assistant requires a GEMINI_API_KEY. Please configure it in your environment.",
                chatId: null
            });
        }
        
        // Call Gemini API
        let aiMessage;
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result = await model.generateContent(lastMessage);
            const response = await result.response;
            aiMessage = response.text();
        } catch (geminiError) {
            console.error("Gemini API error:", geminiError);
            return res.status(500).json({ 
                error: "AI service error: " + (geminiError.message || "Unknown error"),
                details: geminiError.status || null
            });
        }

        // Save to database if user is authenticated
        let savedChat = null;
        if (userId) {
            try {
                if (chatId) {
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
            } catch (dbError) {
                console.error("Database save error:", dbError);
                // Still return the AI response even if save fails
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
        
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `Explain this translation:\nOriginal (${sourceLang}): "${original}"\nTranslated (${targetLang}): "${translated}"\n\nProvide a brief explanation of any nuances, idioms, or cultural context.`;
        
        const result = await model.generateContent(prompt);
        res.json({ explanation: result.response.text() });
    } catch (err) {
        console.error("AI explain error:", err);
        res.status(500).json({ error: "AI explain failed" });
    }
});

module.exports = router;
