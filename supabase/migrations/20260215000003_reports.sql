create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  audience text not null check (audience in ('government', 'hospital', 'technical')),
  scope text not null default 'full',
  sections jsonb not null default '[]'::jsonb,
  summary text not null,
  generated_by uuid references public.profiles (id),
  patient_count int not null default 0,
  cluster_count int not null default 0,
  date_range_start timestamptz,
  date_range_end timestamptz,
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

create policy "Providers can read all reports"
  on public.reports for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'provider'
    )
  );

create policy "Providers can insert reports"
  on public.reports for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'provider'
    )
  );
