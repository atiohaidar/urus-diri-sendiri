import { PriorityTask, Reflection, Note, RoutineItem, ActivityLog, Habit, HabitLog } from './types';

export interface IStorageProvider {
    // Priorities
    getPriorities(since?: string): Promise<PriorityTask[]>;
    savePriorities(priorities: PriorityTask[]): Promise<void>;

    // Reflections
    getReflections(since?: string): Promise<Reflection[]>;
    saveReflection(reflection: Reflection): Promise<void>; // Expects full object with ID

    // Notes
    getNotes(since?: string): Promise<Note[]>;
    saveNotes(notes: Note[]): Promise<void>;

    // Routines
    getRoutines(since?: string): Promise<RoutineItem[]>;
    saveRoutines(routines: RoutineItem[]): Promise<void>;

    // Logs
    getLogs(since?: string): Promise<ActivityLog[]>;
    saveLog(log: ActivityLog): Promise<void>;
    deleteLog(id: string): Promise<void>;

    // Habits
    getHabits?(since?: string): Promise<Habit[]>;
    saveHabits?(habits: Habit[]): Promise<void>;

    // Habit Logs
    getHabitLogs?(since?: string): Promise<HabitLog[]>;
    saveHabitLogs?(habitLogs: HabitLog[]): Promise<void>;

    // Generic save (for new tables without specific methods)
    save?(table: string, data: any[]): Promise<void>;

    // Generic/Config
    clearAll?(): Promise<void>;

    // Personal Notes (Encrypted Blob)
    getPersonalNotes?(): Promise<any>; // Returns PersonalNotesData | null
    savePersonalNotes?(data: any): Promise<void>; // Takes PersonalNotesData
}

