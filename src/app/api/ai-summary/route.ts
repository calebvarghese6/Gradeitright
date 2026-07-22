import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { env } from "~/env";
import { checkIsAdmin } from "~/lib/supabase/queries";

const WEEKLY_LIMIT = 5;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return NextResponse.json(
      { error: "Missing bearer token" },
      { status: 401 },
    );
  }

  // Client scoped to the caller's token so every query runs under their RLS.
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Admins bypass the premium gate and rate limit, same as /api/sync.
  const isAdmin = await checkIsAdmin(supabase, user.id);

  if (!isAdmin) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile?.is_premium) {
      return NextResponse.json(
        {
          error: "upgrade_required",
          message:
            "AI summaries are a premium feature. Upgrade your GradeItRight plan to enable them.",
        },
        { status: 403 },
      );
    }

    const weekAgo = new Date(Date.now() - WEEK_MS).toISOString();
    const { count } = await supabase
      .from("ai_summary_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("requested_at", weekAgo);

    if ((count ?? 0) >= WEEKLY_LIMIT) {
      return NextResponse.json(
        {
          error: "rate_limited",
          message: `AI summaries are limited to ${WEEKLY_LIMIT} per week. Try again later.`,
        },
        { status: 429 },
      );
    }
  }

  const { error: logError } = await supabase
    .from("ai_summary_usage")
    .insert({ user_id: user.id });

  if (logError) {
    return NextResponse.json({ error: "Failed to log usage" }, { status: 500 });
  }

  // Gating is fully wired up; the actual generation (provider/model choice,
  // prompt design over grade data) is separate follow-up work.
  return NextResponse.json(
    {
      error: "not_implemented",
      message: "AI summary generation is not yet implemented.",
    },
    { status: 501 },
  );
}
