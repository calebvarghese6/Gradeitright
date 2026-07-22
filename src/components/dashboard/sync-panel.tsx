"use client";

import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { createClient } from "~/lib/supabase/client";
import { fetchClassesWithDetails } from "~/lib/supabase/queries";
import type { SyncSource } from "~/lib/supabase/types";

interface SyncResult {
  status: number;
  body: {
    success?: boolean;
    syncedAt?: string;
    recordsUpdated?: number;
    needsReview?: {
      type: "class" | "assignment";
      className: string;
      assignmentName?: string;
    }[];
    error?: string;
    message?: string;
  };
}

export function SyncPanel({
  source = "infinite_campus",
}: {
  source?: SyncSource;
}) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runSync() {
    setRunning(true);
    setResult(null);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("No active session — sign in again.");
        return;
      }

      const classes = await fetchClassesWithDetails(supabase);

      const payload = {
        source,
        classes: classes.map((cls) => ({
          name: cls.name,
          gradingMode: cls.grading_mode,
          ...(cls.grading_mode === "weighted"
            ? {
                categories: cls.categories.map((c) => ({
                  name: c.name,
                  weightPercentage: c.weight_percentage,
                })),
              }
            : {}),
          assignments: cls.assignments
            .filter((a) => !a.is_remaining && a.points_earned != null)
            .map((a) => ({
              name: a.name,
              pointsEarned: a.points_earned,
              pointsPossible: a.points_possible,
              quarter: a.quarter,
              ...(a.category_id
                ? {
                    categoryName: cls.categories.find(
                      (c) => c.id === a.category_id,
                    )?.name,
                  }
                : {}),
            })),
        })),
      };

      if (payload.classes.length === 0) {
        setError("Add at least one class before syncing.");
        return;
      }

      const response = await fetch("/api/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      setResult({
        status: response.status,
        body: await response.json().catch(() => ({})),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Button
        onClick={runSync}
        disabled={running}
        variant="success"
        className="self-start"
      >
        {running ? "Syncing…" : "Sync now"}
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {result && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Response</CardTitle>
            <Badge
              variant={result.status === 200 ? "secondary" : "destructive"}
            >
              HTTP {result.status}
            </Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {result.status === 200 && (
              <>
                <p>
                  Updated{" "}
                  <span className="font-semibold">
                    {result.body.recordsUpdated}
                  </span>{" "}
                  assignment grade
                  {result.body.recordsUpdated === 1 ? "" : "s"} at{" "}
                  {result.body.syncedAt
                    ? new Date(result.body.syncedAt).toLocaleTimeString()
                    : "—"}
                  .
                </p>
                {(result.body.needsReview?.length ?? 0) > 0 && (
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">
                      Flagged for review (not auto-created):
                    </p>
                    <ul className="list-inside list-disc text-muted-foreground">
                      {result.body.needsReview?.map((item) => (
                        <li
                          key={`${item.className}:${item.assignmentName ?? ""}`}
                        >
                          {item.type === "class"
                            ? `New class: ${item.className}`
                            : `New assignment in ${item.className}: ${item.assignmentName}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
            {result.status === 429 && (
              <p>{result.body.message ?? "Rate limited — try again later."}</p>
            )}
            {result.status === 403 && (
              <p>{result.body.message ?? "Upgrade required."}</p>
            )}
            {![200, 403, 429].includes(result.status) && (
              <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                {JSON.stringify(result.body, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
