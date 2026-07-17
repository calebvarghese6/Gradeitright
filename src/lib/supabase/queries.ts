import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AdminUserOverview,
  AssignmentRow,
  CategoryRow,
  ClassWithDetails,
  TargetGradeRow,
} from "~/lib/supabase/types";

export async function fetchOnboardingCompleted(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data?.onboarding_completed ?? false;
}

export async function fetchClassesWithDetails(
  supabase: SupabaseClient,
): Promise<ClassWithDetails[]> {
  const { data, error } = await supabase
    .from("classes")
    .select("*, categories(*), assignments(*), target_grades(*)")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    ...row,
    // Postgres `numeric` columns come back from PostgREST as strings (to
    // avoid float precision loss), which silently turns `+` into string
    // concatenation in the grade calculator's reduces. Coerce here once.
    categories: (row.categories ?? []).map((c: CategoryRow) => ({
      ...c,
      weight_percentage: Number(c.weight_percentage),
    })),
    assignments: (row.assignments ?? []).map((a: AssignmentRow) => ({
      ...a,
      points_earned: a.points_earned == null ? null : Number(a.points_earned),
      points_possible: Number(a.points_possible),
    })),
    target_grades: (row.target_grades ?? []).map((t: TargetGradeRow) => ({
      ...t,
      target_percentage: Number(t.target_percentage),
    })),
  })) as ClassWithDetails[];
}

export async function checkIsAdmin(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function fetchAdminUserOverview(
  supabase: SupabaseClient,
): Promise<AdminUserOverview[]> {
  const { data, error } = await supabase.rpc("admin_list_users_with_classes");

  if (error) throw error;
  return (data ?? []) as AdminUserOverview[];
}
