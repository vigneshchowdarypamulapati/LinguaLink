import React from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Users, MessageSquare, Settings } from 'lucide-react';

const WorkspaceDashboard: React.FC = () => {
    const { currentWorkspace } = useWorkspace();

    if (!currentWorkspace) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white">{currentWorkspace.name}</h1>
                    <p className="text-white/60 mt-2">Workspace Dashboard</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Members Card */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                        <div className="flex items-center gap-3 mb-4">
                            <Users className="w-6 h-6 text-purple-400" />
                            <h3 className="text-lg font-semibold text-white">Members</h3>
                        </div>
                        <p className="text-3xl font-bold text-white">{currentWorkspace.members?.length || 0}</p>
                        <p className="text-white/60 text-sm mt-1">Active members</p>
                    </div>

                    {/* Messages Card */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                        <div className="flex items-center gap-3 mb-4">
                            <MessageSquare className="w-6 h-6 text-blue-400" />
                            <h3 className="text-lg font-semibold text-white">Chat</h3>
                        </div>
                        <p className="text-white/60">Real-time multilingual chat</p>
                    </div>

                    {/* Settings Card */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                        <div className="flex items-center gap-3 mb-4">
                            <Settings className="w-6 h-6 text-green-400" />
                            <h3 className="text-lg font-semibold text-white">Settings</h3>
                        </div>
                        <p className="text-white/60">Manage workspace settings</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkspaceDashboard;
