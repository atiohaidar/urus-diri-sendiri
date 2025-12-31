import { IStorageProvider } from '../storage-interface';
import { PriorityTask, Reflection, Note, RoutineItem, ActivityLog } from '../types';
import { STORAGE_KEYS } from '../constants';
import { getAllItems, putItem, deleteItem, IDB_STORES } from '../idb';

export class LocalStorageProvider implements IStorageProvider {

    // --- Priorities ---
    async getPriorities(): Promise<PriorityTask[]> {
        const data = localStorage.getItem(STORAGE_KEYS.PRIORITIES);
        return data ? JSON.parse(data) : [];
    }

    async savePriorities(priorities: PriorityTask[]): Promise<void> {
        localStorage.setItem(STORAGE_KEYS.PRIORITIES, JSON.stringify(priorities));
    }

    // --- Reflections ---
    async getReflections(): Promise<Reflection[]> {
        const reflections = await getAllItems<Reflection>(IDB_STORES.REFLECTIONS);
        // Sort by date descending
        reflections.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return reflections;
    }

    async saveReflection(reflection: Reflection): Promise<void> {
        await putItem(IDB_STORES.REFLECTIONS, reflection);
    }

    // --- Notes ---
    async getNotes(): Promise<Note[]> {
        const data = localStorage.getItem(STORAGE_KEYS.NOTES);
        return data ? JSON.parse(data) : [];
    }

    async saveNotes(notes: Note[]): Promise<void> {
        localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    }

    // --- Routines ---
    async getRoutines(): Promise<RoutineItem[]> {
        const data = localStorage.getItem(STORAGE_KEYS.ROUTINES);
        return data ? JSON.parse(data) : [];
    }

    async saveRoutines(routines: RoutineItem[]): Promise<void> {
        localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(routines));
    }

    // --- Logs ---
    async getLogs(): Promise<ActivityLog[]> {
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

    // --- Config / Utils ---
    async clearAll(): Promise<void> {
        localStorage.removeItem(STORAGE_KEYS.PRIORITIES);
        localStorage.removeItem(STORAGE_KEYS.NOTES);
        localStorage.removeItem(STORAGE_KEYS.ROUTINES);
        // Note: IDB clearing might be too aggressive for just "clearAll" locally if we want to preserve images, 
        // but typically a full reset means full reset.
        // For now, we'll leave IDB alone or implementing a specific clear method if requested.
    }
}
