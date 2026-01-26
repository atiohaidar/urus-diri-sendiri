// Types for Cloudflare D1 and Hono
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

export interface PriorityTask {
  id: string;
  text?: string;
  completed: boolean;
  updatedAt?: string;
  deletedAt?: string | null;
  user_id: string;
}

export interface RoutineItem {
  id: string;
  startTime?: string;
  endTime?: string;
  activity?: string;
  category?: string;
  completedAt?: string;
  updatedAt?: string;
  description?: string;
  deletedAt?: string | null;
  user_id: string;
}

export interface Note {
  id: string;
  title?: string;
  content?: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  isEncrypted?: boolean;
  encryptionSalt?: string;
  encryptionIv?: string;
  passwordHash?: string;
  user_id: string;
}

export interface NoteHistory {
  id: string;
  noteId: string;
  title?: string;
  content?: string;
  savedAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  user_id: string;
}

export interface Reflection {
  id: string;
  date?: string;
  winOfDay?: string;
  hurdle?: string;
  priorities?: any[];
  smallChange?: string;
  todayRoutines?: any[];
  todayPriorities?: any[];
  images?: string[];
  updatedAt?: string;
  deletedAt?: string | null;
  user_id: string;
}

export interface ActivityLog {
  id: string;
  timestamp?: string;
  type?: string;
  content?: string;
  mediaUrl?: string;
  mediaId?: string;
  category?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  user_id: string;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  frequency: string;
  interval?: number;
  specificDays?: number[];
  allowedDayOff?: number;
  targetCount?: number;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  user_id: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
  completedAt?: string;
  count?: number;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  user_id: string;
}

export interface PersonalNotes {
  user_id: string;
  isSetup: boolean;
  encryptedData: string;
  iv: string;
  salt: string;
  passwordHash: string;
  updatedAt?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
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
