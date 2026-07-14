-- Grade tracking core schema: classes, categories, assignments, target grades.
-- Lets a student track classes, log assignments, and calculate the score
-- needed on remaining work to hit a target grade.

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  grading_mode text not null check (grading_mode in ('points', 'weighted')),
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  name text not null,
  weight_percentage numeric not null check (
    weight_percentage >= 0
    and weight_percentage <= 100
  ),
  created_at timestamptz not null default now()
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  points_earned numeric,
  points_possible numeric not null check (points_possible > 0),
  is_remaining boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.target_grades (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null unique references public.classes (id) on delete cascade,
  target_percentage numeric not null check (
    target_percentage >= 0
    and target_percentage <= 100
  ),
  created_at timestamptz not null default now()
);

-- Indexes on columns referenced by the RLS policies below.
create index if not exists classes_user_id_idx on public.classes (user_id);
create index if not exists categories_class_id_idx on public.categories (class_id);
create index if not exists assignments_class_id_idx on public.assignments (class_id);
create index if not exists target_grades_class_id_idx on public.target_grades (class_id);

alter table public.classes enable row level security;
alter table public.categories enable row level security;
alter table public.assignments enable row level security;
alter table public.target_grades enable row level security;

-- classes: ownership is a direct column check.
create policy "classes_select_authenticated" on public.classes
  for select to authenticated
  using (user_id = auth.uid());

create policy "classes_insert_authenticated" on public.classes
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "classes_update_authenticated" on public.classes
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "classes_delete_authenticated" on public.classes
  for delete to authenticated
  using (user_id = auth.uid());

-- categories: ownership is derived from the parent class.
create policy "categories_select_authenticated" on public.categories
  for select to authenticated
  using (
    exists (
      select 1 from public.classes c
      where c.id = categories.class_id and c.user_id = auth.uid()
    )
  );

create policy "categories_insert_authenticated" on public.categories
  for insert to authenticated
  with check (
    exists (
      select 1 from public.classes c
      where c.id = categories.class_id and c.user_id = auth.uid()
    )
  );

create policy "categories_update_authenticated" on public.categories
  for update to authenticated
  using (
    exists (
      select 1 from public.classes c
      where c.id = categories.class_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.classes c
      where c.id = categories.class_id and c.user_id = auth.uid()
    )
  );

create policy "categories_delete_authenticated" on public.categories
  for delete to authenticated
  using (
    exists (
      select 1 from public.classes c
      where c.id = categories.class_id and c.user_id = auth.uid()
    )
  );

-- assignments: ownership is derived from the parent class.
create policy "assignments_select_authenticated" on public.assignments
  for select to authenticated
  using (
    exists (
      select 1 from public.classes c
      where c.id = assignments.class_id and c.user_id = auth.uid()
    )
  );

create policy "assignments_insert_authenticated" on public.assignments
  for insert to authenticated
  with check (
    exists (
      select 1 from public.classes c
      where c.id = assignments.class_id and c.user_id = auth.uid()
    )
  );

create policy "assignments_update_authenticated" on public.assignments
  for update to authenticated
  using (
    exists (
      select 1 from public.classes c
      where c.id = assignments.class_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.classes c
      where c.id = assignments.class_id and c.user_id = auth.uid()
    )
  );

create policy "assignments_delete_authenticated" on public.assignments
  for delete to authenticated
  using (
    exists (
      select 1 from public.classes c
      where c.id = assignments.class_id and c.user_id = auth.uid()
    )
  );

-- target_grades: ownership is derived from the parent class.
create policy "target_grades_select_authenticated" on public.target_grades
  for select to authenticated
  using (
    exists (
      select 1 from public.classes c
      where c.id = target_grades.class_id and c.user_id = auth.uid()
    )
  );

create policy "target_grades_insert_authenticated" on public.target_grades
  for insert to authenticated
  with check (
    exists (
      select 1 from public.classes c
      where c.id = target_grades.class_id and c.user_id = auth.uid()
    )
  );

create policy "target_grades_update_authenticated" on public.target_grades
  for update to authenticated
  using (
    exists (
      select 1 from public.classes c
      where c.id = target_grades.class_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.classes c
      where c.id = target_grades.class_id and c.user_id = auth.uid()
    )
  );

create policy "target_grades_delete_authenticated" on public.target_grades
  for delete to authenticated
  using (
    exists (
      select 1 from public.classes c
      where c.id = target_grades.class_id and c.user_id = auth.uid()
    )
  );

-- Stream row changes to subscribed clients for real-time dashboard updates.
alter publication supabase_realtime add table
  public.classes,
  public.categories,
  public.assignments,
  public.target_grades;
