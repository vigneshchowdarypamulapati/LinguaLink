import React, { useState } from 'react';
import { Lock, Save, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

import { motion } from 'framer-motion';

const Settings: React.FC = () => {
    useAuth(); // Using hook for protection but ignoring return values for now if unused

    const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [loading, setLoading] = useState(false);

    // Profile State
    const [profileData, setProfileData] = useState({
        fname: '',
        lname: '',
        dob: ''
    });

    // Password State
    const [passData, setPassData] = useState({
        oldPass: '',
        newPass: '',
        confirmPass: ''
    });

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            const res = await axios.put(`${API_BASE_URL}/auth/profile`, profileData, { withCredentials: true });
            if (res.data.status === "Profile updated") {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                // Ideally update global user context here. For now, a refresh might be needed or we expose setUser
                // Let's assume for now the user sees the success message.
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update profile.' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passData.newPass !== passData.confirmPass) {
            setMessage({ type: 'error', text: 'New passwords do not match.' });
            return;
        }
        setLoading(true);
        setMessage(null);
        try {
            await axios.put(`${API_BASE_URL}/auth/password`, {
                oldPass: passData.oldPass,
                newPass: passData.newPass
            }, { withCredentials: true });
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setPassData({ oldPass: '', newPass: '', confirmPass: '' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update password.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 pt-20 md:pt-8 max-w-4xl mx-auto space-y-8 pb-24">
            <div className="flex items-center space-x-4 mb-8">
                <h1 className="text-3xl font-bold text-app-text">Settings</h1>
            </div>

            <div className="flex space-x-4 mb-6 border-b border-app-border">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'profile'
                        ? 'text-accent border-b-2 border-accent'
                        : 'text-app-text-muted hover:text-app-text'}`}
                >
                    Profile
                </button>
                <button
                    onClick={() => setActiveTab('password')}
                    className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'password'
                        ? 'text-accent border-b-2 border-accent'
                        : 'text-app-text-muted hover:text-app-text'}`}
                >
                    Password
                </button>
            </div>

            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg flex items-center ${message.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-error/10 text-error border border-error/20'}`}
                >
                    {message.type === 'success' ? <CheckCircle size={20} className="mr-2" /> : <AlertCircle size={20} className="mr-2" />}
                    {message.text}
                </motion.div>
            )}

            <div className="card p-6">
                {activeTab === 'profile' ? (
                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-app-text">First Name</label>
                                <input
                                    type="text"
                                    value={profileData.fname}
                                    onChange={(e) => setProfileData({ ...profileData, fname: e.target.value })}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-app-text">Last Name</label>
                                <input
                                    type="text"
                                    value={profileData.lname}
                                    onChange={(e) => setProfileData({ ...profileData, lname: e.target.value })}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-app-text">Date of Birth</label>
                                <input
                                    type="date"
                                    value={profileData.dob}
                                    onChange={(e) => setProfileData({ ...profileData, dob: e.target.value })}
                                    className="input-field"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary flex items-center justify-center w-auto inline-flex"
                        >
                            <Save size={18} className="mr-2" />
                            Save Changes
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handlePasswordUpdate} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-app-text">Current Password</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted" />
                                <input
                                    type="password"
                                    required
                                    value={passData.oldPass}
                                    onChange={(e) => setPassData({ ...passData, oldPass: e.target.value })}
                                    className="input-field pl-10"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-app-text">New Password</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted" />
                                <input
                                    type="password"
                                    required
                                    value={passData.newPass}
                                    onChange={(e) => setPassData({ ...passData, newPass: e.target.value })}
                                    className="input-field pl-10"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-app-text">Confirm New Password</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted" />
                                <input
                                    type="password"
                                    required
                                    value={passData.confirmPass}
                                    onChange={(e) => setPassData({ ...passData, confirmPass: e.target.value })}
                                    className="input-field pl-10"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary flex items-center justify-center w-auto inline-flex"
                        >
                            <Save size={18} className="mr-2" />
                            Update Password
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Settings;
