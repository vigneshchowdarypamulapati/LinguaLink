import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Languages, MessageSquare, Bot, LogOut, Settings, Sun, Moon, Globe, Home, Users, Menu, X, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useTheme } from '../../context/ThemeContext';

interface NavItem {
    title: string;
    icon: React.ReactNode;
    path: string;
    iconBg: string;
    iconColor: string;
}

const AppLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const { currentWorkspace, workspaces, switchWorkspace, createWorkspace, deleteWorkspace } = useWorkspace();
    const { isDarkMode, toggleTheme } = useTheme();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [creatingWorkspace, setCreatingWorkspace] = useState(false);

    const navItems: NavItem[] = [
        {
            title: "Dashboard",
            icon: <Home className="w-5 h-5" />,
            path: "/",
            iconBg: "bg-blue-100 dark:bg-blue-900/30",
            iconColor: "text-blue-600 dark:text-blue-400"
        },
        {
            title: "Translator",
            icon: <Languages className="w-5 h-5" />,
            path: "/translator",
            iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
            iconColor: "text-emerald-600 dark:text-emerald-400"
        },
        {
            title: "Bilingual Chat",
            icon: <MessageSquare className="w-5 h-5" />,
            path: "/chat",
            iconBg: "bg-purple-100 dark:bg-purple-900/30",
            iconColor: "text-purple-600 dark:text-purple-400"
        },
        {
            title: "AI Assistant",
            icon: <Bot className="w-5 h-5" />,
            path: "/ai-chat",
            iconBg: "bg-amber-100 dark:bg-amber-900/30",
            iconColor: "text-amber-600 dark:text-amber-400"
        },
        {
            title: "Settings",
            icon: <Settings className="w-5 h-5" />,
            path: "/settings",
            iconBg: "bg-slate-100 dark:bg-slate-800",
            iconColor: "text-slate-600 dark:text-slate-400"
        }
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleCreateWorkspace = async () => {
        if (!newWorkspaceName.trim()) return;
        setCreatingWorkspace(true);
        try {
            const workspaceId = await createWorkspace(newWorkspaceName.trim());
            setNewWorkspaceName('');
            setShowCreateModal(false);
            // Navigate to the new workspace
            navigate(`/workspace/${workspaceId}`);
        } catch (error) {
            console.error('Failed to create workspace:', error);
            alert('Failed to create workspace. Please try again.');
        } finally {
            setCreatingWorkspace(false);
        }
    };

    const isActive = (path: string) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <>
            <div className="flex min-h-screen bg-[var(--color-bg)]">
                {/* Sidebar */}
                <aside className={`fixed left-0 top-0 h-full bg-[var(--color-card)] border-r border-[var(--color-border)] transition-all duration-300 z-40 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
                    <div className="flex flex-col h-full">
                        {/* Logo and Toggle */}
                        <div className={`flex items-center p-4 border-b border-[var(--color-border)] ${sidebarOpen ? 'justify-between' : 'flex-col gap-2 justify-center'}`}>
                            <div
                                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => {
                                    switchWorkspace('personal');
                                    navigate('/');
                                }}
                            >
                                <div className="w-10 h-10 bg-gradient-to-br from-primary-800 to-accent-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <Globe className="w-6 h-6 text-white" />
                                </div>
                                {sidebarOpen && (
                                    <span className="text-lg font-bold text-[var(--color-text-primary)]">LinguaLink</span>
                                )}
                            </div>
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                {sidebarOpen ? <X className="w-5 h-5 text-[var(--color-text-secondary)]" /> : <Menu className="w-5 h-5 text-[var(--color-text-secondary)]" />}
                            </button>
                        </div>

                        {/* Workspace Selector */}
                        {sidebarOpen && (
                            <div className="px-3 py-3 border-b border-[var(--color-border)]">
                                <div className="relative">
                                    <button
                                        onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
                                        className="w-full flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg)] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                                                <Users className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-xs text-[var(--color-text-secondary)]">Workspace</p>
                                                <p className="font-medium text-sm text-[var(--color-text-primary)]">
                                                    {currentWorkspace?.name || 'Personal'}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-[var(--color-text-secondary)] transition-transform ${workspaceDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {workspaceDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg shadow-lg overflow-hidden z-50">
                                            <button
                                                onClick={() => {
                                                    switchWorkspace('personal');
                                                    setWorkspaceDropdownOpen(false);
                                                }}
                                                className={`w-full flex items-center gap-3 p-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${!currentWorkspace ? 'bg-accent-500/10' : ''}`}
                                            >
                                                <div className="w-8 h-8 bg-primary-800 dark:bg-accent-500 rounded-lg flex items-center justify-center">
                                                    <Home className="w-4 h-4 text-white" />
                                                </div>
                                                <span className="text-sm font-medium text-[var(--color-text-primary)]">Personal</span>
                                            </button>
                                            {workspaces.map((ws) => (
                                                <div
                                                    key={ws._id}
                                                    className={`flex items-center gap-3 p-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${currentWorkspace?._id === ws._id ? 'bg-accent-500/10' : ''}`}
                                                >
                                                    <button
                                                        onClick={() => {
                                                            switchWorkspace(ws._id);
                                                            setWorkspaceDropdownOpen(false);
                                                            navigate(`/workspace/${ws._id}`);
                                                        }}
                                                        className="flex-1 flex items-center gap-3"
                                                    >
                                                        <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                                                            <Users className="w-4 h-4 text-white" />
                                                        </div>
                                                        <span className="text-sm font-medium text-[var(--color-text-primary)]">{ws.name}</span>
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm(`Delete workspace "${ws.name}"? This action cannot be undone.`)) {
                                                                deleteWorkspace(ws._id);
                                                            }
                                                        }}
                                                        className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors"
                                                        title="Delete workspace"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            <div className="border-t border-[var(--color-border)]">
                                                <button
                                                    onClick={() => {
                                                        setWorkspaceDropdownOpen(false);
                                                        setShowCreateModal(true);
                                                    }}
                                                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-accent-500"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    <span className="text-sm font-medium">Create Workspace</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Navigation */}
                        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                            {navItems.map((item, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        // When clicking Dashboard, switch to Personal workspace
                                        if (item.path === '/') {
                                            switchWorkspace('personal');
                                        }
                                        navigate(item.path);
                                    }}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${isActive(item.path)
                                        ? 'bg-primary-800 dark:bg-accent-500 text-white shadow-lg'
                                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--color-text-secondary)]'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive(item.path) ? 'bg-white/20' : item.iconBg}`}>
                                        <span className={isActive(item.path) ? 'text-white' : item.iconColor}>
                                            {item.icon}
                                        </span>
                                    </div>
                                    {sidebarOpen && (
                                        <span className="font-medium">{item.title}</span>
                                    )}
                                </button>
                            ))}
                        </nav>

                        {/* Bottom section - User info & Controls */}
                        <div className="p-3 border-t border-[var(--color-border)] space-y-2">
                            {sidebarOpen && user && (
                                <div className="p-3 rounded-lg bg-[var(--color-bg)]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-primary-800 to-accent-500 rounded-full flex items-center justify-center">
                                            <span className="text-white font-bold">{user.fname?.charAt(0) || 'U'}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm text-[var(--color-text-primary)] truncate">{user.fname}</p>
                                            <p className="text-xs text-[var(--color-text-secondary)] truncate">{user.email}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className={`flex ${sidebarOpen ? 'gap-2' : 'flex-col gap-1'}`}>
                                <button
                                    onClick={toggleTheme}
                                    className={`p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center ${sidebarOpen ? 'flex-1' : 'w-full'}`}
                                    title="Toggle theme"
                                >
                                    {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-600" />}
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className={`p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center text-red-500 ${sidebarOpen ? 'flex-1' : 'w-full'}`}
                                    title="Sign out"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
                    <Outlet />
                </main>
            </div>

            {/* Create Workspace Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[var(--color-card)] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
                        <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">Create New Workspace</h3>
                        <input
                            type="text"
                            value={newWorkspaceName}
                            onChange={(e) => setNewWorkspaceName(e.target.value)}
                            placeholder="Enter workspace name..."
                            className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-accent-500 mb-4"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
                        />
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setNewWorkspaceName('');
                                }}
                                className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateWorkspace}
                                disabled={!newWorkspaceName.trim() || creatingWorkspace}
                                className="px-4 py-2 rounded-lg bg-accent-500 text-white font-medium hover:bg-accent-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {creatingWorkspace ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AppLayout;

