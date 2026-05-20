const translate = require('google-translate-api-x');
const { Message } = require('../models');
const { supportedLanguages, languageCodeMap } = require('../config');

// Track user language preferences in memory
const userLanguages = {};

// Track online users (userId -> Set of socketIds)
const onlineUsers = new Map();

/**
 * Setup Socket.io event handlers
 */
function setupSocketHandlers(io) {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Join a workspace room
        socket.on('join_workspace', (workspaceId) => {
            socket.join(`workspace_${workspaceId}`);
            socket.workspaceId = workspaceId;
            console.log(`Socket ${socket.id} joined workspace ${workspaceId}`);
            
            // Send current online users to the newly joined socket
            const onlineUserIds = Array.from(onlineUsers.keys());
            socket.emit('online_users', onlineUserIds);
        });

        // Join user's personal room for DMs and track online status
        socket.on('join_user', (userId) => {
            socket.join(`user_${userId}`);
            socket.userId = userId;
            console.log(`Socket ${socket.id} joined user room ${userId}`);
            
            // Track this user as online
            if (!onlineUsers.has(userId)) {
                onlineUsers.set(userId, new Set());
            }
            onlineUsers.get(userId).add(socket.id);
            
            // Broadcast to all workspaces that this user is now online
            io.emit('user_status_change', { userId, isOnline: true });
            console.log(`User ${userId} is now online`);
        });

        // Get list of currently online users
        socket.on('get_online_users', () => {
            const onlineUserIds = Array.from(onlineUsers.keys());
            socket.emit('online_users', onlineUserIds);
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
                // Detect source language and translate to English first
                let detectedLang = 'English';
                let englishText = content;
                
                try {
                    const detectResult = await translate(content, { to: 'en' });
                    englishText = detectResult.text;
                    const detectedCode = detectResult.from?.language?.iso || 'en';
                    const codeToLang = Object.entries(languageCodeMap).find(([name, code]) => code === detectedCode);
                    detectedLang = codeToLang ? codeToLang[0] : 'English';
                } catch (err) {
                    console.log('Detection fallback to English');
                }
                
                // Translate to all languages in parallel
                const translations = { 'English': englishText };
                if (detectedLang !== 'English') {
                    translations[detectedLang] = content;
                }
                
                const langsToTranslate = supportedLanguages.filter(lang => !translations[lang]);
                const translationPromises = langsToTranslate.map(async (lang) => {
                    try {
                        const result = await translate(englishText, { to: languageCodeMap[lang] });
                        return { lang, text: result.text };
                    } catch (err) {
                        console.error(`Translation to ${lang} failed:`, err.message);
                        return { lang, text: englishText };
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
                    io.to(`user_${senderId}`).to(`user_${recipientId}`).emit('receive_message', messageData);
                } else {
                    io.to(`workspace_${workspaceId}`).emit('receive_message', messageData);
                }
                
                console.log(`Message sent in workspace ${workspaceId}`);
            } catch (err) {
                console.error('Send message error:', err);
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
            
            // Remove this socket from online tracking
            if (socket.userId) {
                const userSockets = onlineUsers.get(socket.userId);
                if (userSockets) {
                    userSockets.delete(socket.id);
                    // If no more sockets for this user, they're offline
                    if (userSockets.size === 0) {
                        onlineUsers.delete(socket.userId);
                        io.emit('user_status_change', { userId: socket.userId, isOnline: false });
                        console.log(`User ${socket.userId} is now offline`);
                    }
                }
            }
        });
    });
}

module.exports = { setupSocketHandlers, userLanguages, onlineUsers };

