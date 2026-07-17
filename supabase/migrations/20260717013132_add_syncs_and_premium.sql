-- Auto-sync support for the Chrome extension: log each sync run, and gate
-- the feature behind a premium subscription flag on profiles.

-- Premium flag lives on public.profiles (auth.users cannot be altered).
alter table public.profiles
  add column if not exists is_premium boolean not null default false;

create table if not exists public.syncs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  synced_at timestamptz not null default now(),
  source text not null check (source in ('infinite_campus', 'google_classroom')),
  records_updated integer not null default 0
);

-- Index for the per-user rate-limit lookup (latest sync per user).
create index if not exists syncs_user_id_synced_at_idx
  on public.syncs (user_id, synced_at desc);

alter table public.syncs enable row level security;

create policy "syncs_select_own_authenticated" on public.syncs
  for select to authenticated
  using (user_id = auth.uid());

create policy "syncs_insert_own_authenticated" on public.syncs
  for insert to authenticated
  with check (user_id = auth.uid());
