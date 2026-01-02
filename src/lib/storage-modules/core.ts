import { PriorityTask, Reflection, Note, RoutineItem, ActivityLog } from '../types';
import { IStorageProvider } from '../storage-interface';
import { LocalStorageProvider } from '../providers/local-storage-provider';
import { SupabaseProvider } from '../providers/supabase-provider';
import { supabase } from '../supabase';
import { cleanupImages } from '../idb';
import { STORAGE_KEYS } from '../constants';
import { toast } from 'sonner';

// --- Error Handling Helper ---
// Provides user feedback when save operations fail
export const handleSaveError = (error: any, context: string, retryFn?: () => void) => {
    console.error(`Save error (${context}):`, error);

    const message = error?.message || 'Gagal menyimpan data';

    if (retryFn) {
        toast.error(`${message}`, {
            description: context,
            action: {
                label: 'Coba Lagi',
                onClick: retryFn
            },
            duration: 5000
        });
    } else {
        toast.error(`${message}`, {
            description: context,
            duration: 4000
        });
    }
};

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
    const previousProvider = provider;

    if (isInitial || identityChanged) {
        currentUserId = newUserId;

        // Clear offline queue before switching providers (prevent stale data sync)
        if (previousProvider instanceof SupabaseProvider && !session) {
            // Switching from cloud to local - clear any pending offline queue
            try {
                localStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
                console.log('Storage: Cleared offline queue on logout');
            } catch (e) {
                console.warn('Failed to clear offline queue:', e);
            }
        }

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

            // Also clear sync tokens for previous user to ensure fresh sync
            if (currentUserId) {
                ['priorities', 'reflections', 'notes', 'routines', 'logs'].forEach(table => {
                    const oldKey = `sync_token_${previousProvider instanceof SupabaseProvider ? session?.user?.id : 'local'}_${table}`;
                    localStorage.removeItem(oldKey);
                });
            }
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

        // 3. GC Images (Guest Mode Optimization)
        try {
            const usedIds: string[] = [];

            // From Reflections
            cache.reflections?.forEach(r => {
                if (r.imageIds) usedIds.push(...r.imageIds);
            });

            // From Logs
            cache.logs?.forEach(l => {
                if (l.type === 'photo' && l.mediaId && !l.mediaId.startsWith('http')) {
                    usedIds.push(l.mediaId);
                }
            });

            await cleanupImages(usedIds);
        } catch (err) {
            console.warn("Storage: Image GC skipped or failed:", err);
        }
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
            notifyListeners(); // Notify UI that data is ready
        } finally {
            pendingHydrations.all = null;
        }
    })();

    return pendingHydrations.all;
};

// --- Sync Token Management ---
const getSyncToken = (table: string): string | undefined => {
    // Only use sync tokens for SupabaseProvider
    if (!(provider instanceof SupabaseProvider)) return undefined;

    // Per-user sync tokens to avoid data leaks across logouts
    const key = `sync_token_${currentUserId}_${table}`;
    return localStorage.getItem(key) || undefined;
};

const setSyncToken = (table: string, timestamp: string) => {
    if (!(provider instanceof SupabaseProvider)) return;

    // Subtract 1 second buffer to avoid missing concurrent updates
    // This handles edge case where two items update at exact same millisecond
    try {
        const date = new Date(timestamp);
        date.setSeconds(date.getSeconds() - 1);
        const bufferedTimestamp = date.toISOString();

        const key = `sync_token_${currentUserId}_${table}`;
        localStorage.setItem(key, bufferedTimestamp);
    } catch (e) {
        // Fallback to original timestamp if parsing fails
        const key = `sync_token_${currentUserId}_${table}`;
        localStorage.setItem(key, timestamp);
    }
};

// Generic Merge Logic
function mergeData<T extends { id: string, updatedAt?: string, deletedAt?: string | null }>(
    current: T[] | null,
    incoming: T[]
): T[] {
    const existingMap = new Map((current || []).map(item => [item.id, item]));

    for (const item of incoming) {
        if (item.deletedAt) {
            existingMap.delete(item.id);
        } else {
            existingMap.set(item.id, item);
        }
    }

    return Array.from(existingMap.values());
}

export async function hydrateTable(table: keyof typeof cache, force = false): Promise<any> {
    // If cache populated and valid, return it (unless forced)
    if (cache[table] !== null && !force && !pendingHydrations[table]) {
        // We could implement a TTL here if we wanted auto-refresh
        return cache[table];
    }

    if (pendingHydrations[table]) return pendingHydrations[table];

    pendingHydrations[table] = (async () => {
        try {
            const lastSync = force ? undefined : getSyncToken(table);

            let incoming: any[] = [];
            switch (table) {
                case 'priorities': incoming = await provider.getPriorities(lastSync); break;
                case 'reflections': incoming = await provider.getReflections(lastSync); break;
                case 'notes': incoming = await provider.getNotes(lastSync); break;
                case 'routines': incoming = await provider.getRoutines(lastSync); break;
                case 'logs': incoming = await provider.getLogs(lastSync); break;
            }

            // If we are in Cloud mode, strictly merge.
            // If Local mode, usually it returns full list, so replacing is fine.
            // BUT, if we want to be safe, standard merge works for full lists too (overwrites old).

            // Optimization: If local cache is null (first load), just set it.
            if (cache[table] === null) {
                // Filter deleted items for initial load just in case provider returned them
                cache[table] = incoming.filter((i: any) => !i.deletedAt);
            } else {
                // Merge incremental updates
                cache[table] = mergeData(cache[table], incoming);
            }

            // Update Sync Token (Use server time if possible, or max updated_at from received data?)
            // Safest is to use "Now" from before the request started? Or the latest updated_at?
            // If we use Max updated_at, we risk missing items in same second.
            // Using "Now()" is simple.
            if (provider instanceof SupabaseProvider && incoming.length > 0) {
                // Find the latest timestamp in the incoming batch to be safe
                // But wait, if we got 0 items, token stays same.
                // Ideally get server time but client time is OK-ish if consistent.
                const maxTime = incoming.reduce((max: string, curr: any) => {
                    return !max || (curr.updatedAt && curr.updatedAt > max) ? curr.updatedAt : max;
                }, lastSync);

                if (maxTime) setSyncToken(table, maxTime);
            }

            return cache[table];
        } finally {
            pendingHydrations[table] = null;
        }
    })();
    return pendingHydrations[table];
}
