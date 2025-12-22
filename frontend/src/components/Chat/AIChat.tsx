
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { Send, Bot, User, Plus, MessageSquare, Menu, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const AIChat: React.FC = () => {
    const { isDarkMode } = useTheme();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const contextMessages = [...messages, userMsg].slice(-10);
            const res = await axios.post(`${API_BASE_URL}/api/ai-chat`, {
                messages: contextMessages
            });

            const aiMsg: Message = { role: 'assistant', content: res.data.reply };
            setMessages(prev => [...prev, aiMsg]);

        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const startNewChat = () => {
        setMessages([]);
    };

    const suggestions = [
        "Explain quantum computing",
        "Write a poem about rain",
        "Debug this React code",
        "Translate 'Hello' to French"
    ];

    return (
        <div className={`flex h-full overflow-hidden pt-16 md:pt-0 relative ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>

            {/* Sidebar (History) */}
            <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 flex-shrink-0 bg-black/90 md:relative absolute z-20 h-full border-r border-white/10 overflow-hidden`}>
                <div className="p-4 flex flex-col h-full w-64">
                    <button
                        onClick={startNewChat}
                        className="flex items-center gap-2 w-full p-3 rounded-md border border-white/20 hover:bg-white/10 text-white transition-colors text-sm mb-4"
                    >
                        <Plus size={16} />
                        New chat
                    </button>

                    <div className="flex-1 overflow-y-auto">
                        <div className="text-xs font-semibold text-slate-500 mb-2 px-2">Today</div>
                        <button className="flex items-center gap-3 w-full p-3 rounded-md hover:bg-white/10 text-slate-300 text-sm text-left truncate">
                            <MessageSquare size={16} />
                            Translation Help
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative h-full">

                {/* Mobile Sidebar Toggle */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={`absolute top-4 left-4 z-10 p-2 rounded-md ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {/* Messages */}
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto scroll-smooth p-4">
                    <div className="max-w-3xl mx-auto pt-8 pb-32">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-8 animate-fade-in">
                                <div className={`p-6 rounded-full ${isDarkMode ? 'bg-slate-800' : 'bg-white'} shadow-xl mb-4`}>
                                    <Bot size={64} className="text-cyan-500" />
                                </div>
                                <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                                    How can I help you today?
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl px-4">
                                    {suggestions.map((suggestion, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => { setInput(suggestion); handleSend(); }}
                                            className={`p-4 rounded-xl text-left transition-all hover:scale-105 ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-white hover:bg-gray-50 text-slate-700'} shadow-sm border border-transparent hover:border-cyan-500/30`}
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex gap-4 mb-6 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-slide-up`}>
                                        {/* Avatar */}
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md ${msg.role === 'assistant' ? 'bg-gradient-to-br from-cyan-500 to-blue-600' : 'bg-gradient-to-br from-purple-500 to-pink-600'}`}>
                                            {msg.role === 'assistant' ? <Bot size={20} className="text-white" /> : <User size={20} className="text-white" />}
                                        </div>

                                        {/* Bubble */}
                                        <div className={`max-w-[80%] p-4 shadow-md ${msg.role === 'user'
                                            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-2xl rounded-tr-none'
                                            : `${isDarkMode ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-800'} rounded-2xl rounded-tl-none border ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`
                                            }`}>
                                            <p className="whitespace-pre-wrap leading-relaxed text-base">
                                                {msg.content}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex gap-4 mb-6 animate-pulse">
                                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md">
                                            <Bot size={20} className="text-white" />
                                        </div>
                                        <div className={`p-4 rounded-2xl rounded-tl-none ${isDarkMode ? 'bg-slate-800' : 'bg-white'} shadow-md`}>
                                            <div className="flex gap-1.5">
                                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>
                </div>

                {/* Floating Input Area */}
                <div className={`absolute bottom-0 left-0 w-full p-4 pt-12 bg-gradient-to-t ${isDarkMode ? 'from-slate-900 via-slate-900 to-transparent' : 'from-white via-white to-transparent'}`}>
                    <div className="max-w-3xl mx-auto">
                        <div className={`relative flex items-center rounded-2xl shadow-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} transition-all focus-within:ring-2 focus-within:ring-cyan-500/50`}>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder="Message AI Assistant..."
                                className={`flex-1 p-4 bg-transparent border-none focus:ring-0 text-lg ${isDarkMode ? 'text-white placeholder-slate-400' : 'text-slate-900 placeholder-slate-400'}`}
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className={`p-3 mr-2 rounded-xl transition-all ${!input.trim() ? 'text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg hover:shadow-cyan-500/30 hover:scale-105 active:scale-95'}`}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                        <p className="text-center text-xs text-slate-500 mt-2">
                            AI can make mistakes. Consider checking important information.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIChat;
