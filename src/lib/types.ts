import { CATEGORY_LIST } from './constants';

export type Category = typeof CATEGORY_LIST[number];

export interface PriorityTask {
    id: string;
    text: string;
    completed: boolean;
    completionNote?: string; // Note added when completed
    updatedAt?: string; // ISO date string
    scheduledFor?: string; // "YYYY-MM-DD" - Date when this priority becomes active
    deletedAt?: string | null; // For soft delete sync
    calendarEventId?: string; // Native calendar event ID for sync tracking
}

export interface Reflection {
    id: string;
    date: string;
    winOfDay: string;
    hurdle: string;
    priorities: string[]; // This is for tomorrow's plan
    smallChange: string;
    // Snapshots of today's progress
    todayRoutines?: RoutineItem[];
    todayPriorities?: PriorityTask[];
    images?: string[]; // Base64 strings (Legacy) or URLs
    imageIds?: string[]; // IDs for IndexedDB
    updatedAt?: string; // For sync
    deletedAt?: string | null; // For soft delete
}

export interface Note {
    id: string;
    title: string;
    content: string; // Encrypted if isEncrypted=true
    category: string | null;  // null = tanpa kategori
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;

    // Encryption fields
    isEncrypted?: boolean;
    encryptionSalt?: string;
    encryptionIv?: string;
    passwordHash?: string;
}

export interface NoteHistory {
    id: string;
    noteId: string;
    title: string;
    content: string; // Snapshot of content at this version
    savedAt: string; // ISO timestamp when this version was saved
    createdAt: string;
    updatedAt?: string;
    deletedAt?: string | null;
}

export interface RoutineItem {
    id: string;
    startTime: string; // "HH:mm" 24h format
    endTime: string;   // "HH:mm" 24h format
    activity: string;
    category: Category | string; // Allow string for backward compatibility or custom categories
    completedAt?: string | null; // ISO date string of TODAY if completed today
    completionNote?: string; // Note added when completed
    updatedAt?: string; // Timestamp of when it was checked
    description?: string; // Optional detailed description
    deletedAt?: string | null;
    calendarEventId?: string; // Native calendar event ID for sync tracking
}

export interface ActivityLog {
    id: string;
    timestamp: string; // ISO string
    type: 'text' | 'photo';
    content: string; // Caption or text body
    mediaId?: string; // ID for IndexedDB image if type is 'photo'
    category?: string; // Optional tag like 'Work', 'Chill', 'Ibadah'
    updatedAt?: string; // For sync
    deletedAt?: string | null;
}

// --- Habits Tracker ---

export type HabitFrequency = 'daily' | 'weekly' | 'every_n_days' | 'specific_days';

export interface Habit {
    id: string;
    name: string;
    description?: string;
    icon?: string; // emoji like "💪" or "📚"
    color?: string; // hex color for personalization

    // Frequency Configuration
    frequency: HabitFrequency;
    interval?: number;        // For 'every_n_days' (e.g., 3 = every 3 days)
    specificDays?: number[];  // For 'specific_days' (0=Sunday, 1=Monday, etc.)

    // Streak Settings
    allowedDayOff?: number;   // How many days can skip without breaking streak (default: 1)

    // Target/Goal (optional - null means infinity)
    targetCount?: number | null; // Target completion count (e.g., 30 = complete 30 times then done)

    // Tracking
    createdAt: string;
    updatedAt?: string;
    deletedAt?: string | null;
    isArchived?: boolean;     // Soft archive instead of delete
}

export interface HabitLog {
    id: string;
    habitId: string;
    date: string;             // "YYYY-MM-DD" - the date being tracked
    completed: boolean;
    completedAt?: string;     // ISO timestamp when checked in
    note?: string;            // Optional note

    // Metadata
    createdAt: string;
    updatedAt?: string;
    deletedAt?: string | null;
}

// --- Personal Notes (Encrypted) ---

export interface PersonalNoteEntry {
    id: string;
    label: string;      // e.g., "NIM", "Alamat Rumah", "Rekening BCA"
    value: string;      // e.g., "123456789", "Jl. Contoh No. 123"
    createdAt: string;
    updatedAt: string;
}

export interface PersonalNotesData {
    isSetup: boolean;           // true if user has setup password
    passwordHash: string;       // SHA-256 hash for validation
    encryptedData: string;      // Encrypted JSON of PersonalNoteEntry[]
    salt: string;               // For PBKDF2 key derivation
    iv: string;                 // For AES-GCM encryption
    updatedAt: string;
}

