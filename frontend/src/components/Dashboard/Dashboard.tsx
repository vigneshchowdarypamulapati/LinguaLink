import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Languages, MessageSquare, Bot, ArrowRight, Clock, Star } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
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

import WorkspaceDashboard from './WorkspaceDashboard';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { currentWorkspace } = useWorkspace();
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

    // If a workspace is active, show the Workspace Dashboard instead
    if (currentWorkspace) {
        return <WorkspaceDashboard />;
    }

    const features = [
        {
            title: "Translator",
            description: "Translate text, documents, and audio instantly.",
            icon: Languages,
            path: "/translator",
            color: "from-cyan-500 to-blue-500",
            bg: "bg-cyan-500/10",
            text: "text-cyan-500"
        },
        {
            title: "Bilingual Chat",
            description: "Real-time conversation mode for two people.",
            icon: MessageSquare,
            path: "/chat",
            color: "from-purple-500 to-pink-500",
            bg: "bg-purple-500/10",
            text: "text-purple-500"
        },
        {
            title: "AI Assistant",
            description: "Chat with Gemini AI for explanations and help.",
            icon: Bot,
            path: "/ai-chat",
            color: "from-emerald-500 to-teal-500",
            bg: "bg-emerald-500/10",
            text: "text-emerald-500"
        }
    ];

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="h-full overflow-y-auto p-4 md:p-8 pt-20 md:pt-8 pb-24 space-y-8 custom-scrollbar"
        >
            {/* Welcome Section */}
            <motion.div variants={item} className="relative overflow-hidden rounded-3xl p-8 md:p-12 shadow-xl bg-gradient-to-r from-primary to-secondary text-white">
                <div className="relative z-10">
                    <h1 className="text-3xl md:text-5xl font-bold mb-4 text-primary-foreground">
                        {isNewUser ? 'Welcome' : 'Welcome back'}, {user?.fname || 'Guest'}! {isNewUser ? '🎉' : '👋'}
                    </h1>
                    <p className="text-lg max-w-2xl text-primary-foreground/80">
                        Ready to break some language barriers today? Choose a tool below to get started.
                    </p>
                </div>
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                    <div
                        key={index}
                        onClick={() => navigate(feature.path)}
                        className="group p-6 rounded-2xl border border-app-border bg-app-surface transition-all cursor-pointer hover:shadow-lg hover:border-accent/20"
                    >
                        <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${feature.bg} ${feature.text}`}>
                            <feature.icon size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-app-text">{feature.title}</h3>
                        <p className="mb-4 text-app-text-muted">{feature.description}</p>
                        <div className="flex items-center font-medium text-primary group-hover:text-accent transition-colors">
                            Try now <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
                        </div>
                    </div>
                ))}
            </motion.div>

            {/* Recent Activity */}
            <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold flex items-center text-app-text">
                            <Clock className="mr-2 text-primary" size={20} />
                            Recent Translations
                        </h2>
                        <button onClick={() => navigate('/translator')} className="text-sm text-primary hover:text-accent font-medium">
                            View All
                        </button>
                    </div>

                    <div className="space-y-4">
                        {recentHistory.length > 0 ? (
                            recentHistory.map((item) => (
                                <div key={item._id} className="flex items-center p-3 rounded-xl transition-colors bg-app-bg hover:bg-app-surface/50">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center text-xs text-app-text-muted mb-1">
                                            <span className="uppercase">{item.sourceLang}</span>
                                            <ArrowRight size={12} className="mx-1" />
                                            <span className="uppercase">{item.targetLang}</span>
                                        </div>
                                        <p className="text-sm truncate text-app-text">{item.original}</p>
                                        <p className="text-app-text-muted text-sm truncate">{item.translated}</p>
                                    </div>
                                    {item.isFavorite && <Star size={16} className="text-warning ml-3 flex-shrink-0" fill="currentColor" />}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-app-text-muted">
                                No recent activity
                            </div>
                        )}
                    </div>
                </div>

                {/* Pro Tip / Info Card */}
                <div className="border rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden bg-gradient-to-br from-app-surface to-app-bg border-app-border shadow-sm">
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold mb-2 text-app-text">Did you know? 💡</h3>
                        <p className="mb-4 text-app-text-muted">
                            You can upload PDF documents directly to the Translator and get them translated instantly while keeping the formatting!
                        </p>
                        <button
                            onClick={() => navigate('/translator')}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-primary hover:bg-secondary text-primary-foreground shadow-lg shadow-primary/20"
                        >
                            Try Document Translation
                        </button>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl bg-primary/5" />
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Dashboard;
