const express = require('express');
const router = express.Router();
const { User, Workspace, Message } = require('../models');
const { sendInvitationEmail } = require('../utils/email');
const { validate } = require('../middleware/validate');

// Get all workspaces for user
router.get('/', async (req, res) => {
    try {
        const userId = req.cookies.userId;
        if (!userId) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }
        const workspaces = await Workspace.find({
            $or: [
                { owner: user.email },
                { members: user.email }
            ]
        });
        res.json(workspaces);
    } catch (err) {
        console.error("Get workspaces error:", err);
        res.status(500).json({ error: "Failed to fetch workspaces" });
    }
});

// Create workspace
router.post('/', validate('workspace'), async (req, res) => {
    try {
        const userId = req.cookies.userId;
        if (!userId) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: "Workspace name is required" });
        }
        const workspace = await Workspace.create({
            name,
            owner: user.email,
            members: [user.email]
        });
        res.json(workspace);
    } catch (err) {
        console.error("Create workspace error:", err);
        res.status(500).json({ error: "Failed to create workspace" });
    }
});

// Delete workspace
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.cookies.userId;
        if (!userId) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const user = await User.findById(userId);
        const workspace = await Workspace.findById(req.params.id);
        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }
        if (workspace.owner !== user.email) {
            return res.status(403).json({ error: "Not authorized" });
        }
        await Workspace.findByIdAndDelete(req.params.id);
        res.json({ status: "Workspace deleted" });
    } catch (err) {
        console.error("Delete workspace error:", err);
        res.status(500).json({ error: "Failed to delete workspace" });
    }
});

// Invite member
router.post('/:id/invite', validate('invite'), async (req, res) => {
    try {
        const userId = req.cookies.userId;
        if (!userId) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const inviter = await User.findById(userId);
        const { email } = req.body;
        const workspace = await Workspace.findById(req.params.id);
        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }
        if (workspace.members.includes(email)) {
            return res.status(400).json({ error: "User already a member" });
        }

        const existingUser = await User.findOne({ email });
        const isNewUser = !existingUser;

        workspace.members.push(email);
        await workspace.save();

        try {
            await sendInvitationEmail(email, inviter.fname, workspace.name, isNewUser);
            console.log(`Invitation email sent to ${email}`);
        } catch (emailErr) {
            console.error("Failed to send invitation email:", emailErr);
        }

        res.json({ 
            status: "success", 
            message: isNewUser ? "User invited and email sent" : "Invitation sent",
            workspace 
        });
    } catch (err) {
        console.error("Invite member error:", err);
        res.status(500).json({ error: "Failed to invite member" });
    }
});

// Get workspace members
router.get('/:id/members', async (req, res) => {
    try {
        const userId = req.cookies.userId;
        if (!userId) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const workspace = await Workspace.findById(req.params.id);
        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }
        const members = await User.find({ email: { $in: workspace.members } }).select('_id fname lname email');
        res.json(members);
    } catch (err) {
        console.error("Get members error:", err);
        res.status(500).json({ error: "Failed to get members" });
    }
});

// Get workspace messages
router.get('/:id/messages', async (req, res) => {
    try {
        const userId = req.cookies.userId;
        if (!userId) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const { recipientId } = req.query;
        
        let query = { workspaceId: req.params.id };
        
        if (recipientId) {
            query.$or = [
                { sender: userId, recipient: recipientId },
                { sender: recipientId, recipient: userId }
            ];
        } else {
            query.recipient = null;
        }
        
        const messages = await Message.find(query)
            .sort({ createdAt: 1 })
            .limit(100);
        
        res.json(messages);
    } catch (err) {
        console.error("Get messages error:", err);
        res.status(500).json({ error: "Failed to get messages" });
    }
});

module.exports = router;
