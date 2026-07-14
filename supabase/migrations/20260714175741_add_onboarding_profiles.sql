-- Track per-user onboarding completion so first-time users can be routed
-- through the onboarding flow before reaching the dashboard.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own_authenticated" on public.profiles
  for select to authenticated
  using (user_id = auth.uid());

create policy "profiles_insert_own_authenticated" on public.profiles
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "profiles_update_own_authenticated" on public.profiles
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, onboarding_completed)
  values (new.id, false)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill existing users: anyone who already has a class has effectively
-- already been through the product, so don't force them into onboarding.
insert into public.profiles (user_id, onboarding_completed)
select u.id, exists (select 1 from public.classes c where c.user_id = u.id)
from auth.users u
on conflict (user_id) do nothing;
