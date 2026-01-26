// Cloudflare Auth Module
// Replaces supabase.ts for authentication

import { Capacitor } from '@capacitor/core';
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

// Get current user
export const getCurrentUser = () => {
    return getStoredUser();
};
