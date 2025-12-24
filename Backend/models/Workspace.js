const mongoose = require('mongoose');

const WorkspaceSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        owner: { type: String, required: true },
        members: [{ type: String }],
        createdAt: { type: Date, default: Date.now }
    },
    {
        collection: "workspaces",
    }
);

module.exports = mongoose.model("Workspace", WorkspaceSchema);
