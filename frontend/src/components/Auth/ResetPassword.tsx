import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { motion } from 'framer-motion';

const ResetPassword: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPass !== confirmPass) {
            setStatus('error');
            setMessage('Passwords do not match');
            return;
        }

        setStatus('loading');
        setMessage('');
        try {
            // Call backend directly
            const backendUrl = import.meta.env.DEV ? 'http://localhost:8000' : API_BASE_URL;
            const response = await axios.post(`${backendUrl}/auth/reset-password`, { token, newPassword: newPass });
            if (response.data.status === 'success') {
                setStatus('success');
                setMessage('Password has been reset successfully!');
                setTimeout(() => navigate('/login'), 3000);
            } else {
                setStatus('error');
                setMessage(response.data.message || 'Failed to reset password.');
            }
        } catch (error: any) {
            setStatus('error');
            setMessage(error.response?.data?.message || 'Failed to reset password.');
        }
    };

    if (!token) {
        return (
            <div className="flex items-center justify-center min-h-screen p-4 bg-slate-50 dark:bg-slate-900">
                <div className="text-center text-slate-600 dark:text-slate-400">
                    <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
                    <h2 className="text-xl font-bold mb-2">Invalid Link</h2>
                    <p>Missing reset token. Please request a new link.</p>
                    <Link to="/forgot-password" className="mt-4 inline-block text-cyan-500 hover:text-cyan-600">
                        Go to Forgot Password
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-slate-50 dark:bg-slate-900">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700"
            >
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Reset Password</h2>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">Enter your new password below</p>
                </div>

                {status === 'success' ? (
                    <div className="text-center space-y-6">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle size={32} className="text-green-500" />
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">{message}</p>
                        <p className="text-sm text-slate-400">Redirecting to login...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {status === 'error' && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center">
                                <AlertCircle size={16} className="mr-2" />
                                {message}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                                    placeholder="••••••••"
                                    value={newPass}
                                    onChange={(e) => setNewPass(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm Password</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                                    placeholder="••••••••"
                                    value={confirmPass}
                                    onChange={(e) => setConfirmPass(e.target.value)}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold rounded-lg shadow-lg shadow-cyan-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {status === 'loading' ? 'Resetting...' : (
                                <>
                                    Reset Password <ArrowRight size={18} className="ml-2" />
                                </>
                            )}
                        </button>
                    </form>
                )}
            </motion.div>
        </div>
    );
};

export default ResetPassword;
