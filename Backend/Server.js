require('dotenv').config();
const { validateEnv } = require('./utils/validateEnv');
validateEnv();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

// Config
const { corsOptions } = require('./config');

// Routes
const { authRoutes, workspaceRoutes, translateRoutes, aiRoutes, userRoutes } = require('./routes');

// Middleware
const { apiLimiter, authLimiter, translateLimiter } = require('./middleware/rateLimit');

// Socket handlers
const { setupSocketHandlers } = require('./utils/socket');

// Initialize Express app
const app = express();

// Middleware
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

// Database connection
const mongourl = process.env.MONGO_URL;
mongoose
    .connect(mongourl, { useNewUrlParser: true })
    .then(() => console.log('Connected to database'))
    .catch((e) => console.log('Database connection error:', e));

// Mount routes with rate limiting
app.use('/auth', authLimiter, authRoutes);
app.use('/api/workspaces', apiLimiter, workspaceRoutes);
app.use('/api/translate', translateLimiter);
app.use('/api/translate-doc', translateLimiter);
app.use('/api', apiLimiter, translateRoutes);
app.use('/api/ai', apiLimiter, aiRoutes);
app.use('/api/user', apiLimiter, userRoutes);

// Route aliases for frontend compatibility
app.use('/api/ai-chat', apiLimiter, aiRoutes); // /api/ai-chat/chat works the same as /api/ai/chat
app.use('/api/bilingual-chat', apiLimiter, userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// HTTP Server wrapper for Socket.io
const server = http.createServer(app);

// Socket.io server with CORS
const io = new Server(server, {
    cors: {
        origin: corsOptions.origin,
        credentials: true
    }
});

// Setup socket handlers
setupSocketHandlers(io);

// Start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log(`Server Started On Port ${PORT} (with Socket.io)`);
});
