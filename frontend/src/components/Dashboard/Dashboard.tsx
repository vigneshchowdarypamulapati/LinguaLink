import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Languages, MessageSquare, Bot, ArrowRight, Clock, Star, LogOut, Settings, Sun, Moon, Globe } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useTheme } from '../../context/ThemeContext';
import { API_BASE_URL } from '../../config/api';


interface HistoryItem {
    _id: string;
    original: string;
    translated: string;
    sourceLang: string;
    targetLang: string;
    isFavorite: boolean;
    createdAt: string;
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const { currentWorkspace } = useWorkspace();
    const { isDarkMode, toggleTheme } = useTheme();
    const [recentHistory, setRecentHistory] = useState<HistoryItem[]>([]);

    const isNewUser = location.state?.isNewUser;

    // Fetch personal history (only when NOT in a workspace)
    useEffect(() => {
        if (!currentWorkspace && user?.email) {
            const fetchHistory = async () => {
                try {
                    const res = await axios.get(`${API_BASE_URL}/api/history?email=${user.email}`, { withCredentials: true });
                    if (Array.isArray(res.data)) {
                        setRecentHistory(res.data.slice(0, 3));
                    } else {
                        setRecentHistory([]);
                    }
                } catch (error) {
                    console.error("Failed to fetch history", error);
                }
            };
            fetchHistory();
        }
    }, [user, currentWorkspace]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const features = [
        {
            title: "Translator",
            description: "Translate text, documents, and audio instantly with AI-powered accuracy.",
            icon: Languages,
            path: "/translator",
            iconBg: "bg-cyan-100 dark:bg-cyan-900/30",
            iconColor: "text-cyan-600 dark:text-cyan-400"
        },
        {
            title: "Bilingual Chat",
            description: "Real-time conversation mode for seamless multilingual communication.",
            icon: MessageSquare,
            path: "/chat",
            iconBg: "bg-purple-100 dark:bg-purple-900/30",
            iconColor: "text-purple-600 dark:text-purple-400"
        },
        {
            title: "AI Assistant",
            description: "Chat with Gemini AI for translations, explanations, and language help.",
            icon: Bot,
            path: "/ai-chat",
            iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
            iconColor: "text-emerald-600 dark:text-emerald-400"
        }
    ];

    return (
        <div className="min-h-screen bg-[var(--color-bg)]">
            {/* Navigation Bar */}
            <nav className="sticky top-0 z-50 w-full border-b border-[var(--color-border)] bg-[var(--color-card)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-800 dark:bg-accent-500 rounded-xl flex items-center justify-center">
                                <Globe className="w-5 h-5 text-white dark:text-primary-900" />
                            </div>
                            <span className="text-xl font-bold text-[var(--color-text-primary)]">LinguaLink</span>
                        </div>

                        {/* Right side */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                aria-label="Toggle theme"
                            >
                                {isDarkMode ? (
                                    <Sun className="w-5 h-5 text-amber-500" />
                                ) : (
                                    <Moon className="w-5 h-5 text-slate-600" />
                                )}
                            </button>
                            <button
                                onClick={() => navigate('/settings')}
                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <Settings className="w-5 h-5 text-[var(--color-text-secondary)]" />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="space-y-8"
                >
                    {/* Welcome Section */}
                    <motion.div
                        variants={item}
                        className="relative overflow-hidden rounded-2xl p-8 md:p-12 bg-primary-800 dark:bg-slate-800 text-white shadow-lg"
                    >
                        <div className="relative z-10">
                            <h1 className="text-3xl md:text-4xl font-bold mb-3">
                                {isNewUser ? 'Welcome' : 'Welcome back'}, {user?.fname || 'there'}! {isNewUser ? '🎉' : '👋'}
                            </h1>
                            <p className="text-lg text-white/80 max-w-2xl">
                                Ready to break some language barriers today? Choose a tool below to get started.
                            </p>
                        </div>
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
                        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 rounded-full bg-accent-500/20 blur-3xl" />
                    </motion.div>

                    {/* Feature Cards */}
                    <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                onClick={() => navigate(feature.path)}
                                className="card p-6 cursor-pointer hover:shadow-elevated transition-all group"
                            >
                                <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${feature.iconBg}`}>
                                    <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                                </div>
                                <h3 className="text-xl font-semibold mb-2 text-[var(--color-text-primary)]">
                                    {feature.title}
                                </h3>
                                <p className="text-[var(--color-text-secondary)] mb-4 text-sm leading-relaxed">
                                    {feature.description}
                                </p>
                                <div className="flex items-center text-accent-500 font-medium text-sm group-hover:text-accent-600 transition-colors">
                                    Get started
                                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                                </div>
                            </div>
                        ))}
                    </motion.div>

                    {/* Recent Activity */}
                    <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Recent Translations */}
                        <div className="card p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold flex items-center text-[var(--color-text-primary)]">
                                    <Clock className="mr-2 w-5 h-5 text-accent-500" />
                                    Recent Translations
                                </h2>
                                <button
                                    onClick={() => navigate('/translator')}
                                    className="text-sm text-accent-500 hover:text-accent-600 font-medium"
                                >
                                    View all
                                </button>
                            </div>
                            {recentHistory.length > 0 ? (
                                <div className="space-y-4">
                                    {recentHistory.map((translation) => (
                                        <div
                                            key={translation._id}
                                            className="p-4 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]"
                                        >
                                            <p className="text-sm text-[var(--color-text-primary)] line-clamp-1 mb-1">
                                                {translation.original}
                                            </p>
                                            <p className="text-sm text-[var(--color-text-secondary)] line-clamp-1">
                                                → {translation.translated}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-xs text-[var(--color-text-secondary)]">
                                                    {translation.sourceLang} → {translation.targetLang}
                                                </span>
                                                {translation.isFavorite && (
                                                    <Star className="w-3 h-3 text-amber-500 fill-current" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Languages className="w-12 h-12 text-[var(--color-text-secondary)] mx-auto mb-3 opacity-50" />
                                    <p className="text-[var(--color-text-secondary)]">No translations yet</p>
                                    <button
                                        onClick={() => navigate('/translator')}
                                        className="mt-4 btn-accent text-sm px-4 py-2"
                                    >
                                        Start translating
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Quick Stats */}
                        <div className="card p-6">
                            <h2 className="text-lg font-semibold mb-6 text-[var(--color-text-primary)]">
                                Quick Stats
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]">
                                    <p className="text-2xl font-bold text-accent-500">{recentHistory.length}</p>
                                    <p className="text-sm text-[var(--color-text-secondary)]">Recent translations</p>
                                </div>
                                <div className="p-4 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]">
                                    <p className="text-2xl font-bold text-emerald-500">10+</p>
                                    <p className="text-sm text-[var(--color-text-secondary)]">Languages supported</p>
                                </div>
                                <div className="p-4 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]">
                                    <p className="text-2xl font-bold text-purple-500">AI</p>
                                    <p className="text-sm text-[var(--color-text-secondary)]">Powered by Gemini</p>
                                </div>
                                <div className="p-4 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]">
                                    <p className="text-2xl font-bold text-primary-800 dark:text-accent-400">∞</p>
                                    <p className="text-sm text-[var(--color-text-secondary)]">Possibilities</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </main>
        </div>
    );
};

export default Dashboard;
