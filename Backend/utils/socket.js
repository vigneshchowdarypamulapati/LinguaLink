const translate = require('google-translate-api-x');
const { Message } = require('../models');
const { supportedLanguages, languageCodeMap } = require('../config');

// Track user language preferences in memory
const userLanguages = {};

/**
 * Setup Socket.io event handlers
 */
function setupSocketHandlers(io) {
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
        });
    });
}

module.exports = { setupSocketHandlers, userLanguages };
