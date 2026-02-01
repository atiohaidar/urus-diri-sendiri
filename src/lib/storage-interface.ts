import { PriorityTask, Reflection, Note, NoteHistory, RoutineItem, ActivityLog, Habit, HabitLog } from './types';

export interface IStorageProvider {
    // Priorities
    getPriorities(since?: string): Promise<PriorityTask[]>;
    savePriorities(priorities: PriorityTask[], reason?: string): Promise<void>;
    deletePriority(id: string): Promise<void>;

    // Reflections
    getReflections(since?: string): Promise<Reflection[]>;
    saveReflection(reflection: Reflection, reason?: string): Promise<void>; // Expects full object with ID

    // Notes
    getNotes(since?: string): Promise<Note[]>;
    saveNote(note: Note): Promise<void>;
    saveNotes(notes: Note[]): Promise<void>; // Keeps for batch operations
    deleteNote(id: string): Promise<void>;

    // Note Histories
    getNoteHistories?(since?: string): Promise<NoteHistory[]>;
    saveNoteHistory?(history: NoteHistory): Promise<void>;
    saveNoteHistories?(history: NoteHistory[]): Promise<void>;

    // Routines
    getRoutines(since?: string): Promise<RoutineItem[]>;
    saveRoutines(routines: RoutineItem[]): Promise<void>;
    deleteRoutine(id: string): Promise<void>;

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

