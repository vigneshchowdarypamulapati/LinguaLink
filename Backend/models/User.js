const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        fname: String,
        lname: String,
        username: { type: String, unique: true, sparse: true },
        dob: String,
        email: String,
        pass: String,
        preferredLanguage: { type: String, default: 'English' },
    },
    {
        collection: "user",
        timestamps: true
    }
);

module.exports = mongoose.model("User", UserSchema);
