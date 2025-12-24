const mongoose = require('mongoose');

const TranslationHistorySchema = new mongoose.Schema({
    email: String,
    original: String,
    translated: String,
    sourceLang: String,
    targetLang: String,
    isFavorite: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
}, { collection: "histories" });

module.exports = mongoose.model("TranslationHistory", TranslationHistorySchema);
