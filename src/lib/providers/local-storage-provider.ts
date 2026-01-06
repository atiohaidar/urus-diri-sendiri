import { IStorageProvider } from '../storage-interface';
import { PriorityTask, Reflection, Note, RoutineItem, ActivityLog, Habit, HabitLog } from '../types';
import { STORAGE_KEYS } from '../constants';
import { getAllItems, putItem, deleteItem, IDB_STORES } from '../idb';

/**
 * TODO: ARCHITECTURE CONCERN - Hybrid Storage Inconsistency
 * 
 * Current State:
 * - Priorities, Notes, Routines, Habits: localStorage (sync, ~5-10MB limit)
 * - Reflections, Logs, Images: IndexedDB (async, larger capacity)
 * 
 * Issues:
 * 1. Inconsistent API behavior (sync vs async)
 * 2. localStorage can hit quota limits with large datasets
 * 3. Potential data loss on browser crash before IndexedDB commit
 * 
 * Recommendation: Migrate all data to IndexedDB for consistency.
 * This requires refactoring storage modules to handle async operations.
 */
export class LocalStorageProvider implements IStorageProvider {

    // --- Priorities ---
    async getPriorities(since?: string): Promise<PriorityTask[]> {
        // Local storage always returns full set, 'since' is ignored
        const data = localStorage.getItem(STORAGE_KEYS.PRIORITIES);
        return data ? JSON.parse(data) : [];
    }

    async savePriorities(priorities: PriorityTask[]): Promise<void> {
        localStorage.setItem(STORAGE_KEYS.PRIORITIES, JSON.stringify(priorities));
    }

    // --- Reflections ---
    async getReflections(since?: string): Promise<Reflection[]> {
        const reflections = await getAllItems<Reflection>(IDB_STORES.REFLECTIONS);
        // Sort by date descending
        reflections.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return reflections;
    }

    async saveReflection(reflection: Reflection): Promise<void> {
        await putItem(IDB_STORES.REFLECTIONS, reflection);
    }

    // --- Notes ---
    async getNotes(since?: string): Promise<Note[]> {
        const data = localStorage.getItem(STORAGE_KEYS.NOTES);
        return data ? JSON.parse(data) : [];
    }

    async saveNote(note: Note): Promise<void> {
        const notes = await this.getNotes();
        const index = notes.findIndex(n => n.id === note.id);
        if (index >= 0) {
            notes[index] = note;
        } else {
            notes.unshift(note);
        }
        await this.saveNotes(notes);
    }

    async saveNotes(notes: Note[]): Promise<void> {
        localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    }

    async deleteNote(id: string): Promise<void> {
        const notes = await this.getNotes();
        const filtered = notes.filter(n => n.id !== id);
        await this.saveNotes(filtered);
    }

    // --- Routines ---
    async getRoutines(since?: string): Promise<RoutineItem[]> {
        const data = localStorage.getItem(STORAGE_KEYS.ROUTINES);
        return data ? JSON.parse(data) : [];
    }

    async saveRoutines(routines: RoutineItem[]): Promise<void> {
        localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(routines));
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
        const data = localStorage.getItem(STORAGE_KEYS.HABITS);
        return data ? JSON.parse(data) : [];
    }

    async saveHabits(habits: Habit[]): Promise<void> {
        localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
    }

    // --- Habit Logs ---
    async getHabitLogs(since?: string): Promise<HabitLog[]> {
        const data = localStorage.getItem(STORAGE_KEYS.HABIT_LOGS);
        return data ? JSON.parse(data) : [];
    }

    async saveHabitLogs(habitLogs: HabitLog[]): Promise<void> {
        localStorage.setItem(STORAGE_KEYS.HABIT_LOGS, JSON.stringify(habitLogs));
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
            case 'priorities':
                await this.savePriorities(data);
                break;
            case 'notes':
                await this.saveNotes(data);
                break;
            case 'routines':
                await this.saveRoutines(data);
                break;
            default:
                console.warn(`LocalStorageProvider: Unknown table ${table}`);
        }
    }

    // --- Personal Notes ---
    async getPersonalNotes(): Promise<any> {
        const data = localStorage.getItem('personal_notes_data');
        return data ? JSON.parse(data) : null;
    }

    async savePersonalNotes(data: any): Promise<void> {
        localStorage.setItem('personal_notes_data', JSON.stringify(data));
    }

    // --- Config / Utils ---
    async clearAll(): Promise<void> {
        localStorage.removeItem(STORAGE_KEYS.PRIORITIES);
        localStorage.removeItem(STORAGE_KEYS.NOTES);
        localStorage.removeItem(STORAGE_KEYS.ROUTINES);
        localStorage.removeItem(STORAGE_KEYS.HABITS);
        localStorage.removeItem(STORAGE_KEYS.HABIT_LOGS);
        // Note: IDB clearing might be too aggressive for just "clearAll" locally if we want to preserve images, 
        // but typically a full reset means full reset.
        // For now, we'll leave IDB alone or implementing a specific clear method if requested.
    }
}

