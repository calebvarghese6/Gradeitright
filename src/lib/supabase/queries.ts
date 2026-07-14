import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminUserOverview, ClassWithDetails } from "~/lib/supabase/types";

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
    .select("*, categories(*), assignments(*), target_grade:target_grades(*)")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const targetGrade = Array.isArray(row.target_grade)
      ? (row.target_grade[0] ?? null)
      : (row.target_grade ?? null);

    return {
      ...row,
      categories: row.categories ?? [],
      assignments: row.assignments ?? [],
      target_grade: targetGrade,
    };
  }) as ClassWithDetails[];
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
