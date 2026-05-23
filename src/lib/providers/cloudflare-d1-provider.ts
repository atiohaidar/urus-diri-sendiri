import { IStorageProvider } from '../storage-interface';
import { PriorityTask, Reflection, Note, NoteHistory, RoutineItem, ActivityLog, Habit, HabitLog } from '../types';
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
    syncApi,
} from '../api/cloudflare-api';

/**
 * CloudflareD1Provider — ONLINE-FIRST Architecture
 *
 * Source of truth: Backend API (Cloudflare D1)
 * - GET  → Always fetch from API. Throw on error.
 * - SAVE → Always send to API first. Throw on error.
 * - No local IndexedDB cache, no offline queue.
 * - Guest/offline users should use LocalStorageProvider instead.
 */
export class CloudflareD1Provider implements IStorageProvider {

    // ============================================================
    // Unified Sync (full fetch from API)
    // ============================================================
    async syncAll(since?: string): Promise<any> {
        console.log("Unified Sync: Fetching all data from API...");
        const result = await syncApi.getAll(since);
        return result;
    }

    // ============================================================
    // Private helpers
    // ============================================================
    private handleError(error: any): never {
        if (error && (error.message?.includes('Unauthorized') || error.message?.includes('401'))) {
            console.warn('Auth session expired or invalid:', error);
            import('sonner').then(({ toast }) => {
                toast.warning("Sesi login berakhir", {
                    description: "Silakan login kembali.",
                    action: {
                        label: "Refresh",
                        onClick: () => window.location.reload()
                    }
                });
            });
        }
        throw error;
    }

    // ============================================================
    // Priorities
    // ============================================================
    async getPriorities(since?: string): Promise<PriorityTask[]> {
        try { return await prioritiesApi.get(since); }
        catch (e) { this.handleError(e); }
    }
    async savePriorities(priorities: PriorityTask[], reason = 'Unknown'): Promise<void> {
        try { await prioritiesApi.save(priorities); }
        catch (e) { this.handleError(e); }
    }
    async deletePriority(id: string): Promise<void> {
        try { await prioritiesApi.delete(id); }
        catch (e) { this.handleError(e); }
    }

    // ============================================================
    // Routines
    // ============================================================
    async getRoutines(since?: string): Promise<RoutineItem[]> {
        try { return await routinesApi.get(since); }
        catch (e) { this.handleError(e); }
    }
    async saveRoutines(routines: RoutineItem[]): Promise<void> {
        try { await routinesApi.save(routines); }
        catch (e) { this.handleError(e); }
    }
    async deleteRoutine(id: string): Promise<void> {
        try { await routinesApi.delete(id); }
        catch (e) { this.handleError(e); }
    }

    // ============================================================
    // Notes
    // ============================================================
    async getNotes(since?: string): Promise<Note[]> {
        try { return await notesApi.get(since); }
        catch (e) { this.handleError(e); }
    }
    async saveNote(note: Note): Promise<void> {
        try { await notesApi.saveSingle(note); }
        catch (e) { this.handleError(e); }
    }
    async saveNotes(notes: Note[]): Promise<void> {
        try { await notesApi.save(notes); }
        catch (e) { this.handleError(e); }
    }
    async deleteNote(id: string): Promise<void> {
        try { await notesApi.delete(id); }
        catch (e) { this.handleError(e); }
    }

    // ============================================================
    // Note Histories
    // ============================================================
    async getNoteHistories(since?: string): Promise<NoteHistory[]> {
        try { return await noteHistoriesApi.get(since); }
        catch (e) { this.handleError(e); }
    }
    async saveNoteHistory(history: NoteHistory): Promise<void> {
        try { await noteHistoriesApi.save([history]); }
        catch (e) { this.handleError(e); }
    }
    async saveNoteHistories(histories: NoteHistory[]): Promise<void> {
        try { await noteHistoriesApi.save(histories); }
        catch (e) { this.handleError(e); }
    }

    // ============================================================
    // Reflections
    // ============================================================
    async getReflections(since?: string): Promise<Reflection[]> {
        try { return await reflectionsApi.get(since); }
        catch (e) { this.handleError(e); }
    }
    async saveReflection(reflection: Reflection, reason = 'Unknown'): Promise<void> {
        try { await reflectionsApi.save(reflection); }
        catch (e) { this.handleError(e); }
    }

    // ============================================================
    // Logs
    // ============================================================
    async getLogs(since?: string): Promise<ActivityLog[]> {
        try { return await logsApi.get(since); }
        catch (e) { this.handleError(e); }
    }
    async saveLog(log: ActivityLog): Promise<void> {
        try { await logsApi.save(log); }
        catch (e) { this.handleError(e); }
    }
    async deleteLog(id: string): Promise<void> {
        try { await logsApi.delete(id); }
        catch (e) { this.handleError(e); }
    }

    // ============================================================
    // Habits
    // ============================================================
    async getHabits(since?: string): Promise<Habit[]> {
        try { return await habitsApi.get(since); }
        catch (e) { this.handleError(e); }
    }
    async saveHabits(habits: Habit[]): Promise<void> {
        try { await habitsApi.save(habits); }
        catch (e) { this.handleError(e); }
    }

    // ============================================================
    // Habit Logs
    // ============================================================
    async getHabitLogs(since?: string): Promise<HabitLog[]> {
        try { return await habitLogsApi.get(since); }
        catch (e) { this.handleError(e); }
    }
    async saveHabitLogs(habitLogs: HabitLog[]): Promise<void> {
        try { await habitLogsApi.save(habitLogs); }
        catch (e) { this.handleError(e); }
    }

    // ============================================================
    // Personal Notes
    // ============================================================
    async getPersonalNotes(): Promise<any> {
        try { return await personalNotesApi.get(); }
        catch (e) { this.handleError(e); }
    }
    async savePersonalNotes(data: any): Promise<void> {
        try { await personalNotesApi.save(data); }
        catch (e) { this.handleError(e); }
    }

    // ============================================================
    // Generic Save (dispatch by table name)
    // ============================================================
    async save(table: string, data: any[]): Promise<void> {
        switch (table) {
            case 'habits': await this.saveHabits(data); break;
            case 'habitLogs': await this.saveHabitLogs(data); break;
            default: console.warn(`CloudflareD1Provider: Unknown table ${table}`);
        }
    }

    async clearAll(): Promise<void> {
        // No-op for cloud provider
    }
}

// Export auth helpers for use in other modules
export { authApi, getStoredToken, getStoredUser };
