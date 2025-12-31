import { CATEGORY_LIST } from './constants';

export type Category = typeof CATEGORY_LIST[number];

export interface PriorityTask {
    id: string;
    text: string;
    completed: boolean;
    updatedAt?: string; // ISO date string
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
}

export interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export interface RoutineItem {
    id: string;
    startTime: string; // "HH:mm" 24h format
    endTime: string;   // "HH:mm" 24h format
    activity: string;
    category: Category | string; // Allow string for backward compatibility or custom categories
    completedAt?: string | null; // ISO date string of TODAY if completed today
    updatedAt?: string; // Timestamp of when it was checked
    description?: string; // Optional detailed description
}

export interface ActivityLog {
    id: string;
    timestamp: string; // ISO string
    type: 'text' | 'photo';
    content: string; // Caption or text body
    mediaId?: string; // ID for IndexedDB image if type is 'photo'
    category?: string; // Optional tag like 'Work', 'Chill', 'Ibadah'
}
