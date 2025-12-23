import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../config/api';

interface Workspace {
    _id: string;
    name: string;
    owner: string;
    members: string[];
}

interface WorkspaceContextType {
    workspaces: Workspace[];
    currentWorkspace: Workspace | null;
    isLoading: boolean;
    createWorkspace: (name: string) => Promise<string>;
    switchWorkspace: (workspaceId: string) => void;
    inviteMember: (email: string) => Promise<string | null>;
    deleteWorkspace: (workspaceId: string) => Promise<void>;
    refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading: authLoading } = useAuth();
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (user) {
            refreshWorkspaces();
        } else {
            setWorkspaces([]);
            setCurrentWorkspace(null);
            setIsLoading(false);
        }
    }, [user, authLoading]);

    const refreshWorkspaces = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/workspaces`, { withCredentials: true });
            setWorkspaces(res.data);

            // Restore from localStorage or default to first
            const savedWorkspaceId = localStorage.getItem('currentWorkspaceId');

            if (savedWorkspaceId === 'personal') {
                setCurrentWorkspace(null);
            } else if (savedWorkspaceId) {
                const savedWorkspace = res.data.find((w: Workspace) => w._id === savedWorkspaceId);
                if (savedWorkspace) {
                    setCurrentWorkspace(savedWorkspace);
                } else if (res.data.length > 0 && !currentWorkspace) {
                    // If saved workspace not found (e.g. deleted), default to first? 
                    // Or maybe just keep null (personal). Let's keep null for now if not found.
                }
            } else if (res.data.length > 0 && !currentWorkspace) {
                // Optional: Auto-select first if nothing saved
                // For now, let's force Personal if nothing is saved to avoid confusion
                setCurrentWorkspace(null);
            } else {
                setCurrentWorkspace(null);
            }
        } catch (error) {
            console.error("Failed to fetch workspaces", error);
        } finally {
            setIsLoading(false);
        }
    };

    const createWorkspace = async (name: string): Promise<string> => {
        try {
            const res = await axios.post(`${API_BASE_URL}/api/workspaces`, { name }, { withCredentials: true });
            setWorkspaces([...workspaces, res.data]);
            setCurrentWorkspace(res.data); // Switch to new workspace
            localStorage.setItem('currentWorkspaceId', res.data._id);
            return res.data._id; // Return the new workspace ID
        } catch (error) {
            console.error("Failed to create workspace", error);
            throw error;
        }
    };

    const switchWorkspace = (workspaceId: string) => {
        if (workspaceId === 'personal') {
            setCurrentWorkspace(null);
            localStorage.setItem('currentWorkspaceId', 'personal');
        } else {
            const ws = workspaces.find(w => w._id === workspaceId);
            if (ws) {
                setCurrentWorkspace(ws);
                localStorage.setItem('currentWorkspaceId', workspaceId);
            }
        }
    };

    const inviteMember = async (email: string) => {
        if (!currentWorkspace) return "No workspace selected";
        try {
            await axios.post(`${API_BASE_URL}/api/workspaces/${currentWorkspace._id}/invite`, { email }, { withCredentials: true });
            return null; // Success
        } catch (error: any) {
            console.error("Failed to invite member", error);
            return error.response?.data || "Failed to invite member";
        }
    };

    const deleteWorkspace = async (workspaceId: string) => {
        try {
            await axios.delete(`${API_BASE_URL}/api/workspaces/${workspaceId}`, { withCredentials: true });
            setWorkspaces(workspaces.filter(w => w._id !== workspaceId));
            if (currentWorkspace?._id === workspaceId) {
                setCurrentWorkspace(null); // Switch to personal if current was deleted
            }
        } catch (error) {
            console.error("Failed to delete workspace", error);
            throw error;
        }
    };

    return (
        <WorkspaceContext.Provider value={{ workspaces, currentWorkspace, isLoading, createWorkspace, switchWorkspace, inviteMember, deleteWorkspace, refreshWorkspaces }}>
            {children}
        </WorkspaceContext.Provider>
    );
};

export const useWorkspace = () => {
    const context = useContext(WorkspaceContext);
    if (context === undefined) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider');
    }
    return context;
};
