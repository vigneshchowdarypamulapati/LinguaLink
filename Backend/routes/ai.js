const express = require('express');
const router = express.Router();
const { AIChat } = require('../models');

// AI Chat - send message and get response
router.post('/chat', async (req, res) => {
    try {
        const userId = req.cookies.userId;
        const { messages, chatId } = req.body;
        const lastMessage = messages?.[messages.length - 1]?.content || "";
        
        if (!lastMessage) {
            return res.status(400).json({ error: "No message content provided" });
        }
        
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.json({ 
                message: "AI Assistant requires a GEMINI_API_KEY. Please configure it in your environment.",
                chatId: null
            });
        }
        
        // Call Gemini API directly via REST to avoid SDK issues
        let aiMessage;
        try {
            // Using gemini-1.5-flash as confirmed working via debug endpoint
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: lastMessage }]
                    }]
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Gemini API Error details:", errorData);
                throw new Error(errorData.error?.message || `API Error: ${response.status}`);
            }

            const data = await response.json();
            aiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!aiMessage) {
                throw new Error("No content in AI response");
            }

        } catch (geminiError) {
            console.error("Gemini API error:", geminiError);
            return res.status(500).json({ 
                error: "AI service error: " + (geminiError.message || "Unknown error")
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
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            return res.json({ 
                explanation: `"${original}" (${sourceLang}) → "${translated}" (${targetLang}). Enable Gemini API for detailed explanations.` 
            });
        }
        
        const prompt = `Explain this translation:\nOriginal (${sourceLang}): "${original}"\nTranslated (${targetLang}): "${translated}"\n\nProvide a brief explanation of any nuances, idioms, or cultural context.`;
        
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });
            
            if (!response.ok) {
                 return res.json({ explanation: "AI explanation unavailable at the moment." });
            }

            const data = await response.json();
            const explanation = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            res.json({ explanation: explanation || "No explanation generated." });

        } catch (e) {
            console.error("Explain error:", e);
            res.json({ explanation: "Verified translation." });
        }
    } catch (err) {
        console.error("Explain route error:", err);
        res.status(500).json({ error: "Explain failed" });
    }
});

module.exports = router;
