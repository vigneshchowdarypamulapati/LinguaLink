import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { ThemeProvider } from './context/ThemeContext';
import Translator from './components/Translator/Translator';
import Dashboard from './components/Dashboard/Dashboard';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import Settings from './components/Settings/Settings';
import AIChat from './components/Chat/AIChat';
import ChatMode from './components/Chat/ChatMode';
import WorkspaceChat from './components/Workspace/WorkspaceChat';

// Simple Login component
const Login: React.FC = () => {
    const { login } = useAuth();
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(email, password);
        } catch (err) {
            setError('Invalid credentials');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-xl w-full max-w-md">
                <h1 className="text-3xl font-bold text-white text-center mb-8">LinguaLink</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <button
                        type="submit"
                        className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition"
                    >
                        Sign In
                    </button>
                </form>
                <p className="text-white/60 text-center mt-4">
                    <a href="/forgot-password" className="text-purple-400 hover:underline">Forgot password?</a>
                </p>
            </div>
        </div>
    );
};

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return user ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <AuthProvider>
                <WorkspaceProvider>
                    <BrowserRouter>
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/reset-password/:token" element={<ResetPassword />} />
                            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                            <Route path="/translator" element={<ProtectedRoute><Translator /></ProtectedRoute>} />
                            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                            <Route path="/chat" element={<ProtectedRoute><ChatMode /></ProtectedRoute>} />
                            <Route path="/ai-chat" element={<ProtectedRoute><AIChat /></ProtectedRoute>} />
                            <Route path="/workspace/:id" element={<ProtectedRoute><WorkspaceChat onClose={() => window.history.back()} /></ProtectedRoute>} />
                        </Routes>
                    </BrowserRouter>
                </WorkspaceProvider>
            </AuthProvider>
        </ThemeProvider>
    );
};

export default App;
