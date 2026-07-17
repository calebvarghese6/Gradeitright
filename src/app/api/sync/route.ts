import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "~/env";

const RATE_LIMIT_MS = 60 * 60 * 1000; // one sync per hour per user

const syncPayloadSchema = z.object({
  source: z.enum(["infinite_campus", "google_classroom"]),
  classes: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        assignments: z
          .array(
            z.object({
              name: z.string().min(1).max(300),
              pointsEarned: z.number().min(0).nullable(),
              pointsPossible: z.number().positive(),
            }),
          )
          .max(500),
      }),
    )
    .min(1)
    .max(50),
});

function normalize(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

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
          "Auto-sync is a premium feature. Upgrade your GradeItRight plan to enable it.",
      },
      { status: 403 },
    );
  }

  const { data: lastSync } = await supabase
    .from("syncs")
    .select("synced_at")
    .eq("user_id", user.id)
    .order("synced_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (
    lastSync &&
    Date.now() - new Date(lastSync.synced_at).getTime() < RATE_LIMIT_MS
  ) {
    return NextResponse.json(
      {
        error: "rate_limited",
        message: "Sync is limited to once per hour. Try again later.",
      },
      { status: 429 },
    );
  }

  let payload: z.infer<typeof syncPayloadSchema>;
  try {
    payload = syncPayloadSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Invalid sync payload" },
      { status: 400 },
    );
  }

  const { data: existingClasses, error: classesError } = await supabase
    .from("classes")
    .select("id, name, assignments(id, name)");

  if (classesError) {
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }

  const classesByName = new Map(
    (existingClasses ?? []).map((c) => [normalize(c.name), c]),
  );

  let recordsUpdated = 0;
  const needsReview: {
    type: "class" | "assignment";
    className: string;
    assignmentName?: string;
  }[] = [];

  for (const incomingClass of payload.classes) {
    const match = classesByName.get(normalize(incomingClass.name));

    if (!match) {
      // Never auto-create — flag for the student to review instead.
      needsReview.push({ type: "class", className: incomingClass.name });
      continue;
    }

    const assignmentsByName = new Map(
      (match.assignments ?? []).map((a) => [normalize(a.name), a]),
    );

    for (const incoming of incomingClass.assignments) {
      const assignment = assignmentsByName.get(normalize(incoming.name));

      if (!assignment) {
        needsReview.push({
          type: "assignment",
          className: incomingClass.name,
          assignmentName: incoming.name,
        });
        continue;
      }

      const { error: updateError } = await supabase
        .from("assignments")
        .update({
          points_earned: incoming.pointsEarned,
          points_possible: incoming.pointsPossible,
          is_remaining: incoming.pointsEarned == null,
        })
        .eq("id", assignment.id);

      if (!updateError) {
        recordsUpdated += 1;
      }
    }
  }

  const syncedAt = new Date().toISOString();
  const { error: logError } = await supabase.from("syncs").insert({
    user_id: user.id,
    synced_at: syncedAt,
    source: payload.source,
    records_updated: recordsUpdated,
  });

  if (logError) {
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    syncedAt,
    recordsUpdated,
    needsReview,
  });
}
