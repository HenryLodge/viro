-- ============================================================
-- hospitals table (PRD §6.3)
-- Created first because patients.assigned_hospital_id references it
-- ============================================================
create table if not exists public.hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  lat float8 not null,
  lng float8 not null,
  total_capacity int not null default 0,
  available_beds int not null default 0,
  specialties jsonb not null default '[]'::jsonb,
  wait_time_minutes int not null default 0,
  contact_phone text,
  address text
);

alter table public.hospitals enable row level security;

create policy "Authenticated users can read hospitals"
  on public.hospitals for select
  to authenticated
  using (true);

-- ============================================================
-- patients table (PRD §6.2) — real-time enabled
-- ============================================================
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  full_name text,
  age int,
  symptoms jsonb not null default '[]'::jsonb,
  severity_flags jsonb not null default '[]'::jsonb,
  risk_factors jsonb not null default '[]'::jsonb,
  travel_history text,
  exposure_history text,
  triage_tier text check (triage_tier in ('critical', 'urgent', 'routine', 'self-care')),
  triage_reasoning text,
  risk_flags jsonb not null default '[]'::jsonb,
  assigned_hospital_id uuid references public.hospitals (id),
  status text not null default 'pending' check (status in ('pending', 'triaged', 'routed', 'admitted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.patients enable row level security;

-- Patients can read their own rows
create policy "Patients can read own records"
  on public.patients for select
  using (auth.uid() = user_id);

-- Providers can read all patient rows
create policy "Providers can read all patients"
  on public.patients for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'provider'
    )
  );

-- Users can insert rows for themselves
create policy "Users can insert own patient records"
  on public.patients for insert
  with check (auth.uid() = user_id);

-- Users can update their own rows
create policy "Users can update own patient records"
  on public.patients for update
  using (auth.uid() = user_id);

-- Enable Supabase Realtime on patients
alter publication supabase_realtime add table public.patients;

-- ============================================================
-- regions table (PRD §6.4) — for globe visualization
-- ============================================================
create table if not exists public.regions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  lat float8 not null,
  lng float8 not null,
  case_count int not null default 0,
  severity text not null default 'low' check (severity in ('low', 'moderate', 'high', 'critical')),
  anomaly_flag boolean not null default false,
  top_symptoms jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.regions enable row level security;

create policy "Authenticated users can read regions"
  on public.regions for select
  to authenticated
  using (true);
