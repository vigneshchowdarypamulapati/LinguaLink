import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { Mic, Send, Copy, Check, Upload, Volume2, Square, Star, History as HistoryIcon, FileText, Type, Sparkles, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useTheme } from '../../context/ThemeContext';


interface HistoryItem {
    _id: string;
    original: string;
    translated: string;
    sourceLang: string;
    targetLang: string;
    isFavorite: boolean;
    createdAt: string;
}
const Translator: React.FC = () => {
    const [mode, setMode] = useState<'text' | 'document'>('text');
    const [inputText, setInputText] = useState('');
    const [targetLanguage, setTargetLanguage] = useState('Spanish');
    const [translatedText, setTranslatedText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [copied, setCopied] = useState(false);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const { user } = useAuth();
    const { currentWorkspace } = useWorkspace();
    const { isDarkMode } = useTheme();
    const userEmail = user?.email;
    const [fileName, setFileName] = useState<string | null>(null);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);
        setSelectedFile(file);
    };
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);



    const languages = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian', 'Japanese', 'Chinese', 'Hindi'];

    useEffect(() => {
        if (userEmail) {
            fetchHistory(userEmail);
        }
    }, [userEmail, currentWorkspace]);

    // Cleanup TTS on unmount
    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    useEffect(() => {
        if (inputText) {
            handleTranslate();
        }
    }, [targetLanguage]);

    const fetchHistory = async (email: string) => {
        try {
            let url = `${API_BASE_URL}/api/history?email=${email}`;
            if (currentWorkspace) {
                url = `${API_BASE_URL}/api/workspaces/${currentWorkspace._id}/history`;
            }
            const res = await axios.get(url, { withCredentials: true });
            setHistory(res.data);
        } catch (error) {
            console.error("Failed to fetch history", error);
        }
    };

    const toggleRecording = async () => {
        if (isRecording) {
            // Stop Recording
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        } else {
            // Start Recording
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorderRef.current = mediaRecorder;
                chunksRef.current = [];

                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        chunksRef.current.push(e.data);
                    }
                };

                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                    const file = new File([audioBlob], "recording.webm", { type: 'audio/webm' });

                    const formData = new FormData();
                    formData.append('audio', file);

                    setIsLoading(true);
                    try {
                        const res = await axios.post(`${API_BASE_URL}/api/transcribe`, formData, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                        });
                        setInputText(res.data.text);
                    } catch (error) {
                        console.error("Transcription error:", error);
                        alert("Failed to transcribe audio.");
                    } finally {
                        setIsLoading(false);
                        // Stop all tracks to release mic
                        stream.getTracks().forEach(track => track.stop());
                    }
                };

                mediaRecorder.start();
                setIsRecording(true);
            } catch (err) {
                console.error("Error accessing microphone:", err);
                alert("Could not access microphone.");
            }
        }
    };

    const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('audio', file);

        setIsLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/transcribe`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setInputText(res.data.text);
        } catch (error) {
            console.error("Transcription error:", error);
            alert("Failed to transcribe audio.");
        } finally {
            setIsLoading(false);
            e.target.value = '';
        }
    };



    const handleTranslate = async () => {
        if (mode === 'text' && !inputText) return;
        if (mode === 'document' && !selectedFile) return;

        setIsLoading(true);
        try {
            if (mode === 'document' && selectedFile) {
                const formData = new FormData();
                formData.append('document', selectedFile);
                formData.append('targetLanguage', targetLanguage);

                console.log('Sending document translation request...');
                const res = await axios.post(`${API_BASE_URL}/api/translate-doc`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                console.log('Document translation response:', res.data);

                // Check for error in response
                if (res.data.error) {
                    setTranslatedText(`Error: ${res.data.error}`);
                    return;
                }

                if (res.data.original) {
                    setInputText(res.data.original);
                    setMode('text'); // Switch to text mode to show extracted text
                }
                if (res.data.translated) {
                    setTranslatedText(res.data.translated);
                } else if (!res.data.original && !res.data.translated) {
                    setTranslatedText('Error: No translation received from server.');
                }

            } else {
                const res = await axios.post(`${API_BASE_URL}/api/translate`, {
                    text: inputText,
                    sourceLang: 'Auto',
                    targetLang: targetLanguage,
                    workspaceId: currentWorkspace?._id
                });
                const translation = res.data.translated;
                setTranslatedText(translation);

                // Save to history
                if (userEmail) {
                    await axios.post(`${API_BASE_URL}/api/history`, {
                        email: userEmail,
                        original: inputText,
                        translated: translation,
                        sourceLang: 'Auto',
                        targetLang: targetLanguage,
                        workspaceId: currentWorkspace?._id
                    });
                    fetchHistory(userEmail);
                }
            }
        } catch (error: any) {
            console.error("Translation error:", error);
            // Check if backend returned an error message
            const errorMessage = error.response?.data?.error || error.message || "Could not translate text.";
            setTranslatedText(`Error: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTTS = () => {
        if (!translatedText) return;

        const synth = window.speechSynthesis;
        if (isPlaying) {
            synth.cancel();
            setIsPlaying(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(translatedText);

        // Map language names to BCP 47 language tags
        const langMap: { [key: string]: string } = {
            'English': 'en-US',
            'Spanish': 'es-ES',
            'French': 'fr-FR',
            'German': 'de-DE',
            'Italian': 'it-IT',
            'Portuguese': 'pt-PT',
            'Russian': 'ru-RU',
            'Japanese': 'ja-JP',
            'Chinese': 'zh-CN',
            'Hindi': 'hi-IN'
        };

        utterance.lang = langMap[targetLanguage] || 'en-US';

        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);

        synth.speak(utterance);
    };

    const toggleFavorite = async (id: string) => {
        try {
            await axios.put(`${API_BASE_URL}/api/history/${id}/favorite`);
            if (userEmail) fetchHistory(userEmail);
        } catch (error) {
            console.error("Failed to toggle favorite", error);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(translatedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExplain = async () => {
        if (!translatedText) return;

        const original = mode === 'text' ? inputText : "Document content";

        setIsLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/ai-explain`, {
                original: original,
                translated: translatedText,
                sourceLang: 'Auto', // Or detect language
                targetLang: targetLanguage
            });
            alert(`✨ Smart Explanation:\n\n${res.data.explanation}`);
        } catch (error) {
            console.error("Explanation error:", error);
            alert("Could not fetch explanation.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col overflow-hidden p-4 md:p-6 pt-16 md:pt-4">
            <div className="max-w-7xl w-full mx-auto flex flex-col flex-1 overflow-hidden gap-3">
                <header className="text-center flex-shrink-0">
                    <h1 className={`text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>AI Translator</h1>
                    <p className={`text-base font-light ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>Break language barriers instantly</p>
                </header>

                {/* Mode Toggle */}
                <div className="flex justify-center space-x-4 flex-shrink-0 mb-4">
                    <button
                        onClick={() => setMode('text')}
                        className={`flex items-center px-6 py-2 rounded-full transition-all ${mode === 'text' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                        <Type size={18} className="mr-2" />
                        Text / Audio
                    </button>
                    <button
                        onClick={() => setMode('document')}
                        className={`flex items-center px-6 py-2 rounded-full transition-all ${mode === 'document' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                        <FileText size={18} className="mr-2" />
                        Document
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-[300px]">
                    {/* Input Section */}
                    <div className={`rounded-2xl p-4 relative group transition-all hover:border-cyan-400/30 hover:shadow-cyan-500/20 flex flex-col min-h-0 ${isDarkMode ? 'bg-slate-800/80 border border-white/10 backdrop-blur-xl' : 'glass'}`}>
                        <div className="flex justify-between items-center mb-4">
                            <span className={`text-sm font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                                {mode === 'text' ? 'Input' : 'Document Input'}
                            </span>
                            {mode === 'text' && (
                                <div className="flex space-x-2">
                                    <input
                                        type="file"
                                        accept="audio/*"
                                        className="hidden"
                                        id="audio-upload"
                                        onChange={handleAudioUpload}
                                    />
                                    <label
                                        htmlFor="audio-upload"
                                        className="p-2 text-slate-400 hover:text-cyan-400 transition-colors bg-white/5 rounded-full hover:bg-cyan-500/20 cursor-pointer"
                                        title="Upload Audio"
                                    >
                                        <Upload size={20} />
                                    </label>
                                    <button
                                        onClick={toggleRecording}
                                        className={`p-2 transition-colors bg-white/5 rounded-full hover:bg-cyan-500/20 ${isRecording ? 'text-red-500 animate-pulse bg-red-500/10' : 'text-slate-400 hover:text-cyan-400'}`}
                                        title={isRecording ? "Stop Recording" : "Start Recording"}
                                    >
                                        <Mic size={20} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {mode === 'text' ? (
                            <textarea
                                className={`w-full flex-1 p-4 text-lg bg-transparent border-none focus:ring-0 resize-none placeholder-slate-500 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                                placeholder={isRecording ? "Listening..." : "Enter text or upload audio..."}
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                            />
                        ) : (
                            <div className="w-full flex-1 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-cyan-500/50 hover:bg-white/5 transition-all cursor-pointer relative">
                                <input
                                    type="file"
                                    accept=".pdf,.txt"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleDocumentUpload}
                                />
                                {fileName ? (
                                    <>
                                        <FileText size={48} className="mb-4 text-cyan-400" />
                                        <p className="font-medium text-white">{fileName}</p>
                                        <p className="text-sm text-cyan-400 mt-2">Click to change file</p>
                                    </>
                                ) : (
                                    <>
                                        <Upload size={48} className="mb-4 text-slate-500" />
                                        <p className="font-medium">Click to upload PDF or TXT</p>
                                        <p className="text-sm text-slate-500 mt-2">Max 4000 characters</p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Output Section */}
                    <div className={`rounded-2xl p-4 relative group transition-all hover:border-cyan-400/30 hover:shadow-cyan-500/20 flex flex-col min-h-0 ${isDarkMode ? 'bg-slate-800/80 border border-white/10 backdrop-blur-xl' : 'glass'}`}>
                        <div className="flex justify-between items-center mb-4">
                            <select
                                className={`text-sm font-semibold bg-transparent border-none focus:ring-0 cursor-pointer hover:text-white transition-colors [&>option]:text-slate-900 ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}
                                value={targetLanguage}
                                onChange={(e) => setTargetLanguage(e.target.value)}
                            >
                                {languages.map((lang) => (
                                    <option key={lang} value={lang}>{lang}</option>
                                ))}
                            </select>
                            <div className="flex space-x-2">
                                <button
                                    onClick={handleExplain}
                                    className="p-2 text-yellow-400 hover:text-yellow-300 transition-colors bg-white/5 rounded-full hover:bg-yellow-500/20"
                                    disabled={!translatedText}
                                    title="Explain Translation"
                                >
                                    <Sparkles size={20} />
                                </button>
                                <button
                                    onClick={handleTTS}
                                    className={`p-2 rounded-full transition-colors ${isPlaying ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                                    title={isPlaying ? "Stop Speaking" : "Listen to Translation"}
                                >
                                    {isPlaying ? <Square size={20} fill="currentColor" /> : <Volume2 size={20} />}
                                </button>
                                <button
                                    onClick={copyToClipboard}
                                    className="p-2 text-slate-400 hover:text-cyan-400 transition-colors bg-white/5 rounded-full hover:bg-cyan-500/20"
                                    disabled={!translatedText}
                                    title="Copy"
                                >
                                    {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
                                </button>
                            </div>
                        </div>
                        <div className={`w-full flex-1 p-4 text-lg overflow-auto whitespace-pre-wrap ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full text-slate-400 animate-pulse">
                                    {mode === 'document' ? 'Processing Document...' : 'Translating...'}
                                </div>
                            ) : (
                                translatedText || <span className="text-slate-500 italic">Translation will appear here...</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-center pt-2 flex-shrink-0">
                    <button
                        onClick={handleTranslate}
                        disabled={isLoading || (mode === 'text' ? !inputText : !selectedFile)}
                        className="flex items-center px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-lg hover:shadow-cyan-500/50 hover:from-cyan-400 hover:to-blue-400 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        <Send size={20} className="mr-2" />
                        Translate Now
                    </button>
                </div>

                {/* History Section */}
                {
                    history.length > 0 && (
                        <div className="mt-12">
                            <div className="flex items-center mb-6">
                                <HistoryIcon className="text-cyan-400 mr-2" size={24} />
                                <h2 className="text-2xl font-bold text-white">History</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {history.map((item) => (
                                    <div
                                        key={item._id}
                                        onClick={() => setSelectedHistoryItem(item)}
                                        className="glass p-4 rounded-xl hover:bg-white/10 transition-colors group cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="text-xs text-slate-400 uppercase tracking-wider">
                                                {item.sourceLang} → {item.targetLang}
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleFavorite(item._id); }}
                                                className={`p-1 rounded-full transition-colors ${item.isFavorite ? 'text-yellow-400' : 'text-slate-600 group-hover:text-slate-400 hover:text-yellow-400'}`}
                                            >
                                                <Star size={16} fill={item.isFavorite ? "currentColor" : "none"} />
                                            </button>
                                        </div>
                                        <p className="text-slate-300 text-sm mb-1 line-clamp-2">{item.original}</p>
                                        <p className="text-white font-medium line-clamp-2">{item.translated}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }

                {/* History Item Popup Modal */}
                {
                    selectedHistoryItem && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedHistoryItem(null)}>
                            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-2xl w-full shadow-2xl relative flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                                <button
                                    onClick={() => setSelectedHistoryItem(null)}
                                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10"
                                >
                                    <X size={24} />
                                </button>

                                <div className="mb-6 flex-shrink-0">
                                    <div className="flex items-center space-x-2 text-sm text-cyan-400 font-semibold uppercase tracking-wider mb-2">
                                        <span>{selectedHistoryItem.sourceLang}</span>
                                        <span>→</span>
                                        <span>{selectedHistoryItem.targetLang}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white">Translation Details</h3>
                                </div>

                                <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Original</label>
                                        <div className="bg-white/5 rounded-xl p-4 text-slate-200 text-lg leading-relaxed whitespace-pre-wrap">
                                            {selectedHistoryItem.original}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Translation</label>
                                        <div className="bg-white/5 rounded-xl p-4 text-white text-lg leading-relaxed font-medium whitespace-pre-wrap">
                                            {selectedHistoryItem.translated}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-white/10 flex-shrink-0">
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(selectedHistoryItem.translated);
                                            alert("Translation copied!");
                                        }}
                                        className="flex items-center px-4 py-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors"
                                    >
                                        <Copy size={18} className="mr-2" />
                                        Copy Translation
                                    </button>
                                    <button
                                        onClick={() => {
                                            setInputText(selectedHistoryItem.original);
                                            setTargetLanguage(selectedHistoryItem.targetLang);
                                            setTranslatedText(selectedHistoryItem.translated);
                                            setSelectedHistoryItem(null);
                                        }}
                                        className="flex items-center px-4 py-2 rounded-lg bg-cyan-500 text-white hover:bg-cyan-400 transition-colors font-semibold"
                                    >
                                        <Check size={18} className="mr-2" />
                                        Use This
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >
        </div >
    );
};

export default Translator;
