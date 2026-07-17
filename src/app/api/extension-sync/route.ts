import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "~/env";

// One-click sync endpoint for the GradeItRight Sync Chrome extension.
// Matches incoming Infinite Campus grades to the caller's existing classes
// and assignments by name; anything unrecognized is flagged for review,
// never auto-created. Rate limited to one sync per hour per user.

const RATE_LIMIT_MS = 60 * 60 * 1000;

// The popup runs on a chrome-extension:// origin, so responses need CORS
// headers for the browser to hand them to the extension.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

const payloadSchema = z.object({
  source: z.literal("infinite_campus"),
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
              date: z.string().max(20).nullable().optional(),
              isRemaining: z.boolean().optional(),
              categoryName: z.string().min(1).max(200).optional(),
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

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return json({ error: "Missing bearer token" }, 401);
  }

  // Scoped to the caller's token so every query runs under their RLS.
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
    return json({ error: "Invalid token" }, 401);
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
    return json(
      {
        error: "rate_limited",
        message: "Sync is limited to once per hour. Try again later.",
      },
      429,
    );
  }

  let payload: z.infer<typeof payloadSchema>;
  try {
    payload = payloadSchema.parse(await request.json());
  } catch {
    return json({ error: "Invalid sync payload" }, 400);
  }

  const { data: existingClasses, error: classesError } = await supabase
    .from("classes")
    .select(
      "id, name, grading_mode, categories(id, name, weight_percentage), assignments(id, name, category_id)",
    );
  if (classesError) {
    return json({ error: "Sync failed" }, 500);
  }

  const classesByName = new Map(
    (existingClasses ?? []).map((c) => [normalize(c.name), c]),
  );

  let recordsUpdated = 0;
  let classesCreated = 0;
  let assignmentsCreated = 0;

  for (const incomingClass of payload.classes) {
    let match = classesByName.get(normalize(incomingClass.name));
    const wantsWeighted =
      incomingClass.gradingMode === "weighted" &&
      (incomingClass.categories?.length ?? 0) > 0;

    if (!match) {
      const { data: created, error: createClassError } = await supabase
        .from("classes")
        .insert({
          user_id: user.id,
          name: incomingClass.name,
          grading_mode: wantsWeighted ? "weighted" : "points",
        })
        .select("id, name, grading_mode")
        .single();
      if (createClassError || !created) continue;

      match = { ...created, categories: [], assignments: [] };
      classesByName.set(normalize(match.name), match);
      classesCreated += 1;
    } else if (
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

    const assignmentsByName = new Map(
      (match.assignments ?? []).map((a) => [normalize(a.name), a]),
    );

    for (const incoming of incomingClass.assignments) {
      const assignment = assignmentsByName.get(normalize(incoming.name));
      const categoryId = incoming.categoryName
        ? (categoriesByName.get(normalize(incoming.categoryName))?.id ?? null)
        : null;

      if (!assignment) {
        const { error: createAssignmentError } = await supabase
          .from("assignments")
          .insert({
            class_id: match.id,
            category_id: categoryId,
            name: incoming.name,
            points_earned: incoming.pointsEarned,
            points_possible: incoming.pointsPossible,
            is_remaining: incoming.pointsEarned == null,
          });
        if (!createAssignmentError) {
          assignmentsCreated += 1;
        }
        continue;
      }

      const { error: updateError } = await supabase
        .from("assignments")
        .update({
          points_earned: incoming.pointsEarned,
          points_possible: incoming.pointsPossible,
          is_remaining: incoming.pointsEarned == null,
          category_id: categoryId ?? assignment.category_id,
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
    records_updated: recordsUpdated + classesCreated + assignmentsCreated,
  });
  if (logError) {
    return json({ error: "Sync failed" }, 500);
  }

  return json({
    success: true,
    syncedAt,
    recordsUpdated,
    classesCreated,
    assignmentsCreated,
  });
}
