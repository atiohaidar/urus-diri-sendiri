// ============================================================
// Shared Types — Single Source of Truth
// Used by both frontend and backend-api
// ============================================================

// --- Priorities ---
export interface PriorityTask {
    id: string;
    text: string;
    completed: boolean;
    completionNote?: string;
    updatedAt?: string;
    scheduledFor?: string;
    deletedAt?: string | null;
    calendarEventId?: string;
}

// --- Reflections ---
export interface Reflection {
    id: string;
    date: string;
    winOfDay: string;
    hurdle: string;
    priorities: string[];
    smallChange: string;
    todayRoutines?: RoutineItem[];
    todayPriorities?: PriorityTask[];
    images?: string[];
    imageIds?: string[];
    updatedAt?: string;
    deletedAt?: string | null;
}

// --- Notes ---
export interface Note {
    id: string;
    title: string;
    content: string;
    category: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
    isEncrypted?: boolean;
    encryptionSalt?: string;
    encryptionIv?: string;
    passwordHash?: string;
}

// --- Note Histories ---
export interface NoteHistory {
    id: string;
    noteId: string;
    title: string;
    content: string;
    savedAt: string;
    createdAt: string;
    updatedAt?: string;
    deletedAt?: string | null;
}

// --- Routines ---
export interface RoutineItem {
    id: string;
    startTime: string;
    endTime: string;
    activity: string;
    category: string;
    completedAt?: string | null;
    completionNote?: string;
    updatedAt?: string;
    description?: string;
    deletedAt?: string | null;
    calendarEventId?: string;
}

// --- Activity Logs ---
export interface ActivityLog {
    id: string;
    timestamp: string;
    type: 'text' | 'photo' | string;
    content: string;
    mediaUrl?: string;
    mediaId?: string;
    category?: string;
    updatedAt?: string;
    deletedAt?: string | null;
}

// --- Habits ---
export type HabitFrequency = 'daily' | 'weekly' | 'every_n_days' | 'specific_days';

export interface Habit {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    frequency: HabitFrequency | string;
    interval?: number;
    specificDays?: number[];
    allowedDayOff?: number;
    targetCount?: number | null;
    isArchived?: boolean;
    createdAt: string;
    updatedAt?: string;
    deletedAt?: string | null;
}

// --- Habit Logs ---
export interface HabitLog {
    id: string;
    habitId: string;
    date: string;
    completed: boolean;
    completedAt?: string;
    count?: number;
    note?: string;
    createdAt: string;
    updatedAt?: string;
    deletedAt?: string | null;
}

// --- Personal Notes (Encrypted) ---
export interface PersonalNoteEntry {
    id: string;
    label: string;
    value: string;
    createdAt: string;
    updatedAt: string;
}

export interface PersonalNotesData {
    isSetup: boolean;
    passwordHash: string;
    encryptedData: string;
    salt: string;
    iv: string;
    updatedAt: string;
}

// --- API Response ---
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
