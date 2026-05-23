import { IStorageProvider } from '../storage-interface';
import { PriorityTask, Reflection, Note, NoteHistory, RoutineItem, ActivityLog, Habit, HabitLog } from '../types';
import { STORAGE_KEYS } from '../constants';
import { getAllItems, putItem, putItems, deleteItem, IDB_STORES, getImage } from '../idb';

/**
 * ARCHITECTURE UPDATE: Fully async IndexedDB storage
 * 
 * Replaces old localStorage with IndexedDB:
 * 1. Solves 5-10MB quota limit.
 * 2. Provides consistent async API.
 * 3. Better data integrity for large datasets.
 */
export class LocalStorageProvider implements IStorageProvider {

    // --- Priorities ---
    async getPriorities(since?: string): Promise<PriorityTask[]> {
        return getAllItems<PriorityTask>(IDB_STORES.PRIORITIES);
    }

    async savePriorities(priorities: PriorityTask[], reason?: string): Promise<void> {
        // Since we want to keep current behavior of "replacing everything" for priorities locally,
        // we should ideally clear then put. But for now, putting items with same ID replaces them.
        // NOTE: If some items are deleted, we need to handle that. 
        // In this app, priorities are synced as a full set usually.
        await putItems(IDB_STORES.PRIORITIES, priorities);
    }

    async deletePriority(id: string): Promise<void> {
        await deleteItem(IDB_STORES.PRIORITIES, id);
    }

    // --- Reflections ---
    async getReflections(since?: string): Promise<Reflection[]> {
        const reflections = await getAllItems<Reflection>(IDB_STORES.REFLECTIONS);
        reflections.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return reflections;
    }

    async saveReflection(reflection: Reflection, reason?: string): Promise<void> {
        await putItem(IDB_STORES.REFLECTIONS, reflection);
    }

    // --- Notes ---
    async getNotes(since?: string): Promise<Note[]> {
        return getAllItems<Note>(IDB_STORES.NOTES);
    }

    async saveNote(note: Note): Promise<void> {
        await putItem(IDB_STORES.NOTES, note);
    }

    async saveNotes(notes: Note[]): Promise<void> {
        await putItems(IDB_STORES.NOTES, notes);
    }

    async deleteNote(id: string): Promise<void> {
        await deleteItem(IDB_STORES.NOTES, id);
    }

    // --- Note Histories ---
    async getNoteHistories(since?: string): Promise<NoteHistory[]> {
        const histories = await getAllItems<NoteHistory>(IDB_STORES.NOTE_HISTORIES);
        histories.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
        return histories;
    }

    async saveNoteHistory(history: NoteHistory): Promise<void> {
        await putItem(IDB_STORES.NOTE_HISTORIES, history);
    }

    async saveNoteHistories(histories: NoteHistory[]): Promise<void> {
        await putItems(IDB_STORES.NOTE_HISTORIES, histories);
    }

    // --- Routines ---
    async getRoutines(since?: string): Promise<RoutineItem[]> {
        return getAllItems<RoutineItem>(IDB_STORES.ROUTINES);
    }

    async saveRoutines(routines: RoutineItem[]): Promise<void> {
        await putItems(IDB_STORES.ROUTINES, routines);
    }

    async deleteRoutine(id: string): Promise<void> {
        await deleteItem(IDB_STORES.ROUTINES, id);
    }

    // --- Logs ---
    async getLogs(since?: string): Promise<ActivityLog[]> {
        const logs = await getAllItems<ActivityLog>(IDB_STORES.LOGS);
        logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return logs;
    }

    async saveLog(log: ActivityLog): Promise<void> {
        await putItem(IDB_STORES.LOGS, log);
    }

    async deleteLog(id: string): Promise<void> {
        await deleteItem(IDB_STORES.LOGS, id);
    }

    // --- Habits ---
    async getHabits(since?: string): Promise<Habit[]> {
        return getAllItems<Habit>(IDB_STORES.HABITS);
    }

    async saveHabits(habits: Habit[]): Promise<void> {
        await putItems(IDB_STORES.HABITS, habits);
    }

    // --- Habit Logs ---
    async getHabitLogs(since?: string): Promise<HabitLog[]> {
        return getAllItems<HabitLog>(IDB_STORES.HABIT_LOGS);
    }

    async saveHabitLogs(habitLogs: HabitLog[]): Promise<void> {
        await putItems(IDB_STORES.HABIT_LOGS, habitLogs);
    }

    // --- Generic Save ---
    async save(table: string, data: any[]): Promise<void> {
        switch (table) {
            case 'habits': await this.saveHabits(data); break;
            case 'habitLogs': await this.saveHabitLogs(data); break;
            case 'priorities': await this.savePriorities(data); break;
            case 'notes': await this.saveNotes(data); break;
            case 'routines': await this.saveRoutines(data); break;
            default:
                console.warn(`LocalStorageProvider: Unknown table ${table}`);
        }
    }

    // --- Personal Notes ---
    async getPersonalNotes(): Promise<any> {
        const items = await getAllItems<any>(IDB_STORES.PERSONAL_NOTES);
        return items.length > 0 ? items[0] : null;
    }

    async savePersonalNotes(data: any): Promise<void> {
        // Ensure only one personal_notes entry exists
        await putItem(IDB_STORES.PERSONAL_NOTES, { ...data, id: 'singleton_personal_notes' });
    }

    // --- Config / Utils ---
    async clearAll(): Promise<void> {
        // Implementation for clearing specific stores if needed
        const stores = Object.values(IDB_STORES);
        for (const store of stores) {
            if (store === IDB_STORES.IMAGES) continue; // Safety: don't wipe images on basic clear
            // Real clear would require clearing stores or deleting DB
        }
    }
}
