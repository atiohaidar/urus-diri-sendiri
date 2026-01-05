-- 1. Hapus tabel lama agar bersih (Hati-hati: Data lama di tabel ini akan hilang)
drop table if exists logs;
drop table if exists reflections;
drop table if exists notes;
drop table if exists routines;
drop table if exists priorities;

-- 2. Buat ulang tabel dengan tipe data UUID yang benar
create table priorities (
  id text primary key,
  text text,
  completed boolean,
  updated_at text,
  user_id uuid references auth.users not null default auth.uid()
);

create table routines (
  id text primary key,
  start_time text,
  end_time text,
  activity text,
  category text,
  completed_at text,
  updated_at text,
  description text,
  user_id uuid references auth.users not null default auth.uid()
);

create table notes (
  id text primary key,
  title text,
  content text,
  category text,
  created_at text,
  updated_at text,
  user_id uuid references auth.users not null default auth.uid()
);

create table reflections (
  id text primary key,
  date text,
  win_of_day text,
  hurdle text,
  priorities jsonb,
  small_change text,
  today_routines jsonb,
  today_priorities jsonb,
  images text[],
  user_id uuid references auth.users not null default auth.uid()
);

create table logs (
  id text primary key,
  timestamp text,
  type text,
  content text,
  media_url text,
  category text,
  user_id uuid references auth.users not null default auth.uid()
);

-- 3. Aktifkan RLS
alter table priorities enable row level security;
alter table routines enable row level security;
alter table notes enable row level security;
alter table reflections enable row level security;
alter table logs enable row level security;

-- 4. Buat Kebijakan (Policies)
create policy "Manage own priorities" on priorities for all using (auth.uid() = user_id);
create policy "Manage own routines" on routines for all using (auth.uid() = user_id);
create policy "Manage own notes" on notes for all using (auth.uid() = user_id);
create policy "Manage own reflections" on reflections for all using (auth.uid() = user_id);
create policy "Manage own logs" on logs for all using (auth.uid() = user_id);

-- 5. Kebijakan Storage (Jika belum)
-- Pastikan bucket 'images' sudah ada di menu Storage