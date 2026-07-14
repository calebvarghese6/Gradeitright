-- Admin role and an aggregated overview of users + what they've created.
-- Promoting a user to admin is a manual backend operation (insert a row
-- here directly) — there is no self-service or UI path to grant admin.

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- A user may only check their own admin status; nobody can list all
-- admins or grant/revoke admin through the client.
create policy "admins_select_own_authenticated" on public.admins
  for select to authenticated
  using (user_id = auth.uid());

-- Aggregated read of every user and the classes they've created, gated on
-- admin membership inside the function (SECURITY DEFINER bypasses the
-- per-user RLS on auth.users / public.classes so the admin can see
-- everyone's data, but only after the admin check passes).
create or replace function public.admin_list_users_with_classes()
returns table (
  user_id uuid,
  email text,
  user_created_at timestamptz,
  classes jsonb
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.admins a where a.user_id = auth.uid()
  ) then
    raise exception 'not authorized';
  end if;

  return query
  select
    u.id,
    u.email,
    u.created_at,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'grading_mode', c.grading_mode,
          'created_at', c.created_at,
          'assignment_count', (
            select count(*) from public.assignments a2 where a2.class_id = c.id
          )
        )
        order by c.created_at
      ) filter (where c.id is not null),
      '[]'::jsonb
    ) as classes
  from auth.users u
  left join public.classes c on c.user_id = u.id
  group by u.id, u.email, u.created_at
  order by u.created_at desc;
end;
$$;

revoke all on function public.admin_list_users_with_classes() from public;
grant execute on function public.admin_list_users_with_classes() to authenticated;
