import { PriorityTask, Reflection, Note, NoteHistory, RoutineItem, ActivityLog, Habit, HabitLog } from '../types';
import { IStorageProvider } from '../storage-interface';
import { LocalStorageProvider } from '../providers/local-storage-provider';
import { CloudflareD1Provider } from '../providers/cloudflare-d1-provider';
import { onAuthStateChange as onCloudflareAuthChange, isCloudflareConfigured, getCurrentUser as getCloudflareUser } from '../cloudflare-auth';
import { cleanupImages, clearAllData, clearStore, putItems, deleteItem, IDB_STORES } from '../idb';
export { clearAllData };
import { STORAGE_KEYS } from '../constants';
import { toast } from 'sonner';
import { startAuthSync, completeAuthSync } from '../auth-sync-manager';
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
export let rawProvider: IStorageProvider = new LocalStorageProvider();

export const provider = new Proxy({} as IStorageProvider, {
    get(target, prop, receiver) {
        const method = Reflect.get(rawProvider, prop, receiver);
        if (typeof method === 'function') {
            return async (...args: any[]) => {
                const propStr = String(prop);
                const isMutation = propStr.startsWith('save') || propStr.startsWith('delete') || propStr.startsWith('clear');
                
                if (isMutation && !navigator.onLine) {
                    const errorMsg = "Anda sedang offline. Penyuntingan data dinonaktifkan dalam Mode Baca-Saja.";
                    toast.error("Mode Baca-Saja (Offline) 🔌", {
                        description: "Hubungkan kembali perangkat Anda ke internet untuk menyimpan perubahan.",
                        duration: 5000
                    });
                    throw new Error(errorMsg);
                }
                return method.apply(rawProvider, args);
            };
        }
        return method;
    }
});

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
    if (rawProvider instanceof CloudflareD1Provider) return undefined; // Online-first: always full fetch
    const key = `sync_token_${currentUserId}_${table}`;
    return localStorage.getItem(key) || undefined;
};

const setSyncToken = (table: string, timestamp: string) => {
    if (rawProvider instanceof CloudflareD1Provider) return; // Online-first: not needed
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
    if (!(rawProvider instanceof CloudflareD1Provider)) return;

    // Check cooldown unless forced
    const now = Date.now();
    if (!force && lastSyncTime[table] && (now - lastSyncTime[table] < SYNC_COOLDOWN)) {
        return;
    }

    try {
        logger.log(`Storage: Fetching ${table} from API...`);

        let data: any[] = [];
        switch (table) {
            case 'priorities': data = await rawProvider.getPriorities(); break;
            case 'reflections': data = await rawProvider.getReflections(); break;
            case 'notes': data = await rawProvider.getNotes(); break;
            case 'routines': data = await rawProvider.getRoutines(); break;
            case 'logs': data = await rawProvider.getLogs(); break;
            case 'habits': data = await rawProvider.getHabits?.() ?? []; break;
            case 'habitLogs': data = await rawProvider.getHabitLogs?.() ?? []; break;
            case 'noteHistories': data = await rawProvider.getNoteHistories?.() ?? []; break;
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
                case 'priorities': data = await rawProvider.getPriorities(); break;
                case 'reflections': data = await rawProvider.getReflections(); break;
                case 'notes': data = await rawProvider.getNotes(); break;
                case 'routines': data = await rawProvider.getRoutines(); break;
                case 'logs': data = await rawProvider.getLogs(); break;
                case 'habits': data = await rawProvider.getHabits?.() ?? []; break;
                case 'habitLogs': data = await rawProvider.getHabitLogs?.() ?? []; break;
                case 'noteHistories': data = await rawProvider.getNoteHistories?.() ?? []; break;
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
            const isCloud = rawProvider instanceof CloudflareD1Provider;
            logger.log("Storage: Hydrating cache from", isCloud ? "API" : "IndexedDB", "...");

            if (isCloud && rawProvider.syncAll) {
                // --- STRATEGY A: Offline-First / Cache-First + Conditional Sync ---
                
                // 1. Load data from local IndexedDB instantly to prevent empty UI
                const local = new LocalStorageProvider();
                const [pLocal, rLocal, nLocal, hLocal, hlLocal, refLocal, lLocal] = await Promise.all([
                    local.getPriorities(),
                    local.getRoutines(),
                    local.getNotes(),
                    local.getHabits(),
                    local.getHabitLogs(),
                    local.getReflections(),
                    local.getLogs()
                ]);

                // Populate cache from IndexedDB if in-memory is currently empty or has less data
                if (cache.priorities === null) cache.priorities = pLocal;
                if (cache.routines === null) cache.routines = rLocal;
                if (cache.notes === null) cache.notes = nLocal;
                if (cache.habits === null) cache.habits = hLocal;
                if (cache.habitLogs === null) cache.habitLogs = hlLocal;
                if (cache.reflections === null) cache.reflections = refLocal;
                if (cache.logs === null) cache.logs = lLocal;

                // Notify UI immediately so that cached data renders instantly
                notifyListeners();

                // 2. Perform background incremental/conditional sync with sync token
                const tokenKey = currentUserId ? `sync_token_${currentUserId}_all` : 'sync_token_guest_all';
                const since = localStorage.getItem(tokenKey) || undefined;

                logger.log(`Storage: Syncing changes from cloud since: ${since || 'Beginning'}...`);
                const allData = await rawProvider.syncAll(since);

                if (allData) {
                    const now = Date.now();
                    const tables: Array<keyof typeof cache> = [
                        'priorities', 'reflections', 'notes', 'routines',
                        'logs', 'habits', 'habitLogs'
                    ];

                    const idbMapping: Record<string, string> = {
                        priorities: IDB_STORES.PRIORITIES,
                        reflections: IDB_STORES.REFLECTIONS,
                        notes: IDB_STORES.NOTES,
                        routines: IDB_STORES.ROUTINES,
                        logs: IDB_STORES.LOGS,
                        habits: IDB_STORES.HABITS,
                        habitLogs: IDB_STORES.HABIT_LOGS,
                    };

                    if (since) {
                        logger.log("Storage: Processing incremental changes from backend...");
                        // Incremental Sync: Merge incoming changes into existing cache
                        for (const table of tables) {
                            const incoming = allData[table] || [];
                            if (incoming.length > 0) {
                                const current = cache[table] || [];
                                const merged = mergeData(current, incoming);
                                
                                // In-memory cache should exclude soft-deleted items
                                cache[table] = merged.filter((i: any) => !i.deletedAt);
                                lastSyncTime[table] = now;

                                // Sync updates to local IndexedDB
                                const storeName = idbMapping[table];
                                if (storeName) {
                                    const toPut = incoming.filter((i: any) => !i.deletedAt);
                                    const toDelete = incoming.filter((i: any) => i.deletedAt).map((i: any) => i.id);
                                    
                                    if (toPut.length > 0) {
                                        await putItems(storeName, toPut);
                                    }
                                    for (const id of toDelete) {
                                        await deleteItem(storeName, id);
                                    }
                                }
                            }
                        }
                    } else {
                        logger.log("Storage: Processing full database refresh from backend...");
                        // Full Sync: Replace local cache and IndexedDB entirely with API truth
                        for (const table of tables) {
                            const incoming = (allData[table] || []).filter((i: any) => !i.deletedAt);
                            cache[table] = incoming;
                            lastSyncTime[table] = now;

                            const storeName = idbMapping[table];
                            if (storeName) {
                                await clearStore(storeName);
                                await putItems(storeName, incoming);
                            }
                        }
                    }

                    // Save new serverTime token
                    if (allData.serverTime) {
                        localStorage.setItem(tokenKey, allData.serverTime);
                    }

                    notifyListeners();
                    logger.log("Storage: Cache and IndexedDB updated with cloud changes.");
                } else {
                    // allData is null, representing 304 Not Modified
                    logger.log("Storage: ♻️ Server returned 304 Not Modified. Cache is fully up-to-date.");
                }

                // --- Optimize Note Histories: Cache-First + Incremental Cloud Sync ---
                
                // 1. Load initial noteHistories from local IndexedDB instantly first if empty in-memory
                if (cache.noteHistories === null) {
                    cache.noteHistories = await local.getNoteHistories();
                    notifyListeners();
                }

                // 2. Perform background incremental/conditional sync for noteHistories
                const nhTokenKey = currentUserId ? `sync_token_${currentUserId}_noteHistories` : 'sync_token_guest_noteHistories';
                const nhSince = localStorage.getItem(nhTokenKey) || undefined;

                logger.log(`Storage: Syncing note histories since: ${nhSince || 'Beginning'}...`);
                if (rawProvider.getNoteHistories) {
                    const nhData = await rawProvider.getNoteHistories(nhSince);

                    if (nhData && nhData.length > 0) {
                        if (nhSince) {
                            logger.log("Storage: Processing incremental note histories from backend...");
                            const currentNH = cache.noteHistories || [];
                            const mergedNH = mergeData(currentNH, nhData);
                            cache.noteHistories = mergedNH.filter((i: any) => !i.deletedAt);
                            
                            // Sync updates to local IndexedDB note_histories store
                            const toPutNH = nhData.filter((i: any) => !i.deletedAt);
                            const toDeleteNH = nhData.filter((i: any) => i.deletedAt).map((i: any) => i.id);
                            
                            if (toPutNH.length > 0) {
                                await putItems(IDB_STORES.NOTE_HISTORIES, toPutNH);
                            }
                            for (const id of toDeleteNH) {
                                await deleteItem(IDB_STORES.NOTE_HISTORIES, id);
                            }
                        } else {
                            logger.log("Storage: Processing full note histories refresh from backend...");
                            const cleanNH = nhData.filter((i: any) => !i.deletedAt);
                            cache.noteHistories = cleanNH;
                            await clearStore(IDB_STORES.NOTE_HISTORIES);
                            await putItems(IDB_STORES.NOTE_HISTORIES, cleanNH);
                        }

                        // Save new token time (using current timestamp as sync time)
                        localStorage.setItem(nhTokenKey, new Date().toISOString());
                        notifyListeners();
                        logger.log("Storage: Note histories cache and IndexedDB updated with cloud changes.");
                    } else {
                        logger.log("Storage: ♻️ Note histories cache is already fully up-to-date (no new records).");
                    }
                }
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

// --- Auth State Logic ---
const handleAuthStateChange = (user: { id: string; email?: string } | null, isInitial: boolean = false) => {
    const newUserId = user?.id || null;
    const identityChanged = newUserId !== currentUserId;
    const previousProvider = rawProvider;
    const previousUserId = currentUserId;

    if (isInitial || identityChanged) {
        currentUserId = newUserId;
        if (previousProvider instanceof CloudflareD1Provider && !user) {
            try { localStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE); } catch (e) { }
        }

        const isCloud = !!user;
        if (user) {
            rawProvider = new CloudflareD1Provider();
        } else {
            rawProvider = new LocalStorageProvider();
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
    rawProvider = newProvider;
    hydrateCache(true);
};

export const getIsCloudActive = () => rawProvider instanceof CloudflareD1Provider;
