import { PriorityTask, Reflection, Note, NoteHistory, RoutineItem, ActivityLog, Habit, HabitLog } from '../types';
import { IStorageProvider } from '../storage-interface';
import { LocalStorageProvider } from '../providers/local-storage-provider';
import { SupabaseProvider } from '../providers/supabase-provider';
import { CloudflareD1Provider } from '../providers/cloudflare-d1-provider';
import { supabase, isSupabaseConfigured } from '../supabase';
import { onAuthStateChange as onCloudflareAuthChange, isCloudflareConfigured, getCurrentUser as getCloudflareUser } from '../cloudflare-auth';
import { cleanupImages } from '../idb';
import { STORAGE_KEYS } from '../constants';
import { toast } from 'sonner';
import { startAuthSync, completeAuthSync } from '../auth-sync-manager';

// Determine which backend to use based on configuration
// Priority: Cloudflare > Supabase > Local
const useCloudflareBackend = isCloudflareConfigured;
const useSupabaseBackend = !useCloudflareBackend && isSupabaseConfigured;

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
    noteHistories: NoteHistory[] | null;
    routines: RoutineItem[] | null;
    logs: ActivityLog[] | null;
    habits: Habit[] | null;
    habitLogs: HabitLog[] | null;
} = {
    priorities: null,
    reflections: null,
    notes: null,
    noteHistories: null,
    routines: null,
    logs: null,
    habits: null,
    habitLogs: null,
};

// Request Deduplication
export const pendingHydrations: Record<string, Promise<any> | null> = {
    all: null,
    priorities: null,
    reflections: null,
    notes: null,
    noteHistories: null,
    routines: null,
    logs: null,
    habits: null,
    habitLogs: null,
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


// Helper function to handle auth state changes
const handleAuthStateChange = (user: { id: string; email?: string } | null, isInitial: boolean = false) => {
    const newUserId = user?.id || null;
    const identityChanged = newUserId !== currentUserId;
    const previousProvider = provider;

    if (isInitial || identityChanged) {
        currentUserId = newUserId;

        // Clear offline queue before switching providers (prevent stale data sync)
        if ((previousProvider instanceof SupabaseProvider || previousProvider instanceof CloudflareD1Provider) && !user) {
            // Switching from cloud to local - clear any pending offline queue
            try {
                localStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
                console.log('Storage: Cleared offline queue on logout');
            } catch (e) {
                console.warn('Failed to clear offline queue:', e);
            }
        }

        const isCloud = !!user;
        if (user) {
            if (useCloudflareBackend) {
                provider = new CloudflareD1Provider();
                console.log(`Storage: Cloudflare D1 Mode - User: ${newUserId}`);
            } else {
                provider = new SupabaseProvider();
                console.log(`Storage: Supabase Mode - User: ${newUserId}`);
            }
        } else {
            provider = new LocalStorageProvider();
            console.log(`Storage: Local Mode`);
        }

        // Clear cache if identity actually changed
        if (identityChanged) {
            Object.keys(cache).forEach(key => (cache[key as keyof typeof cache] = null));

            // Also clear sync tokens for previous user to ensure fresh sync
            if (currentUserId) {
                ['priorities', 'reflections', 'notes', 'routines', 'logs'].forEach(table => {
                    const oldKey = `sync_token_${currentUserId}_${table}`;
                    localStorage.removeItem(oldKey);
                });
            }
        }

        // Start auth sync (notifies listeners that sync is in progress)
        startAuthSync(user ? { id: user.id, email: user.email } : null, isCloud);

        // Hydrate cache and mark sync complete when done
        (async () => {
            try {
                await hydrateCache();
                completeAuthSync();
            } catch (error) {
                console.error('Storage: Hydration failed during auth change:', error);
                completeAuthSync(error instanceof Error ? error : new Error(String(error)));
            }
        })();
    }
};

// Listen for auth changes based on backend configuration
if (useCloudflareBackend) {
    // Use Cloudflare auth
    onCloudflareAuthChange((user) => {
        handleAuthStateChange(user, false);
    });
    
    // Initial check for Cloudflare auth
    const cfUser = getCloudflareUser();
    if (cfUser) {
        handleAuthStateChange(cfUser, true);
    }
} else if (useSupabaseBackend) {
    // Use Supabase auth (original behavior)
    supabase.auth.onAuthStateChange((event, session) => {
        const user = session?.user ? { id: session.user.id, email: session.user.email } : null;
        const isInitial = event === 'INITIAL_SESSION';
        handleAuthStateChange(user, isInitial);
    });
}

export const setStorageProvider = (newProvider: IStorageProvider) => {
    provider = newProvider;
    hydrateCache(true);
};

export const getIsCloudActive = () => provider instanceof SupabaseProvider || provider instanceof CloudflareD1Provider;

// --- ID Generation ---
export const generateId = (prefix: string = 'id') => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

// --- Migration & Initialization ---

let initPromise: Promise<void> | null = null;

export const initializeStorage = () => {
    if (initPromise) return initPromise;

    initPromise = (async () => {
        // 1. Basic Migrations (localStorage -> IndexedDB)
        const migrationTasks = [
            { key: STORAGE_KEYS.PRIORITIES, table: 'priorities', save: (d: any) => provider.savePriorities(d) },
            { key: STORAGE_KEYS.REFLECTIONS, table: 'reflections', save: async (d: any) => { for (const r of d) await provider.saveReflection(r); } },
            { key: STORAGE_KEYS.NOTES, table: 'notes', save: (d: any) => provider.saveNotes(d) },
            { key: STORAGE_KEYS.ROUTINES, table: 'routines', save: (d: any) => provider.saveRoutines(d) },
            { key: STORAGE_KEYS.LOGS, table: 'logs', save: async (d: any) => { for (const l of d) await provider.saveLog(l); } },
            { key: STORAGE_KEYS.HABITS, table: 'habits', save: (d: any) => provider.saveHabits(d) },
            { key: STORAGE_KEYS.HABIT_LOGS, table: 'habitLogs', save: (d: any) => provider.saveHabitLogs(d) },
            { key: 'personal_notes_data', table: 'personal_notes', save: (d: any) => provider.savePersonalNotes(d) },
        ];

        for (const task of migrationTasks) {
            const oldData = localStorage.getItem(task.key);
            if (oldData) {
                try {
                    const data = JSON.parse(oldData);
                    await task.save(data);
                    localStorage.removeItem(task.key);
                    console.log(`Storage: Migrated ${task.table} to IndexedDB`);
                } catch (e) {
                    console.error(`Storage: Failed to migrate ${task.table}:`, e);
                }
            }
        }

        // 2. Initial Hydration
        await hydrateCache();

        // 3. Reset old priority completions (day boundary handling)
        try {
            const { resetOldCompletions } = await import('./priorities');
            await resetOldCompletions();
        } catch (err) {
            console.warn("Storage: Failed to reset old completions:", err);
        }

        // 4. GC Images (Guest Mode Optimization)
        try {
            // Safety: Only run GC if we have loaded the reference data
            if (!cache.reflections || !cache.logs) {
                console.warn("Storage: Skipping Image GC because cache is incomplete.");
            } else {
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
            }
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
                hydrateTable('noteHistories', force),
                hydrateTable('routines', force),
                hydrateTable('logs', force),
                hydrateTable('habits', force),
                hydrateTable('habitLogs', force),
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
    // Only use sync tokens for cloud providers
    if (!(provider instanceof SupabaseProvider) && !(provider instanceof CloudflareD1Provider)) return undefined;

    // Per-user sync tokens to avoid data leaks across logouts
    const key = `sync_token_${currentUserId}_${table}`;
    return localStorage.getItem(key) || undefined;
};

const setSyncToken = (table: string, timestamp: string) => {
    if (!(provider instanceof SupabaseProvider) && !(provider instanceof CloudflareD1Provider)) return;

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

// Generic Merge Logic with Conflict Resolution
function mergeData<T extends { id: string, updatedAt?: string, deletedAt?: string | null }>(
    current: T[] | null,
    incoming: T[]
): T[] {
    const existingMap = new Map((current || []).map(item => [item.id, item]));

    for (const item of incoming) {
        if (item.deletedAt) {
            existingMap.delete(item.id);
        } else {
            const existing = existingMap.get(item.id);
            // CONFLICT RESOLUTION: Only overwrite if incoming is newer
            // If timestamps are missing, overwrite by default (safe for initial load)
            if (!existing || !existing.updatedAt || !item.updatedAt || item.updatedAt > existing.updatedAt) {
                existingMap.set(item.id, item);
            }
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
                case 'noteHistories': incoming = await provider.getNoteHistories?.(lastSync) ?? []; break;
                case 'routines': incoming = await provider.getRoutines(lastSync); break;
                case 'logs': incoming = await provider.getLogs(lastSync); break;
                case 'habits': incoming = await provider.getHabits?.(lastSync) ?? []; break;
                case 'habitLogs': incoming = await provider.getHabitLogs?.(lastSync) ?? []; break;
            }

            // If we are in Cloud mode, strictly merge.
            // If Local mode, biasanya mengembalikan full list, jadi replace aman.
            // Tapi untuk amannya, kita gunakan mergeData.

            // Optimization: Jika cache lokal masih null (load pertama), langsung set.
            if (cache[table] === null) {
                // Filter data yang sudah di-delete (soft delete)
                cache[table] = incoming.filter((i: any) => !i.deletedAt);
            } else {
                // Gabungkan data update (incremental)
                cache[table] = mergeData(cache[table], incoming);
            }

            // Update Sync Token (Use server time if possible, or max updated_at from received data?)
            // Safest is to use "Now" from before the request started? Or the latest updated_at?
            // If we use Max updated_at, we risk missing items in same second.
            // Using "Now()" is simple.
            if ((provider instanceof SupabaseProvider || provider instanceof CloudflareD1Provider) && incoming.length > 0) {
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
