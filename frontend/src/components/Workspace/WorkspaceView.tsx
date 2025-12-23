import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Hash, Users, User, UserPlus, X } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useTheme } from '../../context/ThemeContext';
import WorkspaceChat from './WorkspaceChat';

interface Member {
    _id: string;
    email: string;
    fname: string;
}

const WorkspaceView: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const { workspaces, switchWorkspace, currentWorkspace } = useWorkspace();
    const { isDarkMode } = useTheme();
    const [members, setMembers] = useState<Member[]>([]);
    const [selectedDM, setSelectedDM] = useState<{ id: string; name: string } | null>(null);
    const [activeChannel, setActiveChannel] = useState('general');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteMessage, setInviteMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Switch to this workspace when component mounts
    useEffect(() => {
        if (id && workspaces.length > 0) {
            switchWorkspace(id);
        }
    }, [id, workspaces]);

    // Fetch workspace members
    useEffect(() => {
        const fetchMembers = async () => {
            if (!currentWorkspace) return;
            try {
                const res = await axios.get(`${API_BASE_URL}/api/workspaces/${currentWorkspace._id}/members`, { withCredentials: true });
                setMembers(res.data);
            } catch (error) {
                console.error('Failed to fetch members', error);
            }
        };
        fetchMembers();
    }, [currentWorkspace]);

    const handleBackToDashboard = () => {
        switchWorkspace('personal');
        navigate('/');
    };

    const handleSelectChannel = () => {
        setSelectedDM(null);
        setActiveChannel('general');
    };

    const handleSelectDM = (member: Member) => {
        setSelectedDM({ id: member._id, name: member.fname });
        setActiveChannel('');
    };

    const handleInviteMember = async () => {
        if (!inviteEmail.trim() || !currentWorkspace) return;
        setInviteLoading(true);
        setInviteMessage(null);
        try {
            const res = await axios.post(
                `${API_BASE_URL}/api/workspaces/${currentWorkspace._id}/invite`,
                { email: inviteEmail.trim() },
                { withCredentials: true }
            );
            setInviteMessage({ type: 'success', text: res.data.message || 'Invitation sent!' });
            setInviteEmail('');
            // Refresh members list
            const membersRes = await axios.get(`${API_BASE_URL}/api/workspaces/${currentWorkspace._id}/members`, { withCredentials: true });
            setMembers(membersRes.data);
        } catch (error: any) {
            setInviteMessage({ type: 'error', text: error.response?.data?.error || 'Failed to invite member' });
        } finally {
            setInviteLoading(false);
        }
    };

    if (!currentWorkspace) {
        return (
            <div className={`flex items-center justify-center h-screen ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent mx-auto mb-4"></div>
                    <p>Loading workspace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex h-screen w-full ${isDarkMode ? 'bg-slate-950' : 'bg-gray-100'}`}>
            {/* Left Sidebar */}
            <div className={`w-64 flex-shrink-0 flex flex-col border-r ${isDarkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-gray-200'}`}>
                {/* Back Button */}
                <button
                    onClick={handleBackToDashboard}
                    className={`flex items-center gap-2 p-4 text-sm transition-colors ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-gray-100'}`}
                >
                    <ArrowLeft size={16} />
                    Back to Dashboard
                </button>

                {/* Workspace Header */}
                <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                {currentWorkspace.name}
                            </h2>
                            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {members.length} member{members.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/10 text-cyan-400 hover:text-cyan-300' : 'hover:bg-gray-100 text-cyan-600 hover:text-cyan-700'}`}
                            title="Invite Member"
                        >
                            <UserPlus size={18} />
                        </button>
                    </div>
                </div>

                {/* Channels Section */}
                <div className="p-4">
                    <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        Channels
                    </h3>
                    <button
                        onClick={handleSelectChannel}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${activeChannel === 'general'
                            ? 'bg-cyan-500/10 text-cyan-500'
                            : isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-gray-100'
                            }`}
                    >
                        <Hash size={16} />
                        General Chat
                    </button>
                </div>

                {/* Direct Messages Section */}
                <div className="p-4 flex-1 overflow-y-auto">
                    <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        Direct Messages
                    </h3>
                    <div className="space-y-1">
                        {members
                            .filter(m => m._id !== user?._id)
                            .map(member => (
                                <button
                                    key={member._id}
                                    onClick={() => handleSelectDM(member)}
                                    className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${selectedDM?.id === member._id
                                        ? 'bg-cyan-500/10 text-cyan-500'
                                        : isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-gray-100'
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-gray-200 text-slate-700'}`}>
                                        {member.fname?.charAt(0).toUpperCase() || member.email?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="text-left">
                                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{member.fname || 'User'}</p>
                                        <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{member.email}</p>
                                    </div>
                                </button>
                            ))}
                        {members.filter(m => m._id !== user?._id).length === 0 && (
                            <p className={`text-sm px-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                No other members yet
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Side - Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <WorkspaceChat
                    onClose={() => navigate('/')}
                    recipientId={selectedDM?.id || null}
                    recipientName={selectedDM?.name || null}
                />
            </div>

            {/* Invite Member Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className={`rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                Invite Member
                            </h3>
                            <button
                                onClick={() => {
                                    setShowInviteModal(false);
                                    setInviteEmail('');
                                    setInviteMessage(null);
                                }}
                                className={`p-1 rounded-lg ${isDarkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-gray-100 text-slate-500'}`}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Enter the email address of the person you want to invite. If they don't have an account, one will be created for them.
                        </p>
                        <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="colleague@example.com"
                            className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-cyan-500 mb-4 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-slate-900 placeholder-slate-400'}`}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleInviteMember()}
                        />
                        {inviteMessage && (
                            <div className={`px-4 py-3 rounded-lg text-sm mb-4 ${inviteMessage.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                {inviteMessage.text}
                            </div>
                        )}
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowInviteModal(false);
                                    setInviteEmail('');
                                    setInviteMessage(null);
                                }}
                                className={`px-4 py-2 rounded-lg border transition-colors ${isDarkMode ? 'border-slate-600 text-slate-400 hover:bg-white/5' : 'border-gray-300 text-slate-600 hover:bg-gray-100'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleInviteMember}
                                disabled={!inviteEmail.trim() || inviteLoading}
                                className="px-4 py-2 rounded-lg bg-cyan-500 text-white font-medium hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {inviteLoading ? 'Sending...' : 'Send Invitation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkspaceView;
