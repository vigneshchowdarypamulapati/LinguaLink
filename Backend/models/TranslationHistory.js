const mongoose = require('mongoose');

const TranslationHistorySchema = new mongoose.Schema({
    email: String,
    original: String,
    translated: String,
    sourceLang: String,
    targetLang: String,
    isFavorite: { type: Boolean, default: false },
    // Spaced repetition fields for Flashcard Trainer
    nextReviewDate: { type: Date, default: Date.now },
    repetitionLevel: { type: Number, default: 0 },
    easeFactor: { type: Number, default: 2.5 },
    createdAt: { type: Date, default: Date.now }
}, { collection: "histories" });

module.exports = mongoose.model("TranslationHistory", TranslationHistorySchema);
