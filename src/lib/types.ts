import { CATEGORY_LIST } from './constants';

export type Category = typeof CATEGORY_LIST[number];

export interface PriorityTask {
    id: string;
    text: string;
    completed: boolean;
}

export interface Reflection {
    id: string;
    date: string;
    winOfDay: string;
    hurdle: string;
    priorities: string[];
    smallChange: string;
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
}
