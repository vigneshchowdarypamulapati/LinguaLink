const mongoose = require('mongoose');

const BilingualChatSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true },
        sender: { type: String, enum: ['A', 'B'], required: true },
        original: { type: String, required: true },
        translated: { type: String, required: true },
        sourceLang: { type: String, required: true },
        targetLang: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    },
    { collection: "bilingual_chats" }
);

module.exports = mongoose.model("BilingualChat", BilingualChatSchema);
