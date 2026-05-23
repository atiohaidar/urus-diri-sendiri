import { PriorityTask, Reflection, Note, NoteHistory, RoutineItem, ActivityLog, Habit, HabitLog } from '../types';
import { IStorageProvider } from '../storage-interface';
import { LocalStorageProvider } from '../providers/local-storage-provider';
import { CloudflareD1Provider } from '../providers/cloudflare-d1-provider';
import { onAuthStateChange as onCloudflareAuthChange, isCloudflareConfigured, getCurrentUser as getCloudflareUser } from '../cloudflare-auth';
import { cleanupImages, clearAllData } from '../idb';
export { clearAllData };
import { STORAGE_KEYS } from '../constants';
import { toast } from 'sonner';
import { startAuthSync, completeAuthSync, setMigrationFlag } from '../auth-sync-manager';
import { logger } from '../logger';

// Helper for generating IDs
export const generateId = (prefix: string = 'id'): string => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// --- Error Handling Helper ---
export const handleSaveError = (error: any, context: string, retryFn?: () => void) => {
    logger.error(`Save error (${context}):`, error);
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
// Not needed in online-first mode, kept for backward compat with local mode
const getSyncToken = (table: string): string | undefined => {
    if (provider instanceof CloudflareD1Provider) return undefined; // Online-first: always full fetch
    const key = `sync_token_${currentUserId}_${table}`;
    return localStorage.getItem(key) || undefined;
};

const setSyncToken = (table: string, timestamp: string) => {
    if (provider instanceof CloudflareD1Provider) return; // Online-first: not needed
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
 * Perform network sync for a specific table.
 * Online-first: directly fetches from provider (which is API when cloud active).
 */
export async function syncTable(table: keyof typeof cache, force = false): Promise<void> {
    // Only sync for cloud providers
    if (!(provider instanceof CloudflareD1Provider)) return;

    // Check cooldown unless forced
    const now = Date.now();
    if (!force && lastSyncTime[table] && (now - lastSyncTime[table] < SYNC_COOLDOWN)) {
        return;
    }

    try {
        logger.log(`Storage: Fetching ${table} from API...`);

        let data: any[] = [];
        switch (table) {
            case 'priorities': data = await provider.getPriorities(); break;
            case 'reflections': data = await provider.getReflections(); break;
            case 'notes': data = await provider.getNotes(); break;
            case 'routines': data = await provider.getRoutines(); break;
            case 'logs': data = await provider.getLogs(); break;
            case 'habits': data = await provider.getHabits?.() ?? []; break;
            case 'habitLogs': data = await provider.getHabitLogs?.() ?? []; break;
            case 'noteHistories': data = await provider.getNoteHistories?.() ?? []; break;
        }

        // Replace cache entirely with API data (source of truth)
        cache[table] = (data || []).filter((i: any) => !i.deletedAt);
        lastSyncTime[table] = Date.now();
        notifyListeners();
    } catch (error) {
        logger.warn(`Storage: Failed to sync ${table}:`, error);
    }
}

/**
 * Load data into memory cache.
 * - Cloud mode: Fetch from API (provider = CloudflareD1Provider)
 * - Local mode: Load from IndexedDB (provider = LocalStorageProvider)
 */
export async function hydrateTable(table: keyof typeof cache): Promise<any> {
    if (pendingHydrations[table]) return pendingHydrations[table];

    pendingHydrations[table] = (async () => {
        try {
            let data: any[] = [];
            switch (table) {
                case 'priorities': data = await provider.getPriorities(); break;
                case 'reflections': data = await provider.getReflections(); break;
                case 'notes': data = await provider.getNotes(); break;
                case 'routines': data = await provider.getRoutines(); break;
                case 'logs': data = await provider.getLogs(); break;
                case 'habits': data = await provider.getHabits?.() ?? []; break;
                case 'habitLogs': data = await provider.getHabitLogs?.() ?? []; break;
                case 'noteHistories': data = await provider.getNoteHistories?.() ?? []; break;
            }

            cache[table] = (data || []).filter((i: any) => !i.deletedAt);
            return cache[table];
        } finally {
            pendingHydrations[table] = null;
        }
    })();
    return pendingHydrations[table];
}

/**
 * Initial cache hydration.
 * - Cloud mode: Fetches all data from API via provider
 * - Local mode: Loads from IndexedDB
 */
export const hydrateCache = async (force = false) => {
    if (pendingHydrations.all && !force) return pendingHydrations.all;

    pendingHydrations.all = (async () => {
        try {
            const isCloud = provider instanceof CloudflareD1Provider;
            logger.log("Storage: Hydrating cache from", isCloud ? "API" : "IndexedDB", "...");

            if (isCloud && provider.syncAll) {
                // Unified Sync: Fetch all main tables in a single HTTP request!
                const allData = await provider.syncAll();
                if (allData) {
                    const now = Date.now();
                    const tables: Array<keyof typeof cache> = [
                        'priorities', 'reflections', 'notes', 'routines',
                        'logs', 'habits', 'habitLogs'
                    ];
                    
                    tables.forEach(table => {
                        cache[table] = (allData[table] || []).filter((i: any) => !i.deletedAt);
                        lastSyncTime[table] = now; // Set cooldown to prevent immediate redundant individual fetches
                    });
                }
                
                // Hydrate noteHistories separately since it's not in syncAll
                await hydrateTable('noteHistories');
            } else {
                // Fallback to loading individually (Local/IndexedDB)
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
            }

            notifyListeners();
        } catch (error) {
            logger.error("Storage: Hydration failed:", error);
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
                    logger.log(`Storage: Migrated ${task.table} to IndexedDB`);
                } catch (e) {
                    logger.error(`Storage: Failed to migrate ${task.table}:`, e);
                }
            }
        }
        // 2. Initial Local Hydration
        await hydrateCache();

        // 3. Reset old priority completions 
        try {
            const { resetOldCompletions } = await import('./priorities');
            await resetOldCompletions();
        } catch (err) { logger.warn("Storage: Failed to reset old completions:", err); }
    })();
    return initPromise;
};

// --- Guest-to-Cloud Migration Helper ---
// When a guest user logs in, push their local IndexedDB data to the cloud API.
const chunkArray = <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) { chunks.push(array.slice(i, i + size)); }
    return chunks;
};

const migrateLocalToCloud = async (): Promise<any> => {
    if (!(provider instanceof CloudflareD1Provider)) return null;
    logger.log("Storage: Migrating local IndexedDB data to cloud...");
    const local = new LocalStorageProvider();
    const CHUNK_SIZE = 50;

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

        const stats = {
            priorities: 0, routines: 0, notes: 0, habits: 0,
            habitLogs: 0, reflections: 0, logs: 0, noteHistories: 0
        };

        const syncGroups = [
            { key: 'priorities', items: pLocal, fn: (b: any) => provider.savePriorities(b, 'Migration') },
            { key: 'routines', items: rLocal, fn: (b: any) => provider.saveRoutines(b) },
            { key: 'notes', items: nLocal, fn: (b: any) => provider.saveNotes(b) },
            { key: 'habits', items: hLocal, fn: (b: any) => provider.saveHabits?.(b) },
            { key: 'habitLogs', items: hlLocal, fn: (b: any) => provider.saveHabitLogs?.(b) },
            { key: 'noteHistories', items: nhLocal || [], fn: (b: any) => provider.saveNoteHistories?.(b) },
        ];

        await Promise.all([
            ...syncGroups.map(async (group) => {
                if (group.items.length > 0) {
                    await batchSave(group.items, group.fn);
                    (stats as any)[group.key] = group.items.length;
                }
            }),
            (async () => {
                for (const r of refLocal) {
                    try { await provider.saveReflection(r, 'Migration'); stats.reflections++; }
                    catch (e) { logger.error("Migration: reflection failed", r.id, e); }
                }
            })(),
            (async () => {
                for (const l of lLocal) {
                    try { await provider.saveLog(l); stats.logs++; }
                    catch (e) { logger.error("Migration: log failed", l.id, e); }
                }
            })(),
        ]);

        const totalPushed = Object.values(stats).reduce((a, b) => a + b, 0);
        logger.log(`Storage: Migration completed. Total items: ${totalPushed}`, stats);
        return stats;
    } catch (e) {
        logger.error("Storage: Migration failed:", e);
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
        if (previousProvider instanceof CloudflareD1Provider && !user) {
            try { localStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE); } catch (e) { }
        }

        const isCloud = !!user;
        if (user) {
            provider = new CloudflareD1Provider();
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

                // One-time migration: push local IndexedDB data to cloud
                if (isGuestToUser && provider instanceof CloudflareD1Provider) {
                    const stats = await migrateLocalToCloud();

                    // Trigger Modal in UI with stats
                    if (stats && Object.values(stats).some(v => (v as number) > 0)) {
                        setMigrationFlag(true, stats);
                    }
                    logger.log("Storage: Guest-to-User migration completed.");
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
if (isCloudflareConfigured) {
    onCloudflareAuthChange((user: any) => handleAuthStateChange(user, false));
    const cfUser = getCloudflareUser();
    if (cfUser) handleAuthStateChange(cfUser, true);
}

export const setStorageProvider = (newProvider: IStorageProvider) => {
    provider = newProvider;
    hydrateCache(true);
};

export const getIsCloudActive = () => provider instanceof CloudflareD1Provider;
