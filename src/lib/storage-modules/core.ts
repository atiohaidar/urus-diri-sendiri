import { PriorityTask, Reflection, Note, NoteHistory, RoutineItem, ActivityLog, Habit, HabitLog } from '../types';
import { IStorageProvider } from '../storage-interface';
import { LocalStorageProvider } from '../providers/local-storage-provider';
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
export const provider: IStorageProvider = new LocalStorageProvider();

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

export async function hydrateTable(table: keyof typeof cache, force = false): Promise<any> {
    // If cache populated and valid, return it (unless forced)
    if (cache[table] !== null && !force && !pendingHydrations[table]) {
        return cache[table];
    }

    if (pendingHydrations[table]) return pendingHydrations[table];

    pendingHydrations[table] = (async () => {
        try {
            let incoming: any[] = [];
            switch (table) {
                case 'priorities': incoming = await provider.getPriorities(); break;
                case 'reflections': incoming = await provider.getReflections(); break;
                case 'notes': incoming = await provider.getNotes(); break;
                case 'noteHistories': incoming = await provider.getNoteHistories?.() ?? []; break;
                case 'routines': incoming = await provider.getRoutines(); break;
                case 'logs': incoming = await provider.getLogs(); break;
                case 'habits': incoming = await provider.getHabits?.() ?? []; break;
                case 'habitLogs': incoming = await provider.getHabitLogs?.() ?? []; break;
            }

            cache[table] = incoming.filter((i: any) => !i.deletedAt);

            return cache[table];
        } finally {
            pendingHydrations[table] = null;
        }
    })();
    return pendingHydrations[table];
}

