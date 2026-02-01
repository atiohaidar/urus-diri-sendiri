import { PriorityTask, Reflection, Note, NoteHistory, RoutineItem, ActivityLog, Habit, HabitLog } from '../types';
import { IStorageProvider } from '../storage-interface';
import { LocalStorageProvider } from '../providers/local-storage-provider';
import { SupabaseProvider } from '../providers/supabase-provider';
import { CloudflareD1Provider } from '../providers/cloudflare-d1-provider';
import { supabase, isSupabaseConfigured } from '../supabase';
import { onAuthStateChange as onCloudflareAuthChange, isCloudflareConfigured, getCurrentUser as getCloudflareUser } from '../cloudflare-auth';
import { cleanupImages, clearAllData } from '../idb';
export { clearAllData };
import { STORAGE_KEYS } from '../constants';
import { toast } from 'sonner';
import { startAuthSync, completeAuthSync, setMigrationFlag } from '../auth-sync-manager';

// Determine which backend to use based on configuration
const useCloudflareBackend = isCloudflareConfigured;
const useSupabaseBackend = !useCloudflareBackend && isSupabaseConfigured;

// Helper for generating IDs
export const generateId = (prefix: string = 'id'): string => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// --- Error Handling Helper ---
export const handleSaveError = (error: any, context: string, retryFn?: () => void) => {
    console.error(`Save error (${context}):`, error);
    const message = error?.message || 'Gagal menyimpan data';
    if (retryFn) {
        toast.error(`${message}`, {
            description: context,
            action: { label: 'Coba Lagi', onClick: retryFn },
            duration: 5000
        });
    } else {
        toast.error(`${message}`, { description: context, duration: 4000 });
    }
};

// --- State Management ---
export let provider: IStorageProvider = new LocalStorageProvider();
export let currentUserId: string | null = null;

// Flag and logic to suppress automatic snapshot updates after a manual save
let suppressSnapshotUntil = 0;

export const suppressSnapshot = (durationMs: number = 5000) => {
    suppressSnapshotUntil = Date.now() + durationMs;
};

export const isSnapshotSuppressed = () => {
    return Date.now() < suppressSnapshotUntil;
};

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
    priorities: null, reflections: null, notes: null, noteHistories: null,
    routines: null, logs: null, habits: null, habitLogs: null,
};

// Request Deduplication
export const pendingHydrations: Record<string, Promise<any> | null> = {
    all: null, priorities: null, reflections: null, notes: null,
    noteHistories: null, routines: null, logs: null, habits: null, habitLogs: null,
};

// Cooldown for sync to avoid spamming network (per table)
const lastSyncTime: Record<string, number> = {};
const SYNC_COOLDOWN = 1000 * 60 * 2; // 2 minutes

// Event Listeners
type Listener = () => void | Promise<void>;
const listeners: Set<Listener> = new Set();
export const registerListener = (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};
export const notifyListeners = () => {
    listeners.forEach(l => l());
};


// --- Sync Token Management ---
const getSyncToken = (table: string): string | undefined => {
    if (!(provider instanceof SupabaseProvider) && !(provider instanceof CloudflareD1Provider)) return undefined;
    const key = `sync_token_${currentUserId}_${table}`;
    return localStorage.getItem(key) || undefined;
};

const setSyncToken = (table: string, timestamp: string) => {
    if (!(provider instanceof SupabaseProvider) && !(provider instanceof CloudflareD1Provider)) return;
    try {
        const date = new Date(timestamp);
        date.setSeconds(date.getSeconds() - 1);
        const bufferedTimestamp = date.toISOString();
        const key = `sync_token_${currentUserId}_${table}`;
        localStorage.setItem(key, bufferedTimestamp);
    } catch (e) {
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
            const existing = existingMap.get(item.id);
            if (!existing || !existing.updatedAt || !item.updatedAt || item.updatedAt > existing.updatedAt) {
                existingMap.set(item.id, item);
            }
        }
    }
    return Array.from(existingMap.values());
}

/**
 * Perform network sync for a specific table (if applicable)
 * This is the modular "On-Demand" sync part.
 */
export async function syncTable(table: keyof typeof cache, force = false): Promise<void> {
    // Only sync for cloud providers
    if (!(provider instanceof CloudflareD1Provider) && !(provider instanceof SupabaseProvider)) return;

    // Check cooldown unless forced
    const now = Date.now();
    if (!force && lastSyncTime[table] && (now - lastSyncTime[table] < SYNC_COOLDOWN)) {
        return;
    }

    try {
        const lastSync = getSyncToken(table);
        console.log(`Storage: On-Demand Sync for ${table}...`);

        let incoming: any[] = [];
        switch (table) {
            case 'priorities': incoming = await provider.getPriorities(lastSync); break;
            case 'reflections': incoming = await provider.getReflections(lastSync); break;
            case 'notes': incoming = await provider.getNotes(lastSync); break;
            case 'routines': incoming = await provider.getRoutines(lastSync); break;
            case 'logs': incoming = await provider.getLogs(lastSync); break;
            case 'habits': incoming = await provider.getHabits?.(lastSync) ?? []; break;
            case 'habitLogs': incoming = await provider.getHabitLogs?.(lastSync) ?? []; break;
            case 'noteHistories': incoming = await provider.getNoteHistories?.(lastSync) ?? []; break;
        }

        if (incoming.length > 0) {
            // Update cache and sync tokens
            cache[table] = mergeData(cache[table], incoming);

            const maxTime = incoming.reduce((max: string, curr: any) => {
                return !max || (curr.updatedAt && curr.updatedAt > max) ? curr.updatedAt : max;
            }, lastSync);
            if (maxTime) setSyncToken(table, maxTime);

            notifyListeners();
        }

        lastSyncTime[table] = now;
    } catch (error) {
        console.warn(`Storage: Failed to sync ${table}:`, error);
    }
}

/**
 * Load data from local IndexedDB into memory (Fast & Offline)
 */
export async function hydrateTable(table: keyof typeof cache): Promise<any> {
    if (pendingHydrations[table]) return pendingHydrations[table];

    pendingHydrations[table] = (async () => {
        try {
            // When in cloud mode (D1/Supabase), localProvider is where we persist after fetch.
            // When in strictly local mode, provider IS LocalStorageProvider.

            const local = (provider instanceof CloudflareD1Provider)
                ? provider.localProvider
                : (provider instanceof LocalStorageProvider ? provider : null);

            if (!local) {
                // Supabase case or fallback - try to call get directly (it handles local internally sometimes)
                const data = await provider.getNotes?.() || []; // generic placeholder
                // This is suboptimal for Supabase, but our priority is Cloudflare right now.
                return cache[table];
            }

            let data: any[] = [];
            switch (table) {
                case 'priorities': data = await local.getPriorities(); break;
                case 'reflections': data = await local.getReflections(); break;
                case 'notes': data = await local.getNotes(); break;
                case 'routines': data = await local.getRoutines(); break;
                case 'logs': data = await local.getLogs(); break;
                case 'habits': data = await local.getHabits?.() ?? []; break;
                case 'habitLogs': data = await local.getHabitLogs?.() ?? []; break;
                case 'noteHistories': data = await local.getNoteHistories?.() ?? []; break;
            }

            cache[table] = data.filter((i: any) => !i.deletedAt);
            return cache[table];
        } finally {
            pendingHydrations[table] = null;
        }
    })();
    return pendingHydrations[table];
}

/**
 * Initial cache hydration - strictly LOCAL and FAST.
 * Modular sync happens later per feature.
 */
export const hydrateCache = async (force = false) => {
    if (pendingHydrations.all && !force) return pendingHydrations.all;

    pendingHydrations.all = (async () => {
        try {
            // If forced and cloud active, sync with network first
            if (force && (provider instanceof CloudflareD1Provider || provider instanceof SupabaseProvider)) {
                console.log("Storage: Forced Cache Hydration - Syncing with Cloud first...");

                // Use unified sync for D1 if available, otherwise fallback to per-table sync
                if (provider instanceof CloudflareD1Provider) {
                    await (provider as CloudflareD1Provider).syncAll();
                } else {
                    const tables: (keyof typeof cache)[] = ['priorities', 'reflections', 'notes', 'routines', 'logs', 'habits', 'habitLogs', 'noteHistories'];
                    await Promise.allSettled(tables.map(t => syncTable(t, true)));
                }
            }

            console.log("Storage: Hydrating memory cache from IndexedDB...");

            // Load everything from local storage in parallel
            await Promise.all([
                hydrateTable('priorities'),
                hydrateTable('reflections'),
                hydrateTable('notes'),
                hydrateTable('routines'),
                hydrateTable('logs'),
                hydrateTable('habits'),
                hydrateTable('habitLogs'),
                hydrateTable('noteHistories'),
            ]);

            notifyListeners();
        } finally {
            pendingHydrations.all = null;
        }
    })();

    return pendingHydrations.all;
};

// --- Migration & Initialization ---
var initPromise: Promise<void> | null = null;
export const initializeStorage = () => {
    if (initPromise) return initPromise;
    initPromise = (async () => {
        // 1. Basic Migrations (localStorage -> IndexedDB)
        const migrationTasks = [
            { key: STORAGE_KEYS.PRIORITIES, table: 'priorities', save: (d: any) => provider.savePriorities(d) },
            { key: STORAGE_KEYS.REFLECTIONS, table: 'reflections', save: async (d: any) => { for (const r of d) await provider.saveReflection(r, 'LocalStorage Migration'); } },
            { key: STORAGE_KEYS.NOTES, table: 'notes', save: (d: any) => provider.saveNotes(d) },
            { key: STORAGE_KEYS.ROUTINES, table: 'routines', save: (d: any) => provider.saveRoutines(d) },
            { key: STORAGE_KEYS.LOGS, table: 'logs', save: async (d: any) => { for (const l of d) await provider.saveLog(l); } },
            { key: STORAGE_KEYS.HABITS, table: 'habits', save: (d: any) => provider.saveHabits(d) },
            { key: STORAGE_KEYS.HABIT_LOGS, table: 'habitLogs', save: (d: any) => provider.saveHabitLogs(d) },
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
        // 2. Initial Local Hydration
        await hydrateCache();

        // 3. Reset old priority completions 
        try {
            const { resetOldCompletions } = await import('./priorities');
            await resetOldCompletions();
        } catch (err) { console.warn("Storage: Failed to reset old completions:", err); }
    })();
    return initPromise;
};

// --- Chunked Migration Helper ---
const chunkArray = <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) { chunks.push(array.slice(i, i + size)); }
    return chunks;
};

const syncLocalToCloud = async (cloudData?: any): Promise<any> => {
    if (!(provider instanceof CloudflareD1Provider)) return null;
    console.log("Storage: Starting optimized migration sync...");
    const d1Provider = provider as CloudflareD1Provider;
    const local = d1Provider.localProvider;
    const CHUNK_SIZE = 50;

    const filterNewOrUpdated = (locals: any[], cloudBatch: any[] | undefined) => {
        if (!cloudBatch || cloudBatch.length === 0) return locals;
        const cloudMap = new Map((cloudBatch as any[]).map(i => [i.id, i]));
        return locals.filter(localItem => {
            const cloudItem = cloudMap.get(localItem.id);
            if (!cloudItem) return true;
            if (localItem.updatedAt && cloudItem.updatedAt) return localItem.updatedAt > cloudItem.updatedAt;
            return false;
        });
    };

    const batchSave = async (items: any[], saveFn: (batch: any[]) => Promise<any>) => {
        if (items.length === 0) return;
        const chunks = chunkArray(items, CHUNK_SIZE);
        for (const chunk of chunks) { await saveFn(chunk); }
    };

    try {
        const [pLocal, rLocal, nLocal, hLocal, hlLocal, refLocal, lLocal, nhLocal] = await Promise.all([
            local.getPriorities(), local.getRoutines(), local.getNotes(),
            local.getHabits(), local.getHabitLogs(), local.getReflections(), local.getLogs(),
            local.getNoteHistories ? local.getNoteHistories() : Promise.resolve([])
        ]);

        const syncGroups = [
            { key: 'priorities', name: 'Priorities', items: filterNewOrUpdated(pLocal, cloudData?.priorities), fn: (b: any) => d1Provider.savePriorities(b, 'Migration') },
            { key: 'routines', name: 'Routines', items: filterNewOrUpdated(rLocal, cloudData?.routines), fn: (b: any) => d1Provider.saveRoutines(b) },
            { key: 'notes', name: 'Notes', items: filterNewOrUpdated(nLocal, cloudData?.notes), fn: (b: any) => d1Provider.saveNotes(b) },
            { key: 'habits', name: 'Habits', items: filterNewOrUpdated(hLocal, cloudData?.habits), fn: (b: any) => d1Provider.saveHabits(b) },
            { key: 'habitLogs', name: 'HabitLogs', items: filterNewOrUpdated(hlLocal, cloudData?.habitLogs), fn: (b: any) => d1Provider.saveHabitLogs(b) },
            { key: 'noteHistories', name: 'NoteHistories', items: filterNewOrUpdated(nhLocal || [], cloudData?.noteHistories), fn: (b: any) => d1Provider.saveNoteHistories?.(b) },
        ];

        const stats = {
            priorities: 0,
            routines: 0,
            notes: 0,
            habits: 0,
            habitLogs: 0,
            reflections: 0,
            logs: 0,
            noteHistories: 0
        };

        // Parallel execution for distinct tables to speed up migration
        const migrationTasks = [
            // Standard groups (Batchable)
            ...syncGroups.map(async (group) => {
                if (group.items.length > 0) {
                    console.log(`Storage: Syncing ${group.name} (${group.items.length} items)...`);
                    await batchSave(group.items, group.fn);
                    // @ts-ignore
                    stats[group.key] = group.items.length;
                }
            }),
            // Reflections (Single save per item)
            (async () => {
                const refSync = filterNewOrUpdated(refLocal, cloudData?.reflections);
                for (const r of refSync) {
                    try {
                        await d1Provider.saveReflection(r, 'Migration');
                        stats.reflections++;
                    } catch (e) {
                        console.error("Storage: Failed to migrate reflection", r.id, e);
                    }
                }
            })(),
            // Logs (Chunked Single save)
            (async () => {
                const logSync = filterNewOrUpdated(lLocal, cloudData?.logs);
                const logChunks = chunkArray(logSync, CHUNK_SIZE);
                for (const chunk of logChunks) {
                    for (const l of chunk) {
                        try {
                            await d1Provider.saveLog(l);
                            stats.logs++;
                        } catch (e) {
                            console.error("Storage: Failed to migrate log", l.id, e);
                        }
                    }
                }
            })()
        ];

        await Promise.all(migrationTasks);

        const totalPushed = Object.values(stats).reduce((a, b) => a + b, 0);
        console.log(`Storage: Migration completed. Total items: ${totalPushed}`, stats);
        return stats;
    } catch (e) {
        console.error("Storage: Migration failed:", e);
        return null;
    }
};

// --- Auth State Logic ---
const handleAuthStateChange = (user: { id: string; email?: string } | null, isInitial: boolean = false) => {
    const newUserId = user?.id || null;
    const identityChanged = newUserId !== currentUserId;
    const previousProvider = provider;
    const previousUserId = currentUserId;

    if (isInitial || identityChanged) {
        currentUserId = newUserId;
        if ((previousProvider instanceof SupabaseProvider || previousProvider instanceof CloudflareD1Provider) && !user) {
            try { localStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE); } catch (e) { }
        }

        const isCloud = !!user;
        if (user) {
            provider = useCloudflareBackend ? new CloudflareD1Provider() : new SupabaseProvider();
        } else {
            provider = new LocalStorageProvider();
        }

        if (identityChanged) {
            Object.keys(cache).forEach(key => (cache[key as keyof typeof cache] = null));
            if (previousUserId) {
                ['priorities', 'reflections', 'notes', 'routines', 'logs'].forEach(table => {
                    localStorage.removeItem(`sync_token_${previousUserId}_${table}`);
                });
            }
            if (previousUserId && (!newUserId || previousUserId !== newUserId)) {
                (async () => { try { await clearAllData(); } catch (e) { } })();
            }
        }

        startAuthSync(user ? { id: user.id, email: user.email } : null, isCloud);

        (async () => {
            try {
                const isGuestToUser = !previousUserId && newUserId;

                // One-time Sync for Guest -> User Migration or Login
                if (isGuestToUser && provider instanceof CloudflareD1Provider) {
                    const unifiedResult = await provider.syncAll();
                    const stats = await syncLocalToCloud(unifiedResult);

                    // Trigger Modal in UI with stats
                    if (stats && Object.values(stats).some(v => (v as number) > 0)) {
                        setMigrationFlag(true, stats);
                    }
                    console.log("Storage: Guest-to-User migration completed. Flagging UI for dialog.");
                }

                await hydrateCache();
                completeAuthSync();
            } catch (error) {
                completeAuthSync(error instanceof Error ? error : new Error(String(error)));
            }
        })();
    }
};

// Listeners
if (useCloudflareBackend) {
    onCloudflareAuthChange((user: any) => handleAuthStateChange(user, false));
    const cfUser = getCloudflareUser();
    if (cfUser) handleAuthStateChange(cfUser, true);
} else if (useSupabaseBackend) {
    supabase.auth.onAuthStateChange((event: string, session: any) => {
        handleAuthStateChange(session?.user ? { id: session.user.id, email: session.user.email } : null, event === 'INITIAL_SESSION');
    });
}

export const setStorageProvider = (newProvider: IStorageProvider) => {
    provider = newProvider;
    hydrateCache(true);
};

export const getIsCloudActive = () => provider instanceof SupabaseProvider || provider instanceof CloudflareD1Provider;
