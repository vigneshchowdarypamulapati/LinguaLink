const mongoose = require('mongoose');

const AIChatSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        title: { type: String, default: 'New Chat' },
        messages: [{
            role: { type: String, enum: ['user', 'assistant'], required: true },
            content: { type: String, required: true },
            createdAt: { type: Date, default: Date.now }
        }],
        isActive: { type: Boolean, default: true }
    },
    {
        collection: "ai_chats",
        timestamps: true
    }
);

module.exports = mongoose.model("AIChat", AIChatSchema);
