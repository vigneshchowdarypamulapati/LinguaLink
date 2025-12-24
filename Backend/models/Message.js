const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
    {
        workspaceId: { type: String, required: true },
        sender: { type: String, required: true },
        senderName: { type: String, required: true },
        recipient: { type: String, default: null },
        originalContent: { type: String, required: true },
        translations: { type: Object, default: {} },
        createdAt: { type: Date, default: Date.now }
    },
    { collection: "messages" }
);

module.exports = mongoose.model("Message", MessageSchema);
