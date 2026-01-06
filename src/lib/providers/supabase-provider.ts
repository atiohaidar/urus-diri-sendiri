import { IStorageProvider } from '../storage-interface';
import { PriorityTask, Reflection, Note, RoutineItem, ActivityLog, Habit, HabitLog } from '../types';
import { supabase } from '../supabase';
import { LocalStorageProvider } from './local-storage-provider';
import { offlineQueue, QueueItem } from './offline-queue';

// Handlers
import { fetchPriorities, syncPriorities } from './supabase-handlers/priorities';
import { fetchReflections, syncReflection } from './supabase-handlers/reflections';
import { fetchNotes, syncNotes } from './supabase-handlers/notes';
import { fetchRoutines, syncRoutines } from './supabase-handlers/routines';
import { fetchLogs, syncLog, deleteRemoteLog } from './supabase-handlers/logs';
import { fetchHabits, syncHabits } from './supabase-handlers/habits';
import { fetchHabitLogs, syncHabitLogs } from './supabase-handlers/habit-logs';
import { fetchPersonalNotes, syncPersonalNotes } from './supabase-handlers/personal-notes';

export class SupabaseProvider implements IStorageProvider {

    private userIdPromise: Promise<string> | null = null;
    private localProvider = new LocalStorageProvider();

    constructor() {
        // Set up the queue processor
        offlineQueue.setProcessor(async (item: QueueItem) => {
            const userId = await this.getUserId();
            // Pass userId to handlers
            switch (item.type) {
                case 'priorities': await syncPriorities(userId, item.data); break;
                case 'reflection': await syncReflection(userId, item.data); break;
                case 'notes': await syncNotes(userId, item.data); break;
                case 'routines': await syncRoutines(userId, item.data); break;
                case 'log': await syncLog(userId, item.data); break;
                case 'delete_log': await deleteRemoteLog(userId, item.data); break;
                case 'habits': await syncHabits(userId, item.data); break;
                case 'habitLogs': await syncHabitLogs(userId, item.data); break;
                case 'personal_notes': await syncPersonalNotes(userId, item.data); break;
            }
        });

        // Try processing any pending items
        offlineQueue.process();
    }

    private async handleAuthError(error: any) {
        if (error && (error.code === 'PGRST301' || error.message?.includes('JWT') || error.status === 401)) {
            console.warn('Auth session expired or invalid, signing out...');
            this.userIdPromise = null;
            await supabase.auth.signOut();
            window.location.reload(); // Refresh to clear state
            return true;
        }
        return false;
    }

    // --- Helper Methods ---

    private isOnline() {
        return offlineQueue.isOnline();
    }

    private async executeOrQueue(item: QueueItem, fn: () => Promise<void>) {
        return offlineQueue.executeOrQueue(item, fn);
    }

    private async getUserId(): Promise<string> {
        if (this.userIdPromise) return this.userIdPromise;

        this.userIdPromise = (async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) return session.user.id;

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                // If not authenticated, we can't sync. Return a persistent error.
                // But for guest mode compatibility, we might return 'guest'.
                // However, guest data should not be synced to Supabase.
                console.warn("No authenticated user found for Supabase storage operation.");
                // Throw error to prevent sync attempts?
                // Or return 'guest' to fail gracefully at RLS level?
                // Let's stick to original behavior.
                return 'guest';
            }
            return user.id;
        })();

        return this.userIdPromise;
    }

    // --- Priorities ---
    async getPriorities(since?: string): Promise<PriorityTask[]> {
        if (!this.isOnline()) return this.localProvider.getPriorities(since);

        try {
            const userId = await this.getUserId();
            const priorities = await fetchPriorities(userId, since);

            // Cache Update Logic (Common pattern, maybe could be extracted too, but okay here)
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
            if (await this.handleAuthError(error)) return [];
            console.error('Error fetching priorities:', error);
            return this.localProvider.getPriorities(since);
        }
    }

    async savePriorities(priorities: PriorityTask[]): Promise<void> {
        await this.localProvider.savePriorities(priorities);
        await this.executeOrQueue(
            { type: 'priorities', data: priorities },
            async () => {
                const userId = await this.getUserId();
                await syncPriorities(userId, priorities);
            }
        );
    }

    // --- Reflections ---
    async getReflections(since?: string): Promise<Reflection[]> {
        if (!this.isOnline()) return this.localProvider.getReflections(since);
        try {
            const userId = await this.getUserId();
            const reflections = await fetchReflections(userId, since);

            if (!since) {
                for (const r of reflections) await this.localProvider.saveReflection(r);
            } else if (reflections.length > 0) {
                for (const r of reflections) await this.localProvider.saveReflection(r);
            }
            return reflections;
        } catch (error) {
            if (await this.handleAuthError(error)) return [];
            console.error('Error fetching reflections:', error);
            return this.localProvider.getReflections(since);
        }
    }

    async saveReflection(reflection: Reflection): Promise<void> {
        await this.localProvider.saveReflection(reflection);
        await this.executeOrQueue(
            { type: 'reflection', data: reflection },
            async () => {
                const userId = await this.getUserId();
                await syncReflection(userId, reflection);
            }
        );
    }

    // --- Notes ---
    async getNotes(since?: string): Promise<Note[]> {
        if (!this.isOnline()) return this.localProvider.getNotes(since);
        try {
            const userId = await this.getUserId();
            const notes = await fetchNotes(userId, since);

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
            if (await this.handleAuthError(error)) return [];
            return this.localProvider.getNotes(since);
        }
    }

    async saveNotes(notes: Note[]): Promise<void> {
        await this.localProvider.saveNotes(notes);
        await this.executeOrQueue(
            { type: 'notes', data: notes },
            async () => {
                const userId = await this.getUserId();
                await syncNotes(userId, notes);
            }
        );
    }

    // --- Routines ---
    async getRoutines(since?: string): Promise<RoutineItem[]> {
        if (!this.isOnline()) return this.localProvider.getRoutines(since);
        try {
            const userId = await this.getUserId();
            const routines = await fetchRoutines(userId, since);

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
            if (await this.handleAuthError(error)) return [];
            console.error('Error fetching routines:', error);
            return this.localProvider.getRoutines(since);
        }
    }

    async saveRoutines(routines: RoutineItem[]): Promise<void> {
        await this.localProvider.saveRoutines(routines);
        await this.executeOrQueue(
            { type: 'routines', data: routines },
            async () => {
                const userId = await this.getUserId();
                await syncRoutines(userId, routines);
            }
        );
    }

    // --- Logs ---
    async getLogs(since?: string): Promise<ActivityLog[]> {
        if (!this.isOnline()) return this.localProvider.getLogs(since);
        try {
            const userId = await this.getUserId();
            const logs = await fetchLogs(userId, since);

            if (!since) {
                for (const l of logs) await this.localProvider.saveLog(l);
            } else if (logs.length > 0) {
                for (const l of logs) await this.localProvider.saveLog(l);
            }
            return logs;
        } catch (error) {
            if (await this.handleAuthError(error)) return [];
            console.error('Error fetching logs:', error);
            return this.localProvider.getLogs(since);
        }
    }

    async saveLog(log: ActivityLog): Promise<void> {
        await this.localProvider.saveLog(log);
        await this.executeOrQueue(
            { type: 'log', data: log },
            async () => {
                const userId = await this.getUserId();
                await syncLog(userId, log);
            }
        );
    }

    async deleteLog(id: string): Promise<void> {
        await this.localProvider.deleteLog(id);
        await this.executeOrQueue(
            { type: 'delete_log', data: id },
            async () => {
                const userId = await this.getUserId();
                await deleteRemoteLog(userId, id);
            }
        );
    }

    // --- Habits ---
    async getHabits(since?: string): Promise<Habit[]> {
        if (!this.isOnline()) return this.localProvider.getHabits(since);
        try {
            const userId = await this.getUserId();
            const habits = await fetchHabits(userId, since);

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
            if (await this.handleAuthError(error)) return [];
            console.error('Error fetching habits:', error);
            return this.localProvider.getHabits(since);
        }
    }

    async saveHabits(habits: Habit[]): Promise<void> {
        await this.localProvider.saveHabits(habits);
        await this.executeOrQueue(
            { type: 'habits', data: habits },
            async () => {
                const userId = await this.getUserId();
                await syncHabits(userId, habits);
            }
        );
    }

    // --- Habit Logs ---
    async getHabitLogs(since?: string): Promise<HabitLog[]> {
        if (!this.isOnline()) return this.localProvider.getHabitLogs(since);
        try {
            const userId = await this.getUserId();
            const habitLogs = await fetchHabitLogs(userId, since);

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
            if (await this.handleAuthError(error)) return [];
            console.error('Error fetching habit_logs:', error);
            return this.localProvider.getHabitLogs(since);
        }
    }

    async saveHabitLogs(habitLogs: HabitLog[]): Promise<void> {
        await this.localProvider.saveHabitLogs(habitLogs);
        await this.executeOrQueue(
            { type: 'habitLogs', data: habitLogs },
            async () => {
                const userId = await this.getUserId();
                await syncHabitLogs(userId, habitLogs);
            }
        );
    }

    // --- Personal Notes ---
    async getPersonalNotes(): Promise<any> {
        if (!this.isOnline()) return this.localProvider.getPersonalNotes();
        try {
            const userId = await this.getUserId();
            const data = await fetchPersonalNotes(userId);

            if (data) {
                await this.localProvider.savePersonalNotes(data);
                return data;
            } else {
                return this.localProvider.getPersonalNotes();
            }
        } catch (error) {
            if (await this.handleAuthError(error)) return null;
            console.error('Error fetching personal notes:', error);
            return this.localProvider.getPersonalNotes();
        }
    }

    async savePersonalNotes(data: any): Promise<void> {
        await this.localProvider.savePersonalNotes(data);
        await this.executeOrQueue(
            { type: 'personal_notes', data: data },
            async () => {
                const userId = await this.getUserId();
                await syncPersonalNotes(userId, data);
            }
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
                console.warn(`SupabaseProvider: Unknown table ${table}`);
        }
    }

    async clearAll(): Promise<void> {
        // Safe implementation or empty
    }
}
