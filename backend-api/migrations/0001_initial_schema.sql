-- Migration: Initial schema for Urus Diri Sendiri
-- Creates all tables needed for the application

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT, -- For email/password auth
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Sessions table for token management
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Priorities table
CREATE TABLE IF NOT EXISTS priorities (
  id TEXT PRIMARY KEY,
  text TEXT,
  completed INTEGER DEFAULT 0,
  updated_at TEXT,
  deleted_at TEXT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Routines table
CREATE TABLE IF NOT EXISTS routines (
  id TEXT PRIMARY KEY,
  start_time TEXT,
  end_time TEXT,
  activity TEXT,
  category TEXT,
  completed_at TEXT,
  updated_at TEXT,
  description TEXT,
  deleted_at TEXT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  title TEXT,
  content TEXT,
  category TEXT,
  created_at TEXT,
  updated_at TEXT,
  deleted_at TEXT,
  is_encrypted INTEGER DEFAULT 0,
  encryption_salt TEXT,
  encryption_iv TEXT,
  password_hash TEXT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Note histories table
CREATE TABLE IF NOT EXISTS note_histories (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL,
  title TEXT,
  content TEXT,
  saved_at TEXT,
  updated_at TEXT,
  deleted_at TEXT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Reflections table
CREATE TABLE IF NOT EXISTS reflections (
  id TEXT PRIMARY KEY,
  date TEXT,
  win_of_day TEXT,
  hurdle TEXT,
  priorities TEXT, -- JSON array
  small_change TEXT,
  today_routines TEXT, -- JSON array
  today_priorities TEXT, -- JSON array
  images TEXT, -- JSON array
  updated_at TEXT,
  deleted_at TEXT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Logs table
CREATE TABLE IF NOT EXISTS logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT,
  type TEXT,
  content TEXT,
  media_url TEXT,
  media_id TEXT,
  category TEXT,
  updated_at TEXT,
  deleted_at TEXT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Habits table
CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  frequency TEXT NOT NULL,
  interval_days INTEGER,
  specific_days TEXT, -- JSON array
  allowed_day_off INTEGER DEFAULT 1,
  target_count INTEGER DEFAULT 1,
  is_archived INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT,
  deleted_at TEXT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Habit logs table
CREATE TABLE IF NOT EXISTS habit_logs (
  id TEXT PRIMARY KEY,
  habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  completed INTEGER DEFAULT 1,
  completed_at TEXT,
  count INTEGER DEFAULT 1,
  note TEXT,
  created_at TEXT,
  updated_at TEXT,
  deleted_at TEXT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Personal notes table (encrypted blob storage)
CREATE TABLE IF NOT EXISTS personal_notes (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  is_setup INTEGER DEFAULT 1,
  encrypted_data TEXT NOT NULL,
  iv TEXT NOT NULL,
  salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_priorities_user_id ON priorities(user_id);
CREATE INDEX IF NOT EXISTS idx_priorities_updated_at ON priorities(updated_at);
CREATE INDEX IF NOT EXISTS idx_routines_user_id ON routines(user_id);
CREATE INDEX IF NOT EXISTS idx_routines_updated_at ON routines(updated_at);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at);
CREATE INDEX IF NOT EXISTS idx_note_histories_user_id ON note_histories(user_id);
CREATE INDEX IF NOT EXISTS idx_note_histories_note_id ON note_histories(note_id);
CREATE INDEX IF NOT EXISTS idx_reflections_user_id ON reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_reflections_date ON reflections(date);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_id ON habit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id_date ON habit_logs(habit_id, date);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
