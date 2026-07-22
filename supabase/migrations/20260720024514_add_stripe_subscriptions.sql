-- Stripe billing: subscription state lives in its own table (not on
-- profiles) so it can track status/trials/grace periods independently.
-- A trigger keeps profiles.is_premium in sync so existing gates (e.g.
-- /api/sync) need zero changes. Only the webhook (service-role) writes here.

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text not null unique,
  stripe_subscription_id text unique,
  status text not null,
  price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_stripe_customer_id_idx
  on public.subscriptions (stripe_customer_id);

alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own_authenticated" on public.subscriptions
  for select to authenticated
  using (user_id = auth.uid());

-- No insert/update/delete policies for authenticated: writes only happen
-- from the webhook handler using the service-role key, which bypasses RLS.

create or replace function public.sync_profile_premium()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set is_premium = (new.status in ('active', 'trialing'))
  where user_id = new.user_id;
  return new;
end;
$$;

drop trigger if exists subscriptions_sync_profile_premium on public.subscriptions;
create trigger subscriptions_sync_profile_premium
  after insert or update on public.subscriptions
  for each row
  execute function public.sync_profile_premium();

-- Rate-limit log for the (future) AI summary feature. Written by an
-- authenticated request, not a webhook, so unlike subscriptions users may
-- insert their own rows.
create table if not exists public.ai_summary_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  requested_at timestamptz not null default now()
);

create index if not exists ai_summary_usage_user_id_requested_at_idx
  on public.ai_summary_usage (user_id, requested_at desc);

alter table public.ai_summary_usage enable row level security;

create policy "ai_summary_usage_select_own_authenticated" on public.ai_summary_usage
  for select to authenticated
  using (user_id = auth.uid());

create policy "ai_summary_usage_insert_own_authenticated" on public.ai_summary_usage
  for insert to authenticated
  with check (user_id = auth.uid());
