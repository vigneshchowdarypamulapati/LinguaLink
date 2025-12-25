import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Translator from './components/Translator/Translator';
import DashboardContent from './components/Dashboard/DashboardContent';
import AppLayout from './components/Layout/AppLayout';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import Settings from './components/Settings/Settings';
import AIChat from './components/Chat/AIChat';
import ChatMode from './components/Chat/ChatMode';
import WorkspaceView from './components/Workspace/WorkspaceView';
import { Sun, Moon, Globe } from 'lucide-react';

// Theme Toggle Button Component
const ThemeToggle: React.FC = () => {
    const { isDarkMode, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="fixed top-4 right-4 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all z-50"
            aria-label="Toggle theme"
        >
            {isDarkMode ? (
                <Sun className="w-5 h-5 text-amber-500" />
            ) : (
                <Moon className="w-5 h-5 text-slate-600" />
            )}
        </button>
    );
};

// Professional Login Component
const Login: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const result = await login(email, password);
            if (result) {
                setError(result);
            } else {
                // Success - navigate to dashboard
                navigate('/');
            }
        } catch (err) {
            setError('Invalid credentials');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
            <ThemeToggle />

            {/* Header */}
            <nav className="w-full py-6 px-8 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary-800 dark:bg-accent-500 rounded-xl flex items-center justify-center">
                        <Globe className="w-5 h-5 text-white dark:text-primary-900" />
                    </div>
                    <span className="text-xl font-bold text-primary-800 dark:text-white">LinguaLink</span>
                </div>
            </nav>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    {/* Card */}
                    <div className="card p-8">
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                                Welcome back
                            </h1>
                            <p className="text-[var(--color-text-secondary)]">
                                Sign in to continue to LinguaLink
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                    Email address
                                </label>
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input"
                                    required
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-[var(--color-text-primary)]">
                                        Password
                                    </label>
                                    <Link
                                        to="/forgot-password"
                                        className="text-sm text-accent-500 hover:text-accent-600"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <input
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full btn-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Signing in...
                                    </span>
                                ) : (
                                    'Sign in'
                                )}
                            </button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
                            <p className="text-center text-sm text-[var(--color-text-secondary)]">
                                By signing in, you agree to our{' '}
                                <a href="/terms" className="text-accent-500 hover:underline">Terms of Service</a>
                                {' '}and{' '}
                                <a href="/privacy" className="text-accent-500 hover:underline">Privacy Policy</a>
                            </p>
                        </div>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-[var(--color-text-secondary)]">
                                Don't have an account?{' '}
                                <Link to="/signup" className="text-accent-500 hover:text-accent-600 font-medium">
                                    Sign up
                                </Link>
                            </p>
                        </div>
                    </div>

                    {/* Footer text */}
                    <p className="text-center text-sm text-[var(--color-text-secondary)] mt-8">
                        Trusted by teams worldwide for real-time translation
                    </p>
                </div>
            </div>
        </div>
    );
};

// Professional Signup Component
const Signup: React.FC = () => {
    const { signup } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = React.useState({
        fname: '',
        lname: '',
        username: '',
        dob: '',
        email: '',
        password: ''
    });
    const [error, setError] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const result = await signup(formData.fname, formData.lname, formData.username, formData.dob, formData.email, formData.password);
            if (result) {
                setError(result);
            } else {
                navigate('/', { state: { isNewUser: true } });
            }
        } catch (err) {
            setError('Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
            <ThemeToggle />

            {/* Header */}
            <nav className="w-full py-6 px-8 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary-800 dark:bg-accent-500 rounded-xl flex items-center justify-center">
                        <Globe className="w-5 h-5 text-white dark:text-primary-900" />
                    </div>
                    <span className="text-xl font-bold text-primary-800 dark:text-white">LinguaLink</span>
                </div>
                <Link
                    to="/login"
                    className="text-sm font-medium text-text-secondary hover:text-accent-500 transition-colors"
                >
                    Already have an account? <span className="text-accent-500">Sign in</span>
                </Link>
            </nav>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    {/* Card */}
                    <div className="card p-8">
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                                Create your account
                            </h1>
                            <p className="text-[var(--color-text-secondary)]">
                                Start breaking language barriers today
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                        First name
                                    </label>
                                    <input
                                        type="text"
                                        name="fname"
                                        placeholder="John"
                                        value={formData.fname}
                                        onChange={handleChange}
                                        className="input"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                        Last name
                                    </label>
                                    <input
                                        type="text"
                                        name="lname"
                                        placeholder="Doe"
                                        value={formData.lname}
                                        onChange={handleChange}
                                        className="input"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    placeholder="@johndoe"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="input"
                                    required
                                />
                                <p className="text-xs text-[var(--color-text-secondary)] mt-1">This will be your display name</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                    Date of birth
                                </label>
                                <input
                                    type="date"
                                    name="dob"
                                    value={formData.dob}
                                    onChange={handleChange}
                                    className="input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                    Email address
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Create a password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="input"
                                    required
                                    minLength={6}
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full btn-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Creating account...
                                    </span>
                                ) : (
                                    'Create account'
                                )}
                            </button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
                            <p className="text-center text-sm text-[var(--color-text-secondary)]">
                                By signing up, you agree to our{' '}
                                <a href="/terms" className="text-accent-500 hover:underline">Terms of Service</a>
                                {' '}and{' '}
                                <a href="/privacy" className="text-accent-500 hover:underline">Privacy Policy</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-accent-500 border-t-transparent"></div>
                    <p className="text-[var(--color-text-secondary)]">Loading...</p>
                </div>
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
                            {/* Public Routes */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<Signup />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/reset-password/:token" element={<ResetPassword />} />

                            {/* Protected Routes with Layout */}
                            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                                <Route path="/" element={<DashboardContent />} />
                                <Route path="/translator" element={<Translator />} />
                                <Route path="/settings" element={<Settings />} />
                                <Route path="/chat" element={<ChatMode />} />
                                <Route path="/ai-chat" element={<AIChat />} />
                            </Route>

                            {/* Workspace Route - Full screen, no app sidebar */}
                            <Route path="/workspace/:id" element={<ProtectedRoute><WorkspaceView /></ProtectedRoute>} />

                            {/* Catch-all: redirect unknown routes to login */}
                            <Route path="*" element={<Navigate to="/login" replace />} />
                        </Routes>
                    </BrowserRouter>
                </WorkspaceProvider>
            </AuthProvider>
        </ThemeProvider>
    );
};

export default App;

