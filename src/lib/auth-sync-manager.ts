/**
 * Auth Sync Manager
 * 
 * Modul terpusat untuk mengelola sinkronisasi antara:
 * 1. Auth state (login/logout)
 * 2. Storage provider (Local/Supabase)
 * 3. Data cache hydration
 * 
 * Ini memastikan tidak ada race condition saat login/logout
 */

// --- Types ---
export interface User {
    id: string;
    email?: string;
    [key: string]: any; // Allow other properties if present
}

export type AuthSyncState = 'idle' | 'syncing' | 'ready' | 'error';

export interface AuthSyncStatus {
    state: AuthSyncState;
    user: User | null;
    isAuthenticated: boolean;
    isCloudMode: boolean;
    error: Error | null;
}

type AuthSyncListener = (status: AuthSyncStatus) => void;

// --- Internal State ---
let currentState: AuthSyncState = 'idle';
let currentUser: User | null = null;
let currentError: Error | null = null;
let isCloudMode = false;

// Promise yang bisa di-await untuk menunggu sync selesai
let syncPromise: Promise<void> | null = null;
let syncResolve: (() => void) | null = null;

// Listeners untuk UI updates
const listeners = new Set<AuthSyncListener>();

// --- Helper Functions ---
const getStatus = (): AuthSyncStatus => ({
    state: currentState,
    user: currentUser,
    isAuthenticated: currentUser !== null,
    isCloudMode,
    error: currentError,
});

const notifyListeners = () => {
    const status = getStatus();
    listeners.forEach(listener => {
        try {
            listener(status);
        } catch (e) {
            console.error('Auth sync listener error:', e);
        }
    });
};

// --- Public API ---

/**
 * Subscribe ke perubahan auth sync status
 * @returns Unsubscribe function
 */
export const subscribeToAuthSync = (listener: AuthSyncListener): (() => void) => {
    listeners.add(listener);
    // Immediately notify with current state
    listener(getStatus());
    return () => listeners.delete(listener);
};

/**
 * Get current auth sync status
 */
export const getAuthSyncStatus = (): AuthSyncStatus => getStatus();

/**
 * Mulai proses sync (dipanggil saat auth state berubah)
 * Returns a promise yang resolve ketika sync selesai
 */
export const startAuthSync = (user: User | null, isCloud: boolean): Promise<void> => {
    // Jika sudah ada sync yang berjalan, return promise yang sama
    if (syncPromise && currentState === 'syncing') {
        console.log('AuthSync: Sync already in progress, waiting...');
        return syncPromise;
    }

    currentState = 'syncing';
    currentUser = user;
    isCloudMode = isCloud;
    currentError = null;

    console.log(`AuthSync: Starting sync (user: ${user?.email || 'guest'}, cloud: ${isCloud})`);
    notifyListeners();

    // Create new sync promise
    syncPromise = new Promise<void>((resolve) => {
        syncResolve = resolve;
    });

    return syncPromise;
};

/**
 * Mark sync as complete (dipanggil setelah hydrateCache selesai)
 */
export const completeAuthSync = (error?: Error) => {
    if (error) {
        currentState = 'error';
        currentError = error;
        console.error('AuthSync: Sync failed:', error);
    } else {
        currentState = 'ready';
        currentError = null;
        console.log('AuthSync: Sync completed successfully');
    }

    notifyListeners();

    // Resolve the pending promise
    if (syncResolve) {
        syncResolve();
        syncResolve = null;
        syncPromise = null;
    }
};

/**
 * Wait for any ongoing sync to complete
 * Useful for components that need to wait before accessing data
 */
export const waitForAuthSync = async (): Promise<AuthSyncStatus> => {
    if (syncPromise) {
        await syncPromise;
    }
    return getStatus();
};

/**
 * Check if sync is in progress
 */
export const isSyncing = (): boolean => currentState === 'syncing';

/**
 * Check if sync is ready (completed at least once)
 */
export const isReady = (): boolean => currentState === 'ready';

/**
 * Reset state (for testing or logout cleanup)
 */
export const resetAuthSync = () => {
    currentState = 'idle';
    currentUser = null;
    currentError = null;
    isCloudMode = false;
    syncPromise = null;
    syncResolve = null;
    notifyListeners();
};
