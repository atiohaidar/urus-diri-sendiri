-- Create table for Personal Notes
create table if not exists public.personal_notes (
  user_id uuid references auth.users not null primary key,
  is_setup boolean default true,
  encrypted_data text not null,
  iv text not null,
  salt text not null,
  password_hash text not null,
  updated_at timestamptz default now()
);

-- RLS Policies
alter table public.personal_notes enable row level security;

-- Drop existing policy if exists to avoid error on rerun
drop policy if exists "Users can all their own personal notes" on public.personal_notes;

create policy "Users can all their own personal notes"
on public.personal_notes for all
using (auth.uid() = user_id);

-- Trigger for updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_personal_notes_updated on public.personal_notes;
create trigger on_personal_notes_updated
  before update on public.personal_notes
  for each row execute procedure public.handle_updated_at();

-- GRANT PERMISSIONS (CRITICAL FIX)
grant all on table public.personal_notes to authenticated;
grant all on table public.personal_notes to service_role;
