import { IStorageProvider } from '../storage-interface';
import { PriorityTask, Reflection, Note, NoteHistory, RoutineItem, ActivityLog, Habit, HabitLog } from '../types';
import { LocalStorageProvider } from './local-storage-provider';
import { offlineQueue, QueueItem } from './offline-queue';
import {
    authApi,
    getStoredToken,
    getStoredUser,
    prioritiesApi,
    routinesApi,
    notesApi,
    noteHistoriesApi,
    reflectionsApi,
    logsApi,
    habitsApi,
    habitLogsApi,
    personalNotesApi,
} from '../api/cloudflare-api';

/**
 * CloudflareD1Provider - Storage provider using Hono API with Cloudflare D1
 * 
 * This provider replaces SupabaseProvider for cloud storage functionality.
 * It uses the same offline queue mechanism for resilience.
 */
export class CloudflareD1Provider implements IStorageProvider {
    private localProvider = new LocalStorageProvider();

    constructor() {
        // Set up the queue processor for offline support
        offlineQueue.setProcessor(async (item: QueueItem) => {
            switch (item.type) {
                case 'priorities': await prioritiesApi.save(item.data); break;
                case 'delete_priority': await prioritiesApi.delete(item.data); break;
                case 'reflection': await reflectionsApi.save(item.data); break;
                case 'notes': await notesApi.save(item.data); break;
                case 'delete_note': await notesApi.delete(item.data); break;
                case 'note_history': await noteHistoriesApi.save(item.data); break;
                case 'routines': await routinesApi.save(item.data); break;
                case 'delete_routine': await routinesApi.delete(item.data); break;
                case 'log': await logsApi.save(item.data); break;
                case 'delete_log': await logsApi.delete(item.data); break;
                case 'habits': await habitsApi.save(item.data); break;
                case 'habitLogs': await habitLogsApi.save(item.data); break;
                case 'personal_notes': await personalNotesApi.save(item.data); break;
            }
        });

        // Try processing any pending items
        offlineQueue.process();
    }

    private isOnline() {
        return offlineQueue.isOnline();
    }

    private async executeOrQueue(item: QueueItem, fn: () => Promise<void>) {
        return offlineQueue.executeOrQueue(item, fn);
    }

    private handleAuthError(error: any): boolean {
        if (error && (error.message?.includes('Unauthorized') || error.message?.includes('401'))) {
            console.warn('Auth session expired or invalid:', error);
            import('sonner').then(({ toast }) => {
                toast.warning("Sesi login berakhir", {
                    description: "Beberapa data mungkin tidak sinkron. Silakan login kembali.",
                    action: {
                        label: "Refresh",
                        onClick: () => window.location.reload()
                    }
                });
            });
            return true;
        }
        return false;
    }

    // --- Priorities ---
    async getPriorities(since?: string): Promise<PriorityTask[]> {
        if (!this.isOnline()) return this.localProvider.getPriorities(since);

        try {
            const priorities = await prioritiesApi.get(since) as PriorityTask[];

            if (!since) {
                await this.localProvider.savePriorities(priorities);
            } else if (priorities.length > 0) {
                const current = await this.localProvider.getPriorities();
                const mergedMap = new Map(current.map(p => [p.id, p]));
                priorities.forEach(p => mergedMap.set(p.id, p));
                await this.localProvider.savePriorities(Array.from(mergedMap.values()));
            }
            return priorities;
        } catch (error) {
            if (this.handleAuthError(error)) return [];
            console.error('Error fetching priorities:', error);
            return this.localProvider.getPriorities(since);
        }
    }

    async savePriorities(priorities: PriorityTask[]): Promise<void> {
        await this.localProvider.savePriorities(priorities);
        await this.executeOrQueue(
            { type: 'priorities', data: priorities },
            async () => { await prioritiesApi.save(priorities); }
        );
    }

    async deletePriority(id: string): Promise<void> {
        await this.localProvider.deletePriority(id);
        await this.executeOrQueue(
            { type: 'delete_priority', data: id },
            async () => { await prioritiesApi.delete(id); }
        );
    }

    // --- Reflections ---
    async getReflections(since?: string): Promise<Reflection[]> {
        if (!this.isOnline()) return this.localProvider.getReflections(since);
        try {
            const reflections = await reflectionsApi.get(since) as Reflection[];

            if (!since) {
                for (const r of reflections) await this.localProvider.saveReflection(r);
            } else if (reflections.length > 0) {
                for (const r of reflections) await this.localProvider.saveReflection(r);
            }
            return reflections;
        } catch (error) {
            if (this.handleAuthError(error)) return [];
            console.error('Error fetching reflections:', error);
            return this.localProvider.getReflections(since);
        }
    }

    async saveReflection(reflection: Reflection): Promise<void> {
        await this.localProvider.saveReflection(reflection);
        await this.executeOrQueue(
            { type: 'reflection', data: reflection },
            async () => { await reflectionsApi.save(reflection); }
        );
    }

    // --- Notes ---
    async getNotes(since?: string): Promise<Note[]> {
        if (!this.isOnline()) return this.localProvider.getNotes(since);
        try {
            const notes = await notesApi.get(since) as Note[];

            if (!since) {
                await this.localProvider.saveNotes(notes);
            } else if (notes.length > 0) {
                const current = await this.localProvider.getNotes();
                const mergedMap = new Map(current.map(n => [n.id, n]));
                notes.forEach(n => mergedMap.set(n.id, n));
                await this.localProvider.saveNotes(Array.from(mergedMap.values()));
            }
            return notes;
        } catch (error) {
            if (this.handleAuthError(error)) return [];
            return this.localProvider.getNotes(since);
        }
    }

    async saveNote(note: Note): Promise<void> {
        await this.localProvider.saveNote(note);
        await this.executeOrQueue(
            { type: 'notes', data: note },
            async () => { await notesApi.saveSingle(note); }
        );
    }

    async saveNotes(notes: Note[]): Promise<void> {
        await this.localProvider.saveNotes(notes);
        await this.executeOrQueue(
            { type: 'notes', data: notes },
            async () => { await notesApi.save(notes); }
        );
    }

    async deleteNote(id: string): Promise<void> {
        await this.localProvider.deleteNote(id);
        await this.executeOrQueue(
            { type: 'delete_note', data: id },
            async () => { await notesApi.delete(id); }
        );
    }

    // --- Note Histories ---
    async getNoteHistories(since?: string): Promise<NoteHistory[]> {
        if (!this.isOnline()) return this.localProvider.getNoteHistories?.(since) ?? [];
        try {
            const histories = await noteHistoriesApi.get(since) as NoteHistory[];

            if (!since) {
                for (const h of histories) {
                    await this.localProvider.saveNoteHistory?.(h);
                }
            } else if (histories.length > 0) {
                for (const h of histories) {
                    await this.localProvider.saveNoteHistory?.(h);
                }
            }
            return histories;
        } catch (error) {
            if (this.handleAuthError(error)) return [];
            console.error('Error fetching note histories:', error);
            return this.localProvider.getNoteHistories?.(since) ?? [];
        }
    }

    async saveNoteHistory(history: NoteHistory): Promise<void> {
        await this.localProvider.saveNoteHistory?.(history);
        await this.executeOrQueue(
            { type: 'note_history', data: history },
            async () => { await noteHistoriesApi.save(history); }
        );
    }

    // --- Routines ---
    async getRoutines(since?: string): Promise<RoutineItem[]> {
        if (!this.isOnline()) return this.localProvider.getRoutines(since);
        try {
            const routines = await routinesApi.get(since) as RoutineItem[];

            if (!since) {
                await this.localProvider.saveRoutines(routines);
            } else if (routines.length > 0) {
                const current = await this.localProvider.getRoutines();
                const mergedMap = new Map(current.map(r => [r.id, r]));
                routines.forEach(r => mergedMap.set(r.id, r));
                await this.localProvider.saveRoutines(Array.from(mergedMap.values()));
            }
            return routines;
        } catch (error) {
            if (this.handleAuthError(error)) return [];
            console.error('Error fetching routines:', error);
            return this.localProvider.getRoutines(since);
        }
    }

    async saveRoutines(routines: RoutineItem[]): Promise<void> {
        await this.localProvider.saveRoutines(routines);
        await this.executeOrQueue(
            { type: 'routines', data: routines },
            async () => { await routinesApi.save(routines); }
        );
    }

    async deleteRoutine(id: string): Promise<void> {
        await this.localProvider.deleteRoutine(id);
        await this.executeOrQueue(
            { type: 'delete_routine', data: id },
            async () => { await routinesApi.delete(id); }
        );
    }

    // --- Logs ---
    async getLogs(since?: string): Promise<ActivityLog[]> {
        if (!this.isOnline()) return this.localProvider.getLogs(since);
        try {
            const logs = await logsApi.get(since) as ActivityLog[];

            if (!since) {
                for (const l of logs) await this.localProvider.saveLog(l);
            } else if (logs.length > 0) {
                for (const l of logs) await this.localProvider.saveLog(l);
            }
            return logs;
        } catch (error) {
            if (this.handleAuthError(error)) return [];
            console.error('Error fetching logs:', error);
            return this.localProvider.getLogs(since);
        }
    }

    async saveLog(log: ActivityLog): Promise<void> {
        await this.localProvider.saveLog(log);
        await this.executeOrQueue(
            { type: 'log', data: log },
            async () => { await logsApi.save(log); }
        );
    }

    async deleteLog(id: string): Promise<void> {
        await this.localProvider.deleteLog(id);
        await this.executeOrQueue(
            { type: 'delete_log', data: id },
            async () => { await logsApi.delete(id); }
        );
    }

    // --- Habits ---
    async getHabits(since?: string): Promise<Habit[]> {
        if (!this.isOnline()) return this.localProvider.getHabits(since);
        try {
            const habits = await habitsApi.get(since) as Habit[];

            if (!since) {
                await this.localProvider.saveHabits(habits);
            } else if (habits.length > 0) {
                const current = await this.localProvider.getHabits();
                const mergedMap = new Map(current.map(h => [h.id, h]));
                habits.forEach(h => mergedMap.set(h.id, h));
                await this.localProvider.saveHabits(Array.from(mergedMap.values()));
            }
            return habits;
        } catch (error) {
            if (this.handleAuthError(error)) return [];
            console.error('Error fetching habits:', error);
            return this.localProvider.getHabits(since);
        }
    }

    async saveHabits(habits: Habit[]): Promise<void> {
        await this.localProvider.saveHabits(habits);
        await this.executeOrQueue(
            { type: 'habits', data: habits },
            async () => { await habitsApi.save(habits); }
        );
    }

    // --- Habit Logs ---
    async getHabitLogs(since?: string): Promise<HabitLog[]> {
        if (!this.isOnline()) return this.localProvider.getHabitLogs(since);
        try {
            const habitLogs = await habitLogsApi.get(since) as HabitLog[];

            if (!since) {
                await this.localProvider.saveHabitLogs(habitLogs);
            } else if (habitLogs.length > 0) {
                const current = await this.localProvider.getHabitLogs();
                const mergedMap = new Map(current.map(l => [l.id, l]));
                habitLogs.forEach(l => mergedMap.set(l.id, l));
                await this.localProvider.saveHabitLogs(Array.from(mergedMap.values()));
            }
            return habitLogs;
        } catch (error) {
            if (this.handleAuthError(error)) return [];
            console.error('Error fetching habit_logs:', error);
            return this.localProvider.getHabitLogs(since);
        }
    }

    async saveHabitLogs(habitLogs: HabitLog[]): Promise<void> {
        await this.localProvider.saveHabitLogs(habitLogs);
        await this.executeOrQueue(
            { type: 'habitLogs', data: habitLogs },
            async () => { await habitLogsApi.save(habitLogs); }
        );
    }

    // --- Personal Notes ---
    async getPersonalNotes(): Promise<any> {
        if (!this.isOnline()) return this.localProvider.getPersonalNotes();
        try {
            const data = await personalNotesApi.get();

            if (data) {
                await this.localProvider.savePersonalNotes(data);
                return data;
            } else {
                return this.localProvider.getPersonalNotes();
            }
        } catch (error) {
            if (this.handleAuthError(error)) return null;
            console.error('Error fetching personal notes:', error);
            return this.localProvider.getPersonalNotes();
        }
    }

    async savePersonalNotes(data: any): Promise<void> {
        await this.localProvider.savePersonalNotes(data);
        await this.executeOrQueue(
            { type: 'personal_notes', data: data },
            async () => { await personalNotesApi.save(data); }
        );
    }

    // --- Generic Save ---
    async save(table: string, data: any[]): Promise<void> {
        switch (table) {
            case 'habits':
                await this.saveHabits(data);
                break;
            case 'habitLogs':
                await this.saveHabitLogs(data);
                break;
            default:
                console.warn(`CloudflareD1Provider: Unknown table ${table}`);
        }
    }

    async clearAll(): Promise<void> {
        // Safe implementation or empty
    }
}

// Export auth helpers for use in other modules
export { authApi, getStoredToken, getStoredUser };
