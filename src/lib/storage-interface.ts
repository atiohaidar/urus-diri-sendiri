import { PriorityTask, Reflection, Note, RoutineItem, ActivityLog } from './types';

export interface IStorageProvider {
    // Priorities
    getPriorities(): Promise<PriorityTask[]>;
    savePriorities(priorities: PriorityTask[]): Promise<void>;

    // Reflections
    getReflections(): Promise<Reflection[]>;
    saveReflection(reflection: Reflection): Promise<void>; // Expects full object with ID

    // Notes
    getNotes(): Promise<Note[]>;
    saveNotes(notes: Note[]): Promise<void>;

    // Routines
    getRoutines(): Promise<RoutineItem[]>;
    saveRoutines(routines: RoutineItem[]): Promise<void>;

    // Logs
    getLogs(): Promise<ActivityLog[]>;
    saveLog(log: ActivityLog): Promise<void>;
    deleteLog(id: string): Promise<void>;

    // Generic/Config
    clearAll?(): Promise<void>;
}
