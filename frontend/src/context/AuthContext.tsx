import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

interface User {
    _id: string;
    email: string;
    fname: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, pass: string) => Promise<string | null>;
    signup: (fname: string, lname: string, dob: string, email: string, pass: string) => Promise<string | null>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Check if user is logged in on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/auth/verify`, { withCredentials: true });
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
    }, []);

    const login = async (email: string, pass: string) => {
        try {
            const res = await axios.post(`${API_BASE_URL}/auth/signin`, { email, pass }, { withCredentials: true });
            if (res.data.status === "Login successful") {
                setUser(res.data.user);
                return null; // No error
            } else {
                return res.data; // Return error message
            }
        } catch (error) {
            console.error("Login error", error);
            return "Login failed. Please try again.";
        }
    };

    const signup = async (fname: string, lname: string, dob: string, email: string, pass: string) => {
        try {
            const res = await axios.post(`${API_BASE_URL}/auth/signup`, { fname, lname, dob, email, pass }, { withCredentials: true });
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
            await axios.post(`${API_BASE_URL}/auth/logout`, {}, { withCredentials: true });
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
