import { PriorityTask, Reflection, Note, RoutineItem, ActivityLog } from '../types';
import { IStorageProvider } from '../storage-interface';
import { LocalStorageProvider } from '../providers/local-storage-provider';
import { SupabaseProvider } from '../providers/supabase-provider';
import { supabase } from '../supabase';
import { STORAGE_KEYS } from '../constants';

// --- State Management ---
export let provider: IStorageProvider = new LocalStorageProvider();
export let currentUserId: string | null = null;

// In-memory cache
export const cache: {
    priorities: PriorityTask[] | null;
    reflections: Reflection[] | null;
    notes: Note[] | null;
    routines: RoutineItem[] | null;
    logs: ActivityLog[] | null;
} = {
    priorities: null,
    reflections: null,
    notes: null,
    routines: null,
    logs: null,
};

// Request Deduplication
export const pendingHydrations: Record<string, Promise<any> | null> = {
    all: null,
    priorities: null,
    reflections: null,
    notes: null,
    routines: null,
    logs: null,
};

// Event Listeners for cross-module communication
type Listener = () => void | Promise<void>;
const listeners: Set<Listener> = new Set();

export const registerListener = (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

export const notifyListeners = () => {
    listeners.forEach(l => l());
};


// Listen for auth changes to swap providers
supabase.auth.onAuthStateChange((event, session) => {
    const newUserId = session?.user?.id || null;
    const isInitial = event === 'INITIAL_SESSION';
    const identityChanged = newUserId !== currentUserId;

    if (isInitial || identityChanged) {
        currentUserId = newUserId;
        if (session) {
            provider = new SupabaseProvider();
            console.log(`Storage: Cloud Mode (${event}) - User: ${newUserId}`);
        } else {
            provider = new LocalStorageProvider();
            console.log(`Storage: Local Mode (${event})`);
        }

        // Clear cache if identity actually changed
        if (identityChanged) {
            Object.keys(cache).forEach(key => (cache[key as keyof typeof cache] = null));
        }

        hydrateCache();
    }
});

export const setStorageProvider = (newProvider: IStorageProvider) => {
    provider = newProvider;
    hydrateCache(true);
};

export const getIsCloudActive = () => provider instanceof SupabaseProvider;

// --- ID Generation ---
export const generateId = (prefix: string = 'id') => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

// --- Migration & Initialization ---

let initPromise: Promise<void> | null = null;

export const initializeStorage = () => {
    if (initPromise) return initPromise;

    initPromise = (async () => {
        // 1. Basic Migrations
        const oldReflections = localStorage.getItem(STORAGE_KEYS.REFLECTIONS);
        if (oldReflections) {
            try {
                const reflections: Reflection[] = JSON.parse(oldReflections);
                for (const r of reflections) await provider.saveReflection(r);
                localStorage.removeItem(STORAGE_KEYS.REFLECTIONS);
            } catch (e) { console.error(e); }
        }

        const oldLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
        if (oldLogs) {
            try {
                const logs: ActivityLog[] = JSON.parse(oldLogs);
                for (const l of logs) await provider.saveLog(l);
                localStorage.removeItem(STORAGE_KEYS.LOGS);
            } catch (e) { console.error(e); }
        }

        // 2. Initial Hydration
        await hydrateCache();
    })();

    return initPromise;
};

export const hydrateCache = async (force = false) => {
    if (pendingHydrations.all && !force) return pendingHydrations.all;

    pendingHydrations.all = (async () => {
        try {
            console.log("Storage: Hydrating cache...");
            await Promise.all([
                hydrateTable('priorities', force),
                hydrateTable('reflections', force),
                hydrateTable('notes', force),
                hydrateTable('routines', force),
                hydrateTable('logs', force),
            ]);
        } finally {
            pendingHydrations.all = null;
        }
    })();

    return pendingHydrations.all;
};

export async function hydrateTable(table: keyof typeof cache, force = false): Promise<any> {
    if (cache[table] !== null && !force) return cache[table];
    if (pendingHydrations[table]) return pendingHydrations[table];

    pendingHydrations[table] = (async () => {
        try {
            let data: any = [];
            switch (table) {
                case 'priorities': data = await provider.getPriorities(); break;
                case 'reflections': data = await provider.getReflections(); break;
                case 'notes': data = await provider.getNotes(); break;
                case 'routines': data = await provider.getRoutines(); break;
                case 'logs': data = await provider.getLogs(); break;
            }
            cache[table] = data as any;
            return data;
        } finally {
            pendingHydrations[table] = null;
        }
    })();
    return pendingHydrations[table];
}
