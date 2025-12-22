import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, MessageSquare, Globe } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL, SOCKET_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useTheme } from '../../context/ThemeContext';

interface Message {
    _id: string;
    sender: string;
    recipient?: string;
    senderName: string;
    originalContent: string;
    translations: { [key: string]: string };
    createdAt: string;
}

interface WorkspaceChatProps {
    onClose: () => void;
    recipientId?: string | null;
    recipientName?: string | null;
}

const WorkspaceChat: React.FC<WorkspaceChatProps> = ({ onClose, recipientId, recipientName }) => {
    const { user } = useAuth();
    const { currentWorkspace } = useWorkspace();
    const { isDarkMode } = useTheme();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [language, setLanguage] = useState('English');
    const [isConnected, setIsConnected] = useState(false);
    const [isLangOpen, setIsLangOpen] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const langMenuRef = useRef<HTMLDivElement>(null);
    const chatRef = useRef<HTMLDivElement>(null);

    const languages = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian', 'Japanese', 'Chinese', 'Hindi'];

    useEffect(() => {
        if (!currentWorkspace || !user) return;

        // Connect to Socket.io
        socketRef.current = io(SOCKET_URL);

        socketRef.current.on('connect', () => {
            setIsConnected(true);
            console.log("Connected to chat");
            socketRef.current?.emit('join_workspace', currentWorkspace._id);
            socketRef.current?.emit('join_user', user._id);

            // Sync current language preference
            socketRef.current?.emit('update_language', {
                workspaceId: currentWorkspace._id,
                userId: user._id,
                language: language
            });
        });

        socketRef.current.on('receive_message', (message: Message) => {
            if (recipientId) {
                // DM Mode
                const isRelevantDM =
                    (message.sender === user._id && message.recipient === recipientId) ||
                    (message.sender === recipientId && message.recipient === user._id);

                if (isRelevantDM) setMessages(prev => [...prev, message]);
            } else {
                // Group Mode
                if (!message.recipient) {
                    setMessages(prev => [...prev, message]);
                }
            }
        });

        socketRef.current.on('disconnect', () => {
            setIsConnected(false);
        });

        // Click outside listener
        const handleClickOutside = (event: MouseEvent) => {
            if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
                setIsLangOpen(false);
            }
            if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
                // onClose(); // Disable auto-close on click outside for embedded mode ideally, keeping for now if prop used
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            socketRef.current?.disconnect();
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [currentWorkspace, user, onClose, recipientId]);

    // Fetch history when view changes
    useEffect(() => {
        const fetchHistory = async () => {
            if (!currentWorkspace) return;
            try {
                const params = recipientId ? `?recipientId=${recipientId}&userId=${user?._id}` : '';
                const res = await axios.get(`${API_BASE_URL}/api/workspaces/${currentWorkspace._id}/messages${params}`);
                setMessages(res.data);
            } catch (error) {
                console.error("Failed to fetch chat history", error);
            }
        };

        setMessages([]);
        fetchHistory();
    }, [recipientId, currentWorkspace, user]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!input.trim() || !currentWorkspace || !user || !socketRef.current) return;

        const messageData = {
            workspaceId: currentWorkspace._id,
            senderId: user._id,
            recipientId: recipientId || null,
            senderName: user.fname,
            content: input
        };

        socketRef.current.emit('send_message', messageData);
        setInput('');
    };

    const handleLanguageSelect = (lang: string) => {
        setLanguage(lang);
        setIsLangOpen(false);

        if (currentWorkspace && user && socketRef.current) {
            socketRef.current.emit('update_language', {
                workspaceId: currentWorkspace._id,
                userId: user._id,
                language: lang
            });
        }
    };

    const getDisplayContent = (msg: Message) => {
        if (msg.sender === user?._id) return msg.originalContent;
        return msg.translations[language] || msg.originalContent;
    };

    if (!currentWorkspace) return null;

    return (
        <div ref={chatRef} className={`flex flex-col overflow-hidden border h-full w-full ${isDarkMode ? 'bg-slate-950 border-white/20' : 'bg-white border-gray-300'} shadow-none rounded-none`}>
            {/* Header */}
            <div className={`p-4 flex justify-between items-center border-b flex-shrink-0 ${isDarkMode ? 'bg-slate-900 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
                <div className="flex items-center">
                    <MessageSquare size={18} className="text-cyan-500 mr-2" />
                    <div>
                        <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            {recipientName ? `@${recipientName}` : currentWorkspace.name}
                        </h3>
                        <div className={`flex items-center text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                            <span className={`w-2 h-2 ${isConnected ? 'bg-green-400' : 'bg-red-400'} rounded-full mr-1`}></span>
                            {isConnected ? 'Online' : 'Offline'}
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    {/* Language Dropdown */}
                    <div className="relative" ref={langMenuRef}>
                        <button
                            onClick={() => setIsLangOpen(!isLangOpen)}
                            className={`p-2 rounded-lg transition-colors flex items-center space-x-1 ${isDarkMode ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-gray-200 text-slate-500 hover:text-slate-900'}`}
                            title="Select Language"
                        >
                            <Globe size={18} />
                            <span className="text-xs font-medium">{language.substring(0, 2).toUpperCase()}</span>
                        </button>

                        {isLangOpen && (
                            <div className={`absolute right-0 top-full mt-2 w-40 rounded-xl shadow-xl border overflow-hidden py-1 z-50 ${isDarkMode ? 'bg-slate-800 border-white/10' : 'bg-white border-gray-200'}`}>
                                {languages.map(lang => (
                                    <button
                                        key={lang}
                                        onClick={() => handleLanguageSelect(lang)}
                                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${language === lang
                                            ? 'bg-cyan-500/10 text-cyan-500 font-medium'
                                            : isDarkMode ? 'text-slate-300 hover:bg-white/5' : 'text-slate-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        {lang}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar ${isDarkMode ? 'bg-slate-950' : 'bg-gray-50'}`}>
                {messages.map((msg, idx) => {
                    const isMe = msg.sender === user?._id;
                    return (
                        <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-sm ${isMe
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-tr-none'
                                : isDarkMode ? 'bg-slate-800 text-white rounded-tl-none border border-slate-700' : 'bg-gray-200 text-black rounded-tl-none border border-gray-300'
                                }`}>
                                <p className={`text-sm ${isMe ? 'text-white' : isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                                    {getDisplayContent(msg)}
                                </p>
                            </div>
                            <span className={`text-[10px] mt-1 px-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {isMe ? 'You' : msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className={`p-4 border-t ${isDarkMode ? 'bg-slate-900 border-white/10' : 'bg-gray-100 border-gray-300'}`}>
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={`Message in ${language}...`}
                        className={`flex-1 bg-transparent border-none focus:ring-0 text-sm ${isDarkMode ? 'text-white placeholder-slate-400' : 'text-slate-900 placeholder-slate-500'}`}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="p-2 bg-cyan-500 text-white rounded-full hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-cyan-500/20"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WorkspaceChat;
