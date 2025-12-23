// API Configuration
// In production, uses Cloud Run backend. In development, uses localhost.

const isDevelopment = import.meta.env.DEV;

// Backend URL - always use full URL (Vite proxy was unreliable)
export const API_BASE_URL = isDevelopment
    ? 'http://localhost:8000'  // Direct backend URL for development
    : 'https://lingualink-backend-863204678576.us-central1.run.app';

export const SOCKET_URL = isDevelopment
    ? 'http://localhost:8000'
    : 'https://lingualink-backend-863204678576.us-central1.run.app';