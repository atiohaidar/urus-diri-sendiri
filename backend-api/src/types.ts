// Re-export shared types
export type {
  PriorityTask,
  Reflection,
  Note,
  NoteHistory,
  RoutineItem,
  ActivityLog,
  Habit,
  HabitLog,
  HabitFrequency,
  PersonalNotesData,
  PersonalNoteEntry,
  ApiResponse,
} from '../../shared/types';

// ============================================================
// Backend-only types (Cloudflare D1 / Hono specific)
// ============================================================
export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  ENVIRONMENT: string;
}

export interface User {
  id: string;
  email: string;
  password_hash?: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

// Auth types
export interface AuthPayload {
  userId: string;
  email: string;
  exp: number;
}

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}
