// Cloudflare Auth Module
// Handles all authentication with the Hono backend

import {
    authApi,
    getStoredToken,
    getStoredUser,
    clearStoredToken,
} from './api/cloudflare-api';

// Check if API is configured
const apiUrl = import.meta.env.VITE_API_URL;
export const isCloudflareConfigured = Boolean(apiUrl);

if (!isCloudflareConfigured) {
    console.warn('Cloudflare API URL missing. Cloud storage will not work.');
}

// Auth state change listeners
type AuthStateListener = (user: { id: string; email: string } | null) => void;
const authListeners: Set<AuthStateListener> = new Set();

// Notify all listeners of auth state change
const notifyAuthListeners = (user: { id: string; email: string } | null) => {
    authListeners.forEach(listener => listener(user));
};

// Subscribe to auth state changes
export const onAuthStateChange = (callback: AuthStateListener) => {
    authListeners.add(callback);
    
    // Immediately call with current state
    const currentUser = getStoredUser();
    callback(currentUser);
    
    // Return unsubscribe function
    return () => {
        authListeners.delete(callback);
    };
};

// Get current session/user
export const getSession = async () => {
    const token = getStoredToken();
    const user = getStoredUser();
    
    if (!token || !user) {
        return { session: null, user: null };
    }
    
    // Optionally verify token with server
    try {
        await authApi.getCurrentUser();
        return { session: { token }, user };
    } catch (error) {
        // Token is invalid, clear it
        clearStoredToken();
        notifyAuthListeners(null);
        return { session: null, user: null };
    }
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
    if (!isCloudflareConfigured) {
        throw new Error("Cloudflare API is not configured in this environment.");
    }
    
    const response = await authApi.login(email, password);
    
    if (response.success && response.data?.user) {
        notifyAuthListeners(response.data.user);
    }
    
    return response;
};

// Register new user
export const registerWithEmail = async (email: string, password: string) => {
    if (!isCloudflareConfigured) {
        throw new Error("Cloudflare API is not configured in this environment.");
    }
    
    const response = await authApi.register(email, password);
    
    if (response.success && response.data?.user) {
        notifyAuthListeners(response.data.user);
    }
    
    return response;
};

// Sign out
export const signOut = async () => {
    try {
        await authApi.logout();
    } finally {
        notifyAuthListeners(null);
    }
};

// Check if user is authenticated
export const isAuthenticated = () => {
    return authApi.isAuthenticated();
};

/**
 * Verify the stored session token with the server.
 * Called during app init to ensure token is still valid BEFORE auth listeners fire.
 * - Token valid → do nothing (onAuthStateChange will pick up user from localStorage)
 * - Token invalid → clear stored auth so onAuthStateChange fires with null
 * - Network error → keep token (offline mode, trust cached session)
 */
export const verifySession = async (): Promise<void> => {
    const token = getStoredToken();
    if (!token) return;

    if (!isCloudflareConfigured) return;

    try {
        const response = await authApi.getCurrentUser();
        if (!response.success) {
            // Server explicitly rejects the token
            console.warn('verifySession: Token rejected by server, clearing stored auth.');
            clearStoredToken();
            // Don't notifyAuthListeners here — onAuthStateChange in core.ts 
            // will read null from getStoredUser() on its own
        }
    } catch (error: any) {
        // Distinguish network error from auth error
        if (error?.message?.includes('Unauthorized') || error?.message?.includes('401')) {
            console.warn('verifySession: Token expired/invalid (401), clearing stored auth.');
            clearStoredToken();
        } else {
            // Network error — keep token, assume offline
            console.warn('verifySession: Network error, proceeding with cached session.');
        }
    }
};

// Get current user
export const getCurrentUser = () => {
    return getStoredUser();
};
