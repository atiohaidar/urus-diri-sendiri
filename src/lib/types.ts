import { CATEGORY_LIST } from './constants';

export type Category = typeof CATEGORY_LIST[number];

export interface PriorityTask {
    id: string;
    text: string;
    completed: boolean;
    completionNote?: string; // Note added when completed
    updatedAt?: string; // ISO date string
    deletedAt?: string | null; // For soft delete sync
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
    content: string;
    createdAt: string;
    updatedAt: string;
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
