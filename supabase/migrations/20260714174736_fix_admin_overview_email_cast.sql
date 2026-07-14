-- Fix "structure of query does not match function result type" (42804).
-- auth.users.email is varchar, but the function's declared return type is
-- text; RETURN QUERY requires an exact structural match, so cast explicitly.

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
    u.email::text,
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
