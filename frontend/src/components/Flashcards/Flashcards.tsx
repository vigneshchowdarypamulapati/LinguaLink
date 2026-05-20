import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, RotateCcw, Check, X, Sparkles, Trophy, ArrowRight, Star } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

interface Flashcard {
    _id: string;
    original: string;
    translated: string;
    sourceLang: string;
    targetLang: string;
    repetitionLevel: number;
}

interface Stats {
    totalCards: number;
    dueCards: number;
    masteredCards: number;
}

const Flashcards: React.FC = () => {
    const { user } = useAuth();
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<Stats>({ totalCards: 0, dueCards: 0, masteredCards: 0 });
    const [sessionComplete, setSessionComplete] = useState(false);
    const [knownCount, setKnownCount] = useState(0);

    useEffect(() => {
        fetchFlashcards();
        fetchStats();
    }, [user?.email]);

    const fetchFlashcards = async () => {
        if (!user?.email) return;
        setIsLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/flashcards?email=${user.email}`, { withCredentials: true });
            setFlashcards(res.data);
            setCurrentIndex(0);
            setSessionComplete(res.data.length === 0);
        } catch (err) {
            console.error("Failed to fetch flashcards:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async () => {
        if (!user?.email) return;
        try {
            const res = await axios.get(`${API_BASE_URL}/api/flashcards/stats?email=${user.email}`, { withCredentials: true });
            setStats(res.data);
        } catch (err) {
            console.error("Failed to fetch stats:", err);
        }
    };

    const handleReview = async (knew: boolean) => {
        const card = flashcards[currentIndex];
        if (!card) return;

        try {
            await axios.post(`${API_BASE_URL}/api/flashcards/${card._id}/review`, { knew }, { withCredentials: true });
            if (knew) setKnownCount(prev => prev + 1);
        } catch (err) {
            console.error("Failed to update flashcard:", err);
        }

        setIsFlipped(false);
        if (currentIndex < flashcards.length - 1) {
            setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
        } else {
            setSessionComplete(true);
            fetchStats();
        }
    };

    const resetSession = () => {
        setCurrentIndex(0);
        setKnownCount(0);
        setSessionComplete(false);
        setIsFlipped(false);
        fetchFlashcards();
    };

    const currentCard = flashcards[currentIndex];
    const progress = flashcards.length > 0 ? ((currentIndex + 1) / flashcards.length) * 100 : 0;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg)] p-6">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)] flex items-center justify-center gap-3">
                        <BookOpen className="text-accent-500" />
                        Flashcard Trainer
                    </h1>
                    <p className="text-[var(--color-text-secondary)] mt-2">
                        Practice your starred translations with spaced repetition
                    </p>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="card p-4 text-center">
                        <p className="text-2xl font-bold text-accent-500">{stats.dueCards}</p>
                        <p className="text-sm text-[var(--color-text-secondary)]">Due Today</p>
                    </div>
                    <div className="card p-4 text-center">
                        <p className="text-2xl font-bold text-purple-500">{stats.totalCards}</p>
                        <p className="text-sm text-[var(--color-text-secondary)]">Total Cards</p>
                    </div>
                    <div className="card p-4 text-center">
                        <p className="text-2xl font-bold text-emerald-500">{stats.masteredCards}</p>
                        <p className="text-sm text-[var(--color-text-secondary)]">Mastered</p>
                    </div>
                </div>

                {/* Main Content */}
                {sessionComplete ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="card p-12 text-center"
                    >
                        <Trophy className="w-20 h-20 text-amber-500 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                            {stats.dueCards === 0 ? "All caught up!" : "Session Complete!"}
                        </h2>
                        <p className="text-[var(--color-text-secondary)] mb-6">
                            {stats.dueCards === 0
                                ? "Star some translations to create flashcards!"
                                : `You knew ${knownCount} out of ${flashcards.length} cards`
                            }
                        </p>
                        {stats.dueCards > 0 && (
                            <button
                                onClick={resetSession}
                                className="btn-accent px-6 py-3 flex items-center gap-2 mx-auto"
                            >
                                <RotateCcw size={20} />
                                Practice Again
                            </button>
                        )}
                        {stats.totalCards === 0 && (
                            <div className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <Star className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                                <p className="text-sm text-[var(--color-text-secondary)]">
                                    Star (⭐) translations in the Translator to add them to your flashcard deck!
                                </p>
                            </div>
                        )}
                    </motion.div>
                ) : currentCard ? (
                    <>
                        {/* Progress Bar */}
                        <div className="mb-6">
                            <div className="flex justify-between text-sm text-[var(--color-text-secondary)] mb-2">
                                <span>Card {currentIndex + 1} of {flashcards.length}</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-accent-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                        </div>

                        {/* Flashcard */}
                        <div className="perspective-1000 mb-8">
                            <motion.div
                                className="relative w-full h-64 cursor-pointer"
                                onClick={() => setIsFlipped(!isFlipped)}
                                style={{ transformStyle: 'preserve-3d' }}
                                animate={{ rotateY: isFlipped ? 180 : 0 }}
                                transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
                            >
                                {/* Front */}
                                <div
                                    className="absolute inset-0 backface-hidden card p-8 flex flex-col items-center justify-center bg-gradient-to-br from-primary-800 to-accent-600 text-white rounded-2xl shadow-elevated"
                                    style={{ backfaceVisibility: 'hidden' }}
                                >
                                    <span className="text-xs uppercase tracking-wider opacity-70 mb-4">
                                        {currentCard.sourceLang}
                                    </span>
                                    <p className="text-2xl font-bold text-center leading-relaxed">
                                        {currentCard.original}
                                    </p>
                                    <span className="absolute bottom-4 text-sm opacity-60 flex items-center gap-2">
                                        Tap to flip <ArrowRight size={14} />
                                    </span>
                                </div>

                                {/* Back */}
                                <div
                                    className="absolute inset-0 backface-hidden card p-8 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-500 text-white rounded-2xl shadow-elevated"
                                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                                >
                                    <span className="text-xs uppercase tracking-wider opacity-70 mb-4">
                                        {currentCard.targetLang}
                                    </span>
                                    <p className="text-2xl font-bold text-center leading-relaxed">
                                        {currentCard.translated}
                                    </p>
                                    <div className="absolute bottom-4 flex items-center gap-2 text-sm opacity-60">
                                        <Sparkles size={14} />
                                        Level {currentCard.repetitionLevel}
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Action Buttons */}
                        <AnimatePresence>
                            {isFlipped && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="flex justify-center gap-6"
                                >
                                    <button
                                        onClick={() => handleReview(false)}
                                        className="flex items-center gap-2 px-8 py-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 font-semibold transition-all hover:scale-105"
                                    >
                                        <X size={24} />
                                        Don't Know
                                    </button>
                                    <button
                                        onClick={() => handleReview(true)}
                                        className="flex items-center gap-2 px-8 py-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 font-semibold transition-all hover:scale-105"
                                    >
                                        <Check size={24} />
                                        Know It!
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {!isFlipped && (
                            <p className="text-center text-[var(--color-text-secondary)] text-sm">
                                Click the card to reveal the answer
                            </p>
                        )}
                    </>
                ) : null}
            </div>
        </div>
    );
};

export default Flashcards;
