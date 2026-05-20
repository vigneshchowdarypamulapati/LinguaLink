import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { Send, Volume2, MessageSquare, Trash2, Mic, MicOff } from 'lucide-react';

interface Message {
    id: string;
    sender: 'A' | 'B';
    original: string;
    translated: string;
    timestamp: Date;
}

// Language code mapping for TTS/STT
const langCodeMap: { [key: string]: string } = {
    'English': 'en-US', 'Spanish': 'es-ES', 'French': 'fr-FR', 'German': 'de-DE',
    'Italian': 'it-IT', 'Portuguese': 'pt-PT', 'Russian': 'ru-RU', 'Japanese': 'ja-JP',
    'Chinese': 'zh-CN', 'Hindi': 'hi-IN', 'Arabic': 'ar-SA', 'Korean': 'ko-KR',
    'Turkish': 'tr-TR', 'Vietnamese': 'vi-VN', 'Thai': 'th-TH'
};

const ChatMode: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputA, setInputA] = useState('');
    const [inputB, setInputB] = useState('');
    const [langA, setLangA] = useState('English');
    const [langB, setLangB] = useState('Spanish');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecordingA, setIsRecordingA] = useState(false);
    const [isRecordingB, setIsRecordingB] = useState(false);
    const scrollContainerA = useRef<HTMLDivElement>(null);
    const scrollContainerB = useRef<HTMLDivElement>(null);

    const languages = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian', 'Japanese', 'Chinese', 'Hindi', 'Arabic', 'Korean', 'Turkish', 'Vietnamese', 'Thai'];

    const scrollToBottom = () => {
        if (scrollContainerA.current) {
            scrollContainerA.current.scrollTop = scrollContainerA.current.scrollHeight;
        }
        if (scrollContainerB.current) {
            scrollContainerB.current.scrollTop = scrollContainerB.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
        const t1 = setTimeout(scrollToBottom, 50);
        const t2 = setTimeout(scrollToBottom, 150);
        const t3 = setTimeout(scrollToBottom, 300);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, [messages]);

    useEffect(() => {
        const loadMessages = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/bilingual-chat`, { withCredentials: true });
                const loadedMessages = res.data.map((msg: any) => ({
                    id: msg._id, sender: msg.sender, original: msg.original,
                    translated: msg.translated, timestamp: new Date(msg.createdAt)
                }));
                setMessages(loadedMessages);
            } catch (error) { console.error("Failed to load chat history:", error); }
        };
        loadMessages();
    }, []);

    const handleSendMessage = async (sender: 'A' | 'B', text: string) => {
        if (!text.trim()) return;
        setIsLoading(true);
        const sourceLang = sender === 'A' ? langA : langB;
        const targetLang = sender === 'A' ? langB : langA;

        try {
            const res = await axios.post(`${API_BASE_URL}/api/translate`, { text, sourceLang, targetLang });
            const translatedText = res.data.translated;

            const saveRes = await axios.post(`${API_BASE_URL}/api/bilingual-chat`, {
                sender, original: text, translated: translatedText, sourceLang, targetLang
            }, { withCredentials: true });

            const newMessage: Message = {
                id: saveRes.data._id || Date.now().toString(),
                sender, original: text, translated: translatedText, timestamp: new Date(),
            };
            setMessages(prev => [...prev, newMessage]);

            if (sender === 'A') setInputA(''); else setInputB('');
            // Auto-play TTS disabled per user preference
            // playTTS(translatedText, targetLang);
        } catch (error) { console.error("Chat error:", error); }
        finally { setIsLoading(false); }
    };

    const handleClearChat = async () => {
        if (!confirm('Are you sure you want to clear all chat messages?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/bilingual-chat`, { withCredentials: true });
            setMessages([]);
        } catch (error) { console.error("Failed to clear chat:", error); }
    };

    // Browser-based Text-to-Speech
    const playTTS = (text: string, lang?: string) => {
        if (!text) return;
        const synth = window.speechSynthesis;
        synth.cancel(); // Stop any current speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langCodeMap[lang || 'English'] || 'en-US';
        utterance.rate = 0.9;
        synth.speak(utterance);
    };

    // Speech-to-Text using browser's native Web Speech API (most reliable)
    const recognitionRef = useRef<any>(null);

    const toggleRecording = (sender: 'A' | 'B') => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
            return;
        }

        const isRecording = sender === 'A' ? isRecordingA : isRecordingB;
        const setIsRecording = sender === 'A' ? setIsRecordingA : setIsRecordingB;
        const setInput = sender === 'A' ? setInputA : setInputB;
        const lang = sender === 'A' ? langA : langB;

        if (isRecording) {
            // Stop recognition
            recognitionRef.current?.stop();
            setIsRecording(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = langCodeMap[lang] || 'en-US';

        let finalTranscript = '';

        recognition.onstart = () => {
            setIsRecording(true);
            finalTranscript = '';
        };

        recognition.onresult = (event: any) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }
            // Update input with both final and interim results for real-time feedback
            setInput((finalTranscript + interimTranscript).trim());
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsRecording(false);
            if (event.error === 'not-allowed') {
                alert('Microphone access denied. Please allow microphone permissions.');
            }
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        recognition.start();
    };

    return (
        <div className="h-screen p-4 md:p-6 relative flex flex-col bg-slate-900 overflow-hidden">
            <header className="text-center space-y-2 mb-4 flex-none">
                <div className="flex items-center justify-center gap-4">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight drop-shadow-lg flex items-center">
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

            <div className="flex-1 min-h-0 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">

                {/* Person A Side */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl flex flex-col overflow-hidden border-t-4 border-t-cyan-500 shadow-xl h-full">
                    <div className="p-3 bg-black/20 border-b border-white/10 flex justify-between items-center flex-none">
                        <span className="font-bold text-cyan-400">Person A</span>
                        <select
                            className="text-sm font-bold text-white bg-transparent border-none focus:ring-0 cursor-pointer hover:text-cyan-400 [&>option]:bg-slate-900 [&>option]:text-white"
                            value={langA}
                            onChange={(e) => setLangA(e.target.value)}
                        >
                            {languages.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>

                    <div
                        ref={scrollContainerA}
                        className="flex-1 p-4 overflow-y-auto space-y-4 bg-black/20"
                    >
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex flex-col ${msg.sender === 'A' ? 'items-end' : 'items-start opacity-75'}`}>
                                <div className={`${msg.sender === 'A' ? 'bg-cyan-600/80 rounded-tr-none' : 'bg-slate-700/50 rounded-tl-none border border-white/5'} p-3 rounded-2xl max-w-[90%]`}>
                                    <p className={`${msg.sender === 'A' ? 'text-white' : 'text-slate-200'} font-medium`}>
                                        {msg.sender === 'A' ? msg.original : msg.translated}
                                    </p>
                                </div>
                                {msg.sender === 'A' ? (
                                    <div className="text-xs text-slate-400 mt-1 flex items-center">
                                        <span className="mr-2 italic">{msg.translated}</span>
                                        <Volume2 size={12} className="cursor-pointer hover:text-cyan-400" onClick={() => playTTS(msg.translated)} />
                                    </div>
                                ) : (
                                    <div className="text-xs text-slate-500 mt-1">
                                        Received ({langA})
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="p-3 bg-white/5 border-t border-white/10 flex-none">
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
                                onClick={() => toggleRecording('A')}
                                className={`p-2 rounded-full text-white transition-colors ${isRecordingA ? 'bg-red-500 animate-pulse' : 'bg-slate-600 hover:bg-slate-500'}`}
                                title={isRecordingA ? 'Stop recording' : 'Start recording'}
                            >
                                {isRecordingA ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>
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
                <div className="bg-slate-800 border border-slate-700 rounded-2xl flex flex-col overflow-hidden border-t-4 border-t-purple-500 shadow-xl h-full">
                    <div className="p-3 bg-black/20 border-b border-white/10 flex justify-between items-center flex-none">
                        <span className="font-bold text-purple-400">Person B</span>
                        <select
                            className="text-sm font-bold text-white bg-transparent border-none focus:ring-0 cursor-pointer hover:text-purple-400 [&>option]:bg-slate-900 [&>option]:text-white"
                            value={langB}
                            onChange={(e) => setLangB(e.target.value)}
                        >
                            {languages.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>

                    <div
                        ref={scrollContainerB}
                        className="flex-1 p-4 overflow-y-auto space-y-4 bg-black/20"
                    >
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex flex-col ${msg.sender === 'B' ? 'items-end' : 'items-start opacity-75'}`}>
                                <div className={`${msg.sender === 'B' ? 'bg-purple-600/80 rounded-tr-none' : 'bg-slate-700/50 rounded-tl-none border border-white/5'} p-3 rounded-2xl max-w-[90%]`}>
                                    <p className={`${msg.sender === 'B' ? 'text-white' : 'text-slate-200'} font-medium`}>
                                        {msg.sender === 'B' ? msg.original : msg.translated}
                                    </p>
                                </div>
                                {msg.sender === 'B' ? (
                                    <div className="text-xs text-slate-400 mt-1 flex items-center">
                                        <span className="mr-2 italic">{msg.translated}</span>
                                        <Volume2 size={12} className="cursor-pointer hover:text-purple-400" onClick={() => playTTS(msg.translated)} />
                                    </div>
                                ) : (
                                    <div className="text-xs text-slate-500 mt-1">
                                        Received ({langB})
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="p-3 bg-white/5 border-t border-white/10 flex-none">
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
                                onClick={() => toggleRecording('B')}
                                className={`p-2 rounded-full text-white transition-colors ${isRecordingB ? 'bg-red-500 animate-pulse' : 'bg-slate-600 hover:bg-slate-500'}`}
                                title={isRecordingB ? 'Stop recording' : 'Start recording'}
                            >
                                {isRecordingB ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>
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
