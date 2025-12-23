import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { Send, Volume2, MessageSquare, Trash2 } from 'lucide-react';

interface Message {
    id: string;
    sender: 'A' | 'B';
    original: string;
    translated: string;
    timestamp: Date;
}

const ChatMode: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputA, setInputA] = useState('');
    const [inputB, setInputB] = useState('');
    const [langA, setLangA] = useState('English');
    const [langB, setLangB] = useState('Spanish');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const languages = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian', 'Japanese', 'Chinese', 'Hindi'];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load chat history on mount
    useEffect(() => {
        const loadMessages = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/bilingual-chat`, { withCredentials: true });
                const loadedMessages = res.data.map((msg: any) => ({
                    id: msg._id,
                    sender: msg.sender,
                    original: msg.original,
                    translated: msg.translated,
                    timestamp: new Date(msg.createdAt)
                }));
                setMessages(loadedMessages);
            } catch (error) {
                console.error("Failed to load chat history:", error);
            }
        };
        loadMessages();
    }, []);

    const handleSendMessage = async (sender: 'A' | 'B', text: string) => {
        if (!text.trim()) return;

        setIsLoading(true);
        const sourceLang = sender === 'A' ? langA : langB;
        const targetLang = sender === 'A' ? langB : langA;

        try {
            // Translate
            const res = await axios.post(`${API_BASE_URL}/api/translate`, {
                text,
                sourceLang,
                targetLang,
            });
            const translatedText = res.data.translated;

            // Save to database
            const saveRes = await axios.post(`${API_BASE_URL}/api/bilingual-chat`, {
                sender,
                original: text,
                translated: translatedText,
                sourceLang,
                targetLang
            }, { withCredentials: true });

            // Add to messages
            const newMessage: Message = {
                id: saveRes.data._id || Date.now().toString(),
                sender,
                original: text,
                translated: translatedText,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, newMessage]);

            // Clear input
            if (sender === 'A') setInputA('');
            else setInputB('');

            // Auto-play TTS
            playTTS(translatedText);

        } catch (error) {
            console.error("Chat error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearChat = async () => {
        if (!confirm('Are you sure you want to clear all chat messages?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/bilingual-chat`, { withCredentials: true });
            setMessages([]);
        } catch (error) {
            console.error("Failed to clear chat:", error);
        }
    };

    const playTTS = async (text: string) => {
        try {
            const res = await axios.post(`${API_BASE_URL}/api/tts`, { text }, { responseType: 'blob' });
            const audioUrl = URL.createObjectURL(res.data);
            new Audio(audioUrl).play();
        } catch (error) {
            console.error("TTS error:", error);
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-8 relative flex flex-col bg-slate-900">


            <header className="text-center space-y-2 mb-8 pt-8 md:pt-0">
                <div className="flex items-center justify-center gap-4">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-lg flex items-center">
                        <MessageSquare className="mr-3 text-cyan-400" /> Conversation Mode
                    </h1>
                    {messages.length > 0 && (
                        <button
                            onClick={handleClearChat}
                            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors"
                            title="Clear chat history"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </header>

            <div className="flex-1 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 h-[calc(100vh-200px)]">

                {/* Person A Side */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl flex flex-col overflow-hidden border-t-4 border-t-cyan-500">
                    <div className="p-4 bg-black/20 border-b border-white/10 flex justify-between items-center">
                        <span className="font-bold text-cyan-400">Person A</span>
                        <select
                            className="text-sm font-bold text-white bg-transparent border-none focus:ring-0 cursor-pointer hover:text-cyan-400 [&>option]:bg-slate-900 [&>option]:text-white"
                            value={langA}
                            onChange={(e) => setLangA(e.target.value)}
                        >
                            {languages.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-black/20">
                        {messages.filter(m => m.sender === 'A').map(msg => (
                            <div key={msg.id} className="flex flex-col items-end">
                                <div className="bg-cyan-600/80 p-3 rounded-2xl rounded-tr-none max-w-[90%]">
                                    <p className="text-white font-medium">{msg.original}</p>
                                </div>
                                <div className="text-xs text-slate-400 mt-1 flex items-center">
                                    <span className="mr-2 italic">{msg.translated}</span>
                                    <Volume2 size={12} className="cursor-pointer hover:text-cyan-400" onClick={() => playTTS(msg.translated)} />
                                </div>
                            </div>
                        ))}
                        {messages.filter(m => m.sender === 'B').map(msg => (
                            <div key={msg.id} className="flex flex-col items-start opacity-75">
                                <div className="bg-slate-700/50 p-3 rounded-2xl rounded-tl-none max-w-[90%] border border-white/5">
                                    <p className="text-slate-200 font-medium">{msg.translated}</p>
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                    Received ({langA})
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 bg-white/5 border-t border-white/10">
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                className="flex-1 bg-black/50 border border-white/10 rounded-full px-4 py-2 text-white font-medium focus:outline-none focus:border-cyan-500 transition-colors"
                                placeholder={`Type in ${langA}...`}
                                value={inputA}
                                onChange={(e) => setInputA(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSendMessage('A', inputA);
                                    }
                                }}
                            />
                            <button
                                onClick={() => handleSendMessage('A', inputA)}
                                disabled={!inputA.trim() || isLoading}
                                className="p-2 bg-cyan-600 hover:bg-cyan-500 rounded-full text-white transition-colors disabled:opacity-50"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Person B Side */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl flex flex-col overflow-hidden border-t-4 border-t-purple-500">
                    <div className="p-4 bg-black/20 border-b border-white/10 flex justify-between items-center">
                        <span className="font-bold text-purple-400">Person B</span>
                        <select
                            className="text-sm font-bold text-white bg-transparent border-none focus:ring-0 cursor-pointer hover:text-purple-400 [&>option]:bg-slate-900 [&>option]:text-white"
                            value={langB}
                            onChange={(e) => setLangB(e.target.value)}
                        >
                            {languages.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-black/20">
                        {messages.filter(m => m.sender === 'B').map(msg => (
                            <div key={msg.id} className="flex flex-col items-end">
                                <div className="bg-purple-600/80 p-3 rounded-2xl rounded-tr-none max-w-[90%]">
                                    <p className="text-white font-medium">{msg.original}</p>
                                </div>
                                <div className="text-xs text-slate-400 mt-1 flex items-center">
                                    <span className="mr-2 italic">{msg.translated}</span>
                                    <Volume2 size={12} className="cursor-pointer hover:text-purple-400" onClick={() => playTTS(msg.translated)} />
                                </div>
                            </div>
                        ))}
                        {messages.filter(m => m.sender === 'A').map(msg => (
                            <div key={msg.id} className="flex flex-col items-start opacity-75">
                                <div className="bg-slate-700/50 p-3 rounded-2xl rounded-tl-none max-w-[90%] border border-white/5">
                                    <p className="text-slate-200 font-medium">{msg.translated}</p>
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                    Received ({langB})
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 bg-white/5 border-t border-white/10">
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                className="flex-1 bg-black/50 border border-white/10 rounded-full px-4 py-2 text-white font-medium focus:outline-none focus:border-purple-500 transition-colors"
                                placeholder={`Type in ${langB}...`}
                                value={inputB}
                                onChange={(e) => setInputB(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSendMessage('B', inputB);
                                    }
                                }}
                            />
                            <button
                                onClick={() => handleSendMessage('B', inputB)}
                                disabled={!inputB.trim() || isLoading}
                                className="p-2 bg-purple-600 hover:bg-purple-500 rounded-full text-white transition-colors disabled:opacity-50"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ChatMode;
