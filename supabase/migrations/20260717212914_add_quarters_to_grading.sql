-- Quarterly grading periods: scope assignments and target grades to a
-- school-year quarter (Q1 Aug-Oct, Q2 Nov-Jan, Q3 Feb-Mar, Q4 Apr-Jun) so a
-- student's Q1 performance doesn't affect Q2's calculation, and let a class
-- override which quarter is "current" instead of always trusting today's date.
--
-- No new tables are added, so no new RLS policies are needed: the existing
-- class-ownership policies on assignments/target_grades/classes already
-- cover these new columns.

-- Shared date -> quarter mapping, used for column defaults and backfill.
-- Mirrors src/lib/quarter.ts's getCurrentQuarterByDate (July, the summer
-- gap between quarters, maps to the upcoming Q1).
create or replace function public.current_school_quarter()
returns text
language sql
stable
as $$
  select case extract(month from now())::int
    when 8 then 'Q1'
    when 9 then 'Q1'
    when 10 then 'Q1'
    when 11 then 'Q2'
    when 12 then 'Q2'
    when 1 then 'Q2'
    when 2 then 'Q3'
    when 3 then 'Q3'
    when 4 then 'Q4'
    when 5 then 'Q4'
    when 6 then 'Q4'
    else 'Q1' -- July
  end;
$$;

-- assignments: add quarter, backfill existing rows, then enforce not null.
alter table public.assignments
  add column if not exists quarter text;

update public.assignments
set quarter = public.current_school_quarter()
where quarter is null;

alter table public.assignments
  alter column quarter set default public.current_school_quarter(),
  alter column quarter set not null;

alter table public.assignments
  drop constraint if exists assignments_quarter_check;
alter table public.assignments
  add constraint assignments_quarter_check check (quarter in ('Q1', 'Q2', 'Q3', 'Q4'));

create index if not exists assignments_class_id_quarter_idx
  on public.assignments (class_id, quarter);

-- target_grades: targets become per-quarter instead of one-per-class-ever.
alter table public.target_grades
  add column if not exists quarter text;

update public.target_grades
set quarter = public.current_school_quarter()
where quarter is null;

alter table public.target_grades
  alter column quarter set default public.current_school_quarter(),
  alter column quarter set not null;

alter table public.target_grades
  drop constraint if exists target_grades_quarter_check;
alter table public.target_grades
  add constraint target_grades_quarter_check check (quarter in ('Q1', 'Q2', 'Q3', 'Q4'));

alter table public.target_grades
  drop constraint if exists target_grades_class_id_key;
alter table public.target_grades
  drop constraint if exists target_grades_class_id_quarter_key;
alter table public.target_grades
  add constraint target_grades_class_id_quarter_key unique (class_id, quarter);

-- classes: null = auto-detect current quarter from today's date;
-- non-null = student's manual override of which quarter is "current".
alter table public.classes
  add column if not exists current_quarter_override text;

alter table public.classes
  drop constraint if exists classes_current_quarter_override_check;
alter table public.classes
  add constraint classes_current_quarter_override_check check (
    current_quarter_override is null
    or current_quarter_override in ('Q1', 'Q2', 'Q3', 'Q4')
  );
