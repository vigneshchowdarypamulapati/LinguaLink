const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// AI Chat
router.post('/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        const lastMessage = messages[messages.length - 1]?.content || "";
        
        if (!genAI) {
            return res.json({ 
                message: "AI Assistant requires a GEMINI_API_KEY in your .env file." 
            });
        }
        
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(lastMessage);
        const response = await result.response;
        
        res.json({ message: response.text() });
    } catch (err) {
        console.error("AI chat error:", err);
        res.status(500).json({ error: "AI chat failed: " + err.message });
    }
});

// AI Explain
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
