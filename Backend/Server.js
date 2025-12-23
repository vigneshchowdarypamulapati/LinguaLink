require('dotenv').config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const translate = require('google-translate-api-x');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const { pdfToPng } = require('pdf-to-png-converter');

const upload = multer({ storage: multer.memoryStorage() });

// OCR function for scanned PDFs
async function extractTextWithOCR(pdfBuffer) {
    try {
        console.log('Starting OCR extraction...');
        // Convert first page of PDF to PNG
        const pngPages = await pdfToPng(pdfBuffer, {
            disableFontFace: true,
            useSystemFonts: true,
            viewportScale: 2.0,
            pagesToProcess: [1, 2, 3] // Process first 3 pages
        });
        
        if (!pngPages || pngPages.length === 0) {
            console.log('No pages converted from PDF');
            return '';
        }
        
        console.log(`Converted ${pngPages.length} pages to images, running OCR...`);
        
        let fullText = '';
        for (const page of pngPages) {
            const { data: { text } } = await Tesseract.recognize(
                page.content,
                'eng+spa+fra+deu+ita+por+rus+jpn+chi_sim+hin', // Support all translator languages
                { logger: m => console.log(`OCR: ${m.status}`) }
            );
            fullText += text + '\n';
        }
        
        console.log(`OCR extracted ${fullText.length} characters`);
        return fullText.trim();
    } catch (err) {
        console.error('OCR extraction failed:', err);
        return '';
    }
}
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI (if API key available)
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';

// Cookie options for different environments
const cookieOptions = {
  httpOnly: true,
  secure: isProduction, // Only secure in production (HTTPS)
  sameSite: isProduction ? "none" : "lax", // 'none' for cross-origin in prod, 'lax' for dev
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// CORS configuration for production and development
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'https://lingualink-422af.web.app',
    'https://lingualink-422af.firebaseapp.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(cookieParser());
const mongoose = require("mongoose");
app.use(express.json());

const mongourl = process.env.MONGO_URL
  

mongoose
  .connect(mongourl, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("connected to database");
  })
  .catch((e) => console.log(e));

// User Schema 
const UserDetailsSchema = new mongoose.Schema(
    {
        fname: String,
        lname: String,
        username: { type: String, unique: true, sparse: true }, // User-picked display name
        dob: String,
        email: String,
        pass: String,
        preferredLanguage: { type: String, default: 'English' }, // Workspace chat language preference
    },
    {
        collection: "user",
        timestamps: true // Adds createdAt and updatedAt automatically
    }
);
const User = mongoose.model("user", UserDetailsSchema);

// Auth routes - matching frontend expectations
app.get("/auth/verify", async (req, res) => {
  try {
    const userId = req.cookies.userId;
    if (!userId) {
      return res.json({ status: false, message: "Not authenticated" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.json({ status: false, message: "User not found" });
    }
    
    // Get user's workspaces
    const userWorkspaces = await Workspace.find({
      $or: [
        { owner: user.email },
        { members: user.email }
      ]
    }).select('_id name');
    
    res.json({ 
      status: true, 
      user: { 
        _id: user._id, 
        email: user.email, 
        fname: user.fname,
        lname: user.lname,
        dob: user.dob,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        workspaces: userWorkspaces
      }
    });
  } catch (err) {
    console.error("Auth verify error:", err);
    res.json({ status: false, message: "Authentication failed" });
  }
});

app.post("/auth/signup", async (req, res) => {
  const { fname, lname, username, dob, email, pass } = req.body;
  try {
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.json({ status: "error", message: "User already exists" });
    }
    // Check if username is taken
    if (username) {
      const existingUsername = await User.findOne({ username: username });
      if (existingUsername) {
        return res.json({ status: "error", message: "Username already taken" });
      }
    }
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(pass, 10);
    const newUser = await User.create({ fname, lname, username, dob, email, pass: hashedPassword });
    // Set cookie for session
    res.cookie("userId", newUser._id.toString(), cookieOptions);
    res.json({ 
      status: "Registration successful", 
      user: { _id: newUser._id, email: newUser.email, fname: newUser.fname, username: newUser.username }
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.json({ status: "error", message: "Registration failed" });
  }
});

app.post("/auth/signin", async (req, res) => {
  const { email, pass } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.json({ status: "error", message: "User not found" });
    }
    // Compare password with bcrypt
    const isPasswordValid = await bcrypt.compare(pass, user.pass);
    if (!isPasswordValid) {
      return res.json({ status: "error", message: "Invalid password" });
    }
    // Set cookie for session
    res.cookie("userId", user._id.toString(), cookieOptions);
    res.json({ 
      status: "Login successful", 
      user: { _id: user._id, email: user.email, fname: user.fname }
    });
  } catch (err) {
    console.error("Signin error:", err);
    res.json({ status: "error", message: "Login failed" });
  }
});

app.post("/auth/logout", (req, res) => {
  res.clearCookie("userId");
  res.json({ status: "Logged out" });
});

// Password Reset
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const PasswordReset = require("./PasswordReset");

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'lingualink.app@gmail.com',
    pass: process.env.EMAIL_PASS
  }
});

// Forgot Password - Request reset link
app.post("/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists for security
      return res.json({ status: "success", message: "If the email exists, a reset link will be sent." });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token
    await PasswordReset.create({ email, token, expiresAt });

    // Send email
    const resetUrl = `${isProduction ? 'https://lingualink-422af.web.app' : 'http://localhost:5173'}/reset-password/${token}`;
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'lingualink.app@gmail.com',
      to: email,
      subject: 'LinguaLink - Password Reset',
      html: `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    });

    res.json({ status: "success", message: "Reset link sent to your email." });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.json({ status: "error", message: "Failed to send recovery email." });
  }
});

// Reset Password - With token
app.post("/auth/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const resetRequest = await PasswordReset.findOne({ 
      token, 
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!resetRequest) {
      return res.json({ status: "error", message: "Invalid or expired reset link." });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await User.updateOne({ email: resetRequest.email }, { pass: hashedPassword });

    // Mark token as used
    resetRequest.used = true;
    await resetRequest.save();

    res.json({ status: "success", message: "Password reset successfully." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.json({ status: "error", message: "Failed to reset password." });
  }
});


// Workspace Schema (moved from Workspace.js)
const WorkspaceSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        owner: { type: String, required: true }, // email of owner
        members: [{ type: String }], // array of member emails
        createdAt: { type: Date, default: Date.now }
    },
    {
        collection: "workspaces",
    }
);
const Workspace = mongoose.model("Workspace", WorkspaceSchema);

// Message Schema for real-time chat
const MessageSchema = new mongoose.Schema(
    {
        workspaceId: { type: String, required: true },
        sender: { type: String, required: true }, // userId
        senderName: { type: String, required: true },
        recipient: { type: String, default: null }, // null for group, recipientId for DM
        originalContent: { type: String, required: true },
        translations: { type: Object, default: {} }, // { "English": "...", "Spanish": "...", ... }
        createdAt: { type: Date, default: Date.now }
    },
    { collection: "messages" }
);
const Message = mongoose.model("Message", MessageSchema);

// Bilingual Chat Schema for personal 1-on-1 chat persistence
const BilingualChatSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true }, // Owner of this chat session
        sender: { type: String, enum: ['A', 'B'], required: true },
        original: { type: String, required: true },
        translated: { type: String, required: true },
        sourceLang: { type: String, required: true },
        targetLang: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    },
    { collection: "bilingual_chats" }
);
const BilingualChat = mongoose.model("BilingualChat", BilingualChatSchema);

// Languages supported
const supportedLanguages = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian', 'Japanese', 'Chinese', 'Hindi'];

// Language code mapping
const languageCodeMap = {
    'English': 'en',
    'Spanish': 'es',
    'French': 'fr',
    'German': 'de',
    'Italian': 'it',
    'Portuguese': 'pt',
    'Russian': 'ru',
    'Japanese': 'ja',
    'Chinese': 'zh-CN',
    'Hindi': 'hi'
};

// HTTP Server wrapper for Socket.io
const server = http.createServer(app);

// Socket.io server with CORS
const io = new Server(server, {
    cors: {
        origin: [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:3000',
            'https://lingualink-422af.web.app',
            'https://lingualink-422af.firebaseapp.com'
        ],
        credentials: true
    }
});

// Track user language preferences in memory (workspaceId -> userId -> language)
const userLanguages = {};

// Socket.io event handlers
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a workspace room
    socket.on('join_workspace', (workspaceId) => {
        socket.join(`workspace_${workspaceId}`);
        console.log(`Socket ${socket.id} joined workspace ${workspaceId}`);
    });

    // Join user's personal room for DMs
    socket.on('join_user', (userId) => {
        socket.join(`user_${userId}`);
        socket.userId = userId;
        console.log(`Socket ${socket.id} joined user room ${userId}`);
    });

    // Update user's language preference
    socket.on('update_language', ({ workspaceId, userId, language }) => {
        if (!userLanguages[workspaceId]) userLanguages[workspaceId] = {};
        userLanguages[workspaceId][userId] = language;
        console.log(`User ${userId} in workspace ${workspaceId} set language to ${language}`);
    });

    // Handle sending a message
    socket.on('send_message', async (data) => {
        const { workspaceId, senderId, recipientId, senderName, content } = data;
        
        try {
            // First, detect the source language and translate to English to normalize
            let detectedLang = 'English';
            let englishText = content;
            
            try {
                // Auto-detect and translate to English first
                const detectResult = await translate(content, { to: 'en' });
                englishText = detectResult.text;
                // Map detected language code back to language name
                const detectedCode = detectResult.from?.language?.iso || 'en';
                const codeToLang = Object.entries(languageCodeMap).find(([name, code]) => code === detectedCode);
                detectedLang = codeToLang ? codeToLang[0] : 'English';
            } catch (err) {
                console.log('Detection fallback to English');
            }
            
            // Now translate from English to all languages IN PARALLEL for speed
            const translations = {};
            translations['English'] = englishText; // English version
            
            // Also store original content in the detected language
            if (detectedLang !== 'English') {
                translations[detectedLang] = content; // Keep original in detected language
            }
            
            // Translate to all other languages from English - PARALLEL
            const langsToTranslate = supportedLanguages.filter(lang => !translations[lang]);
            const translationPromises = langsToTranslate.map(async (lang) => {
                try {
                    const result = await translate(englishText, { to: languageCodeMap[lang] });
                    return { lang, text: result.text };
                } catch (err) {
                    console.error(`Translation to ${lang} failed:`, err.message);
                    return { lang, text: englishText }; // Fallback to English
                }
            });
            
            const translationResults = await Promise.all(translationPromises);
            translationResults.forEach(({ lang, text }) => {
                translations[lang] = text;
            });

            // Save message to database
            const message = await Message.create({
                workspaceId,
                sender: senderId,
                senderName,
                recipient: recipientId || null,
                originalContent: content,
                translations
            });

            const messageData = {
                _id: message._id,
                sender: senderId,
                senderName,
                recipient: recipientId || null,
                originalContent: content,
                translations,
                createdAt: message.createdAt
            };

            // Broadcast message
            if (recipientId) {
                // DM: send to sender and recipient only
                io.to(`user_${senderId}`).to(`user_${recipientId}`).emit('receive_message', messageData);
            } else {
                // Group: broadcast to entire workspace
                io.to(`workspace_${workspaceId}`).emit('receive_message', messageData);
            }
            
            console.log(`Message sent in workspace ${workspaceId}`);
        } catch (err) {
            console.error('Send message error:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Workspace Routes
app.get("/api/workspaces", async (req, res) => {
  try {
    const userId = req.cookies.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    // Get workspaces where user is owner or member
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

app.post("/api/workspaces", async (req, res) => {
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

app.delete("/api/workspaces/:id", async (req, res) => {
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

app.post("/api/workspaces/:id/invite", async (req, res) => {
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

    // Check if user exists
    const existingUser = await User.findOne({ email: email });
    const isNewUser = !existingUser;

    // Add email to workspace members (even if they haven't signed up yet)
    workspace.members.push(email);
    await workspace.save();

    // Send invitation email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `You've been invited to join ${workspace.name} on LinguaLink!`,
      html: isNewUser 
        ? `
          <h2>You're Invited to LinguaLink! 🌐</h2>
          <p><strong>${inviter.fname}</strong> has invited you to join the workspace "<strong>${workspace.name}</strong>".</p>
          <p>To get started, you'll need to create an account:</p>
          <p><a href="http://localhost:5173/signup" style="background-color: #06b6d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Sign Up Now</a></p>
          <p>Use this email address (<strong>${email}</strong>) when signing up to automatically join the workspace.</p>
          <p>Start collaborating across languages in real-time!</p>
        `
        : `
          <h2>You've been invited! 🎉</h2>
          <p><strong>${inviter.fname}</strong> has invited you to join the workspace "<strong>${workspace.name}</strong>" on LinguaLink.</p>
          <p><a href="http://localhost:5173/login" style="background-color: #06b6d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Log In Now</a></p>
        `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Invitation email sent to ${email}`);
    } catch (emailErr) {
      console.error("Failed to send invitation email:", emailErr);
      // Continue even if email fails
    }

    res.json({ 
      status: "success", 
      message: isNewUser ? "User account created and invitation sent" : "Invitation sent",
      workspace 
    });
  } catch (err) {
    console.error("Invite member error:", err);
    res.status(500).json({ error: "Failed to invite member" });
  }
});

// Get workspace members with details
app.get("/api/workspaces/:id/members", async (req, res) => {
  try {
    const userId = req.cookies.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }
    // Get user details for each member email
    const members = await User.find({ email: { $in: workspace.members } }).select('_id fname lname email');
    res.json(members);
  } catch (err) {
    console.error("Get members error:", err);
    res.status(500).json({ error: "Failed to get members" });
  }
});

// Get workspace messages (for history)
app.get("/api/workspaces/:id/messages", async (req, res) => {
  try {
    const userId = req.cookies.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { recipientId } = req.query;
    
    let query = { workspaceId: req.params.id };
    
    if (recipientId) {
      // DM: get messages between these two users
      query.$or = [
        { sender: userId, recipient: recipientId },
        { sender: recipientId, recipient: userId }
      ];
    } else {
      // Group: get messages with no recipient
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

// ============================================
// Core API Routes for Translation Features
// ============================================

// Translation History Model
const TranslationHistorySchema = new mongoose.Schema({
  email: String,
  original: String,
  translated: String,
  sourceLang: String,
  targetLang: String,
  isFavorite: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { collection: "histories" });
const TranslationHistory = mongoose.model("TranslationHistory", TranslationHistorySchema);

// Get translation history
app.get("/api/history", async (req, res) => {
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

// Save translation to history
app.post("/api/history", async (req, res) => {
  try {
    const { email, original, translated, sourceLang, targetLang } = req.body;
    const entry = await TranslationHistory.create({
      email, original, translated, sourceLang, targetLang
    });
    res.json(entry);
  } catch (err) {
    console.error("Save history error:", err);
    res.status(500).json({ error: "Failed to save history" });
  }
});

// Toggle favorite on history item
app.put("/api/history/:id/favorite", async (req, res) => {
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

// Translate API using google-translate-api-x
app.post("/api/translate", async (req, res) => {
  try {
    const { text, sourceLang, targetLang } = req.body;
    if (!text || !targetLang) {
      return res.status(400).json({ error: "Text and targetLang required" });
    }
    // Normalize language codes - handle 'Auto' or undefined as 'auto'
    const fromLang = (!sourceLang || sourceLang.toLowerCase() === 'auto') ? 'auto' : sourceLang.toLowerCase();
    const toLang = targetLang.toLowerCase();
    
    // Use google-translate-api-x for actual translation
    const result = await translate(text, { 
      from: fromLang, 
      to: toLang 
    });
    res.json({ translated: result.text });
  } catch (err) {
    console.error("Translate error:", err);
    res.status(500).json({ error: "Translation failed: " + err.message });
  }
});

// Transcribe audio (placeholder - needs speech-to-text API)
app.post("/api/transcribe", async (req, res) => {
  try {
    // Placeholder - integrate with Google Speech-to-Text or Whisper API
    res.json({ text: "Audio transcription not yet configured. Please type your text." });
  } catch (err) {
    console.error("Transcribe error:", err);
    res.status(500).json({ error: "Transcription failed" });
  }
});

// Translate document (placeholder)
// Translate document (basic implementation)
app.post("/api/translate-doc", upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    let originalText = "";

    // Log file details for debugging
    console.log(`Processing file: ${req.file.originalname}, Type: ${req.file.mimetype}, Size: ${req.file.size}`);

    if (req.file.mimetype === 'application/pdf') {
        const pdfData = await pdfParse(req.file.buffer);
        originalText = pdfData.text;
    } else if (req.file.mimetype === 'text/plain') {
        originalText = req.file.buffer.toString('utf-8');
    } else {
         console.log("Unsupported mimetype:", req.file.mimetype);
         return res.status(400).json({ error: "Unsupported file type. Only .txt and .pdf are supported." });
    }
    
    console.log(`Extracted text length: ${originalText?.length}`);
    console.log(`Extracted text preview: ${originalText?.substring(0, 50)}`);

    // If pdf-parse failed to extract text, try OCR
    if (!originalText || originalText.trim().length < 10) {
        console.log('Text extraction failed or too short, attempting OCR...');
        originalText = await extractTextWithOCR(req.file.buffer);
        
        if (!originalText || originalText.trim().length === 0) {
            return res.status(400).json({ error: "Could not extract text from document. The PDF may be corrupted or contain only images that OCR couldn't read." });
        }
        console.log(`OCR successfully extracted ${originalText.length} characters`);
    }
    if (originalText.length > 5000) {
        originalText = originalText.substring(0, 5000) + "... [Truncated]";
    }

    const { targetLanguage } = req.body;
    console.log(`Target Language: ${targetLanguage}`);
    
    let translatedText = '';
    
    // Use Gemini AI for better context-aware translation with formatting preservation
    if (genAI) {
        try {
            console.log('Using Gemini AI for document translation...');
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
            
            const prompt = `You are a professional translator. Translate the following text to ${targetLanguage}.

IMPORTANT INSTRUCTIONS:
1. Preserve ALL formatting, line breaks, and paragraph structure exactly as in the original
2. Maintain proper grammar and natural flow in the target language  
3. Keep any bullet points, numbering, or special formatting
4. Do not add any explanations or notes - ONLY output the translation
5. If there are headers or titles, keep them as headers
6. Preserve any technical terms or proper nouns appropriately

TEXT TO TRANSLATE:
${originalText}

TRANSLATION:`;

            const result = await model.generateContent(prompt);
            translatedText = result.response.text().trim();
            console.log('Gemini translation completed successfully');
        } catch (geminiErr) {
            console.error('Gemini translation failed, falling back to google-translate:', geminiErr.message);
            // Fall back to google-translate-api-x
            const langMap = {
                'English': 'en', 'Spanish': 'es', 'French': 'fr', 'German': 'de',
                'Italian': 'it', 'Portuguese': 'pt', 'Russian': 'ru', 
                'Japanese': 'ja', 'Chinese': 'zh-CN', 'Hindi': 'hi'
            };
            const targetCode = langMap[targetLanguage] || 'en';
            const result = await translate(originalText, { to: targetCode, autoCorrect: true });
            translatedText = result.text;
        }
    } else {
        // Fallback to google-translate-api-x if Gemini not available
        console.log('Gemini not available, using google-translate-api-x...');
        const langMap = {
            'English': 'en', 'Spanish': 'es', 'French': 'fr', 'German': 'de',
            'Italian': 'it', 'Portuguese': 'pt', 'Russian': 'ru', 
            'Japanese': 'ja', 'Chinese': 'zh-CN', 'Hindi': 'hi'
        };
        const targetCode = langMap[targetLanguage] || 'en';
        const result = await translate(originalText, { to: targetCode, autoCorrect: true });
        translatedText = result.text;
    }

    res.json({ 
        original: originalText,
        translated: translatedText 
    });

  } catch (err) {
    console.error("Translate doc error details:", err);
    console.error(err.stack);
    res.status(500).json({ error: "Document translation failed" });
  }
});

// Text-to-speech (placeholder - needs TTS API)
app.post("/api/tts", async (req, res) => {
  try {
    // Placeholder - integrate with Google Text-to-Speech or other TTS API
    res.status(501).json({ error: "TTS not yet configured" });
  } catch (err) {
    console.error("TTS error:", err);
    res.status(500).json({ error: "TTS failed" });
  }
});

// AI Chat using Gemini
app.post("/api/ai-chat", async (req, res) => {
  try {
    const { messages } = req.body;
    const lastMessage = messages[messages.length - 1]?.content || "";
    
    if (!genAI) {
      // Fallback if no API key
      return res.json({ 
        message: "AI Assistant requires a GEMINI_API_KEY in your .env file. Please add it to enable AI features." 
      });
    }
    
    // Use Gemini for AI chat
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(lastMessage);
    const response = await result.response;
    
    res.json({ message: response.text() });
  } catch (err) {
    console.error("AI chat error:", err);
    res.status(500).json({ error: "AI chat failed: " + err.message });
  }
});

// AI Explain (placeholder)
app.post("/api/ai-explain", async (req, res) => {
  try {
    const { original, translated, sourceLang, targetLang } = req.body;
    // Placeholder - integrate with OpenAI API for explanations
    res.json({ 
      explanation: `Explanation: "${original}" (${sourceLang}) was translated to "${translated}" (${targetLang}). AI explanation feature coming soon.` 
    });
  } catch (err) {
    console.error("AI explain error:", err);
    res.status(500).json({ error: "AI explain failed" });
  }
});

// ============================================
// Profile Management Routes
// ============================================

// Update profile
app.put("/auth/profile", async (req, res) => {
  try {
    const userId = req.cookies.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { fname, lname, email } = req.body;
    const user = await User.findByIdAndUpdate(userId, { fname, lname, email }, { new: true });
    res.json({ status: "success", user: { _id: user._id, fname: user.fname, email: user.email } });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Change password
app.put("/auth/password", async (req, res) => {
  try {
    const userId = req.cookies.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(userId);
    
    const isValid = await bcrypt.compare(currentPassword, user.pass);
    if (!isValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.pass = hashedPassword;
    await user.save();
    
    res.json({ status: "success", message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
});

// Bilingual Chat Persistence Endpoints
// Get user's bilingual chat history
app.get("/api/bilingual-chat", async (req, res) => {
  try {
    const userId = req.cookies.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const messages = await BilingualChat.find({ userId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error("Get bilingual chat error:", err);
    res.status(500).json({ error: "Failed to get chat history" });
  }
});

// Save a bilingual chat message
app.post("/api/bilingual-chat", async (req, res) => {
  try {
    const userId = req.cookies.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { sender, original, translated, sourceLang, targetLang } = req.body;
    const message = await BilingualChat.create({
      userId,
      sender,
      original,
      translated,
      sourceLang,
      targetLang
    });
    res.json(message);
  } catch (err) {
    console.error("Save bilingual chat error:", err);
    res.status(500).json({ error: "Failed to save message" });
  }
});

// Delete all bilingual chat messages for user
app.delete("/api/bilingual-chat", async (req, res) => {
  try {
    const userId = req.cookies.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    await BilingualChat.deleteMany({ userId });
    res.json({ status: "success", message: "Chat history deleted" });
  } catch (err) {
    console.error("Delete bilingual chat error:", err);
    res.status(500).json({ error: "Failed to delete chat history" });
  }
});

// Get user profile (including language preference)
app.get("/api/user/profile", async (req, res) => {
  try {
    const userId = req.cookies.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const user = await User.findById(userId).select('fname lname email username preferredLanguage');
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error("Get user profile error:", err);
    res.status(500).json({ error: "Failed to get user profile" });
  }
});

// Update user's preferred language
app.put("/api/user/language", async (req, res) => {
  try {
    const userId = req.cookies.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { language } = req.body;
    await User.findByIdAndUpdate(userId, { preferredLanguage: language });
    res.json({ status: "success", language });
  } catch (err) {
    console.error("Update language error:", err);
    res.status(500).json({ error: "Failed to update language preference" });
  }
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server Started On Port ${PORT} (with Socket.io)`);
});
