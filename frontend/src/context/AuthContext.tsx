import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// In development, call backend directly to avoid proxy issues
const getBackendUrl = () => {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        return 'http://localhost:8000';
    }
    return API_BASE_URL;
};

interface User {
    _id: string;
    email: string;
    fname: string;
    username?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, pass: string) => Promise<string | null>;
    signup: (fname: string, lname: string, username: string, dob: string, email: string, pass: string) => Promise<string | null>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const backendUrl = getBackendUrl();

    // Check if user is logged in on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await axios.get(`${backendUrl}/auth/verify`, { withCredentials: true });
                if (res.data.status) {
                    setUser(res.data.user);
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error("Auth check failed", error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, [backendUrl]);

    const login = async (email: string, pass: string) => {
        try {
            const res = await axios.post(`${backendUrl}/auth/signin`, { email, pass }, { withCredentials: true });
            if (res.data.status === "Login successful") {
                setUser(res.data.user);
                return null; // No error
            } else {
                // Ensure we always return a string
                if (typeof res.data === 'string') {
                    return res.data;
                } else if (res.data && res.data.message) {
                    return res.data.message;
                } else {
                    return "Login failed. Please check your credentials.";
                }
            }
        } catch (error) {
            console.error("Login error", error);
            return "Login failed. Please try again.";
        }
    };

    const signup = async (fname: string, lname: string, username: string, dob: string, email: string, pass: string) => {
        try {
            const res = await axios.post(`${backendUrl}/auth/signup`, { fname, lname, username, dob, email, pass }, { withCredentials: true });
            if (res.data.status === "Registration successful") {
                setUser(res.data.user);
                return null; // No error
            } else {
                return typeof res.data === 'string' ? res.data : res.data.message || "Registration failed";
            }
        } catch (error) {
            console.error("Signup error", error);
            return "Registration failed. Please try again.";
        }
    };

    const logout = async () => {
        try {
            await axios.post(`${backendUrl}/auth/logout`, {}, { withCredentials: true });
            setUser(null);
        } catch (error) {
            console.error("Logout error", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
