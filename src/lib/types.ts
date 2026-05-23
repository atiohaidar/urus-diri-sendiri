// Re-export all shared types from single source of truth
export type {
    PriorityTask,
    Reflection,
    Note,
    NoteHistory,
    RoutineItem,
    ActivityLog,
    HabitFrequency,
    Habit,
    HabitLog,
    PersonalNoteEntry,
    PersonalNotesData,
    ApiResponse,
} from '../../shared/types';

import { CATEGORY_LIST } from './constants';

export type Category = typeof CATEGORY_LIST[number];

