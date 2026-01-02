-- Habits Tracker Tables
-- Run this migration to add habits tracking functionality

-- Habits table
create table if not exists habits (
  id text primary key,
  name text not null,
  description text,
  icon text,
  color text,
  frequency text not null,  -- 'daily' | 'weekly' | 'every_n_days' | 'specific_days'
  interval integer,
  specific_days jsonb,      -- array of day numbers [0,1,2...]
  allowed_day_off integer default 1,
  is_archived boolean default false,
  created_at text,
  updated_at text,
  deleted_at text,
  user_id uuid references auth.users not null default auth.uid()
);

-- Habit logs table
create table if not exists habit_logs (
  id text primary key,
  habit_id text references habits(id) on delete cascade,
  date text not null,       -- YYYY-MM-DD
  completed boolean not null default true,
  completed_at text,
  note text,
  created_at text,
  updated_at text,
  deleted_at text,
  user_id uuid references auth.users not null default auth.uid()
);

-- RLS
alter table habits enable row level security;
alter table habit_logs enable row level security;

-- Policies
create policy "Manage own habits" on habits for all using (auth.uid() = user_id);
create policy "Manage own habit_logs" on habit_logs for all using (auth.uid() = user_id);

-- Indexes for faster queries
create index if not exists habit_logs_habit_id_date on habit_logs(habit_id, date);
create index if not exists habits_user_id on habits(user_id);
create index if not exists habit_logs_user_id on habit_logs(user_id);
