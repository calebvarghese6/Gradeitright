import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "~/env";
import { getEffectiveQuarter, QUARTER_ORDER } from "~/lib/quarter";
import { checkIsAdmin } from "~/lib/supabase/queries";
import type { Quarter } from "~/lib/supabase/types";

const RATE_LIMIT_MS = 60 * 60 * 1000; // one sync per hour per user

const syncPayloadSchema = z.object({
  source: z.enum(["infinite_campus", "google_classroom"]),
  classes: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        gradingMode: z
          .enum(["points", "weighted"])
          .optional()
          .default("points"),
        categories: z
          .array(
            z.object({
              name: z.string().min(1).max(200),
              weightPercentage: z.number().min(0).max(100),
            }),
          )
          .max(20)
          .optional(),
        assignments: z
          .array(
            z.object({
              name: z.string().min(1).max(300),
              pointsEarned: z.number().min(0).nullable(),
              pointsPossible: z.number().positive(),
              categoryName: z.string().min(1).max(200).optional(),
              quarter: z.enum(["Q1", "Q2", "Q3", "Q4"]).optional(),
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

  // Admins bypass the premium gate and rate limit entirely — they need to
  // sync freely while testing/debugging, not wait behind the same limits
  // that apply to a student's own account.
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

  // Diagnostic: the raw grade data exactly as received, before any
  // matching, category creation, or grade math happens.
  console.log("[sync] raw payload received:", JSON.stringify(payload, null, 2));

  const { data: existingClasses, error: classesError } = await supabase
    .from("classes")
    .select(
      "id, name, grading_mode, current_quarter_override, categories(id, name, weight_percentage), assignments(id, name, category_id, quarter)",
    );

  if (classesError) {
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }

  const now = new Date();

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

    const wantsWeighted =
      incomingClass.gradingMode === "weighted" &&
      (incomingClass.categories?.length ?? 0) > 0;

    if (
      wantsWeighted &&
      match.grading_mode === "points" &&
      (match.categories?.length ?? 0) === 0
    ) {
      // Safe to upgrade: no manually configured category weighting exists
      // yet, so nothing is lost by switching this class to weighted mode.
      const { error: upgradeError } = await supabase
        .from("classes")
        .update({ grading_mode: "weighted" })
        .eq("id", match.id);
      if (!upgradeError) match.grading_mode = "weighted";
    }

    const categoriesByName = new Map(
      (match.categories ?? []).map((c) => [normalize(c.name), c]),
    );

    // Weighted classes need their categories to exist — an assignment
    // without a category carries no weight and silently vanishes from the
    // weighted grade, which is exactly the "grade is wrong" failure mode.
    if (match.grading_mode === "weighted") {
      for (const incomingCategory of incomingClass.categories ?? []) {
        if (categoriesByName.has(normalize(incomingCategory.name))) continue;

        const { data: createdCategory, error: createCategoryError } =
          await supabase
            .from("categories")
            .insert({
              class_id: match.id,
              name: incomingCategory.name,
              weight_percentage: incomingCategory.weightPercentage,
            })
            .select("id, name, weight_percentage")
            .single();
        if (!createCategoryError && createdCategory) {
          categoriesByName.set(
            normalize(createdCategory.name),
            createdCategory,
          );
        }
      }
    }

    // Match names per quarter — matching across all quarters would let a
    // sync overwrite a past quarter's completed record whenever a school
    // reuses assignment names.
    const effectiveQuarter = getEffectiveQuarter(match, now);
    const assignmentsByQuarter = new Map<
      string,
      Map<string, { id: string; category_id: string | null }>
    >();
    for (const a of match.assignments ?? []) {
      let byName = assignmentsByQuarter.get(a.quarter);
      if (!byName) {
        byName = new Map();
        assignmentsByQuarter.set(a.quarter, byName);
      }
      byName.set(normalize(a.name), a);
    }

    for (const incoming of incomingClass.assignments) {
      const quarter = incoming.quarter ?? effectiveQuarter;
      const assignment = assignmentsByQuarter
        .get(quarter)
        ?.get(normalize(incoming.name));
      const categoryId = incoming.categoryName
        ? (categoriesByName.get(normalize(incoming.categoryName))?.id ?? null)
        : null;

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
          // Attach the synced category so weighted classes actually count
          // this assignment; keep the existing one when the payload has no
          // category or the name doesn't match anything.
          category_id: categoryId ?? assignment.category_id,
        })
        .eq("id", assignment.id);

      if (!updateError) {
        recordsUpdated += 1;
      }
    }

    // The sync source is the source of truth for where the school year
    // actually is: the newest term carrying grades is the student's current
    // quarter. Move the class there so a Q2 sync shows Q2 on the dashboard.
    const syncedQuarters = incomingClass.assignments
      .map((a) => a.quarter)
      .filter((q): q is Quarter => q != null);
    if (syncedQuarters.length > 0) {
      const newestQuarter = syncedQuarters.reduce((max, q) =>
        QUARTER_ORDER.indexOf(q) > QUARTER_ORDER.indexOf(max) ? q : max,
      );
      if (match.current_quarter_override !== newestQuarter) {
        await supabase
          .from("classes")
          .update({ current_quarter_override: newestQuarter })
          .eq("id", match.id);
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
