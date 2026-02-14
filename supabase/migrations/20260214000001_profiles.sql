-- Profiles table (PRD §6.1): id matches auth.users.id, role, full_name, email
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('patient', 'provider')),
  full_name text,
  email text,
  created_at timestamptz not null default now()
);

-- RLS: users can read and update their own row; insert only for own id
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);
