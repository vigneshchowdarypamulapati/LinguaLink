const express = require('express');
const router = express.Router();
const { AIChat } = require('../models');

// Helper to call Gemini with fallback models
async function callGeminiAPI(apiKey, prompt) {
    const models = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-pro",
        "gemini-1.0-pro"
    ];

    let lastError = null;

    for (const model of models) {
        try {
            console.log(`Attempting Gemini model: ${model}`);
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.warn(`Model ${model} failed:`, errorData);
                throw new Error(errorData.error?.message || `Status ${response.status}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (text) return text;
            
        } catch (e) {
            lastError = e;
            // Continue to next model
        }
    }
    throw lastError || new Error("All models failed");
}

// AI Chat - send message and get response
router.post('/chat', async (req, res) => {
    try {
        const userId = req.cookies.userId;
        const { messages, chatId } = req.body;
        const lastMessage = messages?.[messages.length - 1]?.content || "";
        
        if (!lastMessage) return res.status(400).json({ error: "No message content" });
        
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.json({ message: "API Key missing", chatId: null });
        
        let aiMessage;
        try {
            aiMessage = await callGeminiAPI(apiKey, lastMessage);
        } catch (geminiError) {
            console.error("All Gemini models failed:", geminiError);
            return res.status(500).json({ error: "AI Busy/Error: " + geminiError.message });
        }

        // Save to database
        let savedChat = null;
        if (userId) {
            try {
                if (chatId) {
                    savedChat = await AIChat.findByIdAndUpdate(
                        chatId,
                        { $push: { messages: [{ role: 'user', content: lastMessage }, { role: 'assistant', content: aiMessage }] } },
                        { new: true }
                    );
                } else {
                    const title = lastMessage.slice(0, 50) + (lastMessage.length > 50 ? '...' : '');
                    savedChat = await AIChat.create({
                        userId, title,
                        messages: [{ role: 'user', content: lastMessage }, { role: 'assistant', content: aiMessage }]
                    });
                }
            } catch (dbError) { console.error("DB Save error:", dbError); }
        }

        res.json({ message: aiMessage, chatId: savedChat?._id || null });
    } catch (err) {
        res.status(500).json({ error: "Server Error: " + err.message });
    }
});

// Explain translation
router.post('/explain', async (req, res) => {
    try {
        const { original, translated, sourceLang, targetLang } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) return res.json({ explanation: "API Key missing." });
        
        const prompt = `Explain translation: "${original}" (${sourceLang}) -> "${translated}" (${targetLang}). nuance?`;
        
        try {
            const explanation = await callGeminiAPI(apiKey, prompt);
            res.json({ explanation });
        } catch (e) {
            res.json({ explanation: "Explanation unavailable." });
        }
    } catch (err) {
        res.json({ explanation: "Error generating explanation." });
    }
});

module.exports = router;
