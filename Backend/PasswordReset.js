const mongoose = require("mongoose");

const PasswordResetSchema = new mongoose.Schema(
    {
        email: { type: String, required: true },
        token: { type: String, required: true },
        expiresAt: { type: Date, required: true },
        used: { type: Boolean, default: false }
    },
    {
        collection: "password_resets",
    }
);

module.exports = mongoose.model("PasswordReset", PasswordResetSchema);
