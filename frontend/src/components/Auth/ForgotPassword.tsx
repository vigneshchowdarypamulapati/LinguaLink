import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { motion } from 'framer-motion';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');
        try {
            // Call backend directly to bypass proxy issues
            const backendUrl = import.meta.env.DEV ? 'http://localhost:8000' : API_BASE_URL;
            const response = await axios.post(`${backendUrl}/auth/forgot-password`, { email });
            if (response.data.status === 'success') {
                setStatus('success');
                setMessage(response.data.message || 'Recovery email sent! Please check your inbox.');
            } else {
                setStatus('error');
                setMessage(response.data.message || 'Failed to send recovery email.');
            }
        } catch (error: any) {
            setStatus('error');
            setMessage(error.response?.data?.message || 'Failed to send recovery email.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md p-8 card border-app-border"
            >
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-app-text tracking-tight">Forgot Password?</h2>
                    <p className="mt-2 text-app-text-muted">Enter your email to receive a reset link</p>
                </div>

                {status === 'success' ? (
                    <div className="text-center space-y-6">
                        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle size={32} className="text-success" />
                        </div>
                        <p className="text-app-text">{message}</p>
                        <Link to="/login" className="inline-block text-accent hover:text-accent-foreground font-medium transition-colors">
                            Back to Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {status === 'error' && (
                            <div className="p-3 text-sm text-error bg-error/10 border border-error/20 rounded-lg flex items-center">
                                <AlertCircle size={16} className="mr-2" />
                                {message}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-app-text mb-1">Email address</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted" />
                                <input
                                    type="email"
                                    required
                                    className="input-field pl-12"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="btn-primary flex items-center justify-center"
                        >
                            {status === 'loading' ? 'Sending...' : (
                                <>
                                    Send Reset Link <ArrowRight size={18} className="ml-2" />
                                </>
                            )}
                        </button>
                        <div className="text-center">
                            <Link to="/login" className="text-sm text-app-text-muted hover:text-app-text transition-colors">
                                Back to Login
                            </Link>
                        </div>
                    </form>
                )}
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
