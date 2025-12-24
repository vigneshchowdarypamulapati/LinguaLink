const express = require('express');
const router = express.Router();
const translate = require('google-translate-api-x');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { TranslationHistory } = require('../models');
const { languageCodeMap } = require('../config');
const { extractTextWithOCR } = require('../utils/ocr');
const { validate } = require('../middleware/validate');

const upload = multer({ storage: multer.memoryStorage() });
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Translate text
router.post('/translate', validate('translate'), async (req, res) => {
    try {
        const { text, sourceLang, targetLang } = req.body;
        if (!text || !targetLang) {
            return res.status(400).json({ error: "Text and targetLang required" });
        }
        const fromLang = (!sourceLang || sourceLang.toLowerCase() === 'auto') ? 'auto' : sourceLang.toLowerCase();
        const toLang = targetLang.toLowerCase();
        
        const result = await translate(text, { from: fromLang, to: toLang });
        res.json({ translated: result.text });
    } catch (err) {
        console.error("Translate error:", err);
        res.status(500).json({ error: "Translation failed: " + err.message });
    }
});

// Translate document
router.post('/translate-doc', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        let originalText = "";
        console.log(`Processing file: ${req.file.originalname}, Type: ${req.file.mimetype}, Size: ${req.file.size}`);

        if (req.file.mimetype === 'application/pdf') {
            const pdfData = await pdfParse(req.file.buffer);
            originalText = pdfData.text;
        } else if (req.file.mimetype === 'text/plain') {
            originalText = req.file.buffer.toString('utf-8');
        } else {
            return res.status(400).json({ error: "Unsupported file type. Only .txt and .pdf are supported." });
        }
        
        // Try OCR if text extraction failed
        if (!originalText || originalText.trim().length < 10) {
            console.log('Text extraction failed, attempting OCR...');
            originalText = await extractTextWithOCR(req.file.buffer);
            
            if (!originalText || originalText.trim().length === 0) {
                return res.status(400).json({ error: "Could not extract text from document." });
            }
        }
        
        if (originalText.length > 5000) {
            originalText = originalText.substring(0, 5000) + "... [Truncated]";
        }

        const { targetLanguage } = req.body;
        let translatedText = '';
        
        // Use Gemini AI for better translation
        if (genAI) {
            try {
                const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
                const prompt = `Translate the following text to ${targetLanguage}. Preserve formatting. Only output the translation:\n\n${originalText}`;
                const result = await model.generateContent(prompt);
                translatedText = result.response.text().trim();
            } catch (geminiErr) {
                console.error('Gemini failed, using fallback:', geminiErr.message);
                const targetCode = languageCodeMap[targetLanguage] || 'en';
                const result = await translate(originalText, { to: targetCode, autoCorrect: true });
                translatedText = result.text;
            }
        } else {
            const targetCode = languageCodeMap[targetLanguage] || 'en';
            const result = await translate(originalText, { to: targetCode, autoCorrect: true });
            translatedText = result.text;
        }

        res.json({ original: originalText, translated: translatedText });
    } catch (err) {
        console.error("Translate doc error:", err);
        res.status(500).json({ error: "Document translation failed" });
    }
});

// Get translation history
router.get('/history', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ error: "Email required" });
        }
        const history = await TranslationHistory.find({ email }).sort({ createdAt: -1 }).limit(50);
        res.json(history);
    } catch (err) {
        console.error("Get history error:", err);
        res.status(500).json({ error: "Failed to fetch history" });
    }
});

// Save to history
router.post('/history', async (req, res) => {
    try {
        const { email, original, translated, sourceLang, targetLang } = req.body;
        const entry = await TranslationHistory.create({ email, original, translated, sourceLang, targetLang });
        res.json(entry);
    } catch (err) {
        console.error("Save history error:", err);
        res.status(500).json({ error: "Failed to save history" });
    }
});

// Toggle favorite
router.put('/history/:id/favorite', async (req, res) => {
    try {
        const entry = await TranslationHistory.findById(req.params.id);
        if (!entry) {
            return res.status(404).json({ error: "Entry not found" });
        }
        entry.isFavorite = !entry.isFavorite;
        await entry.save();
        res.json(entry);
    } catch (err) {
        console.error("Toggle favorite error:", err);
        res.status(500).json({ error: "Failed to toggle favorite" });
    }
});

// Transcribe audio (placeholder)
router.post('/transcribe', async (req, res) => {
    res.json({ text: "Audio transcription not yet configured. Please type your text." });
});

// Text-to-speech (placeholder)
router.post('/tts', async (req, res) => {
    res.status(501).json({ error: "TTS not yet configured" });
});

module.exports = router;
