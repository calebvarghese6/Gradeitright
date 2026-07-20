"use client";

import { CheckCircle2 } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { calculateClassGrade } from "~/lib/grade-calculator";
import { getEffectiveQuarter } from "~/lib/quarter";
import { completeOnboarding } from "~/lib/supabase/actions";
import type { ClassWithDetails } from "~/lib/supabase/types";

export function StepReady({
  createdClasses,
}: {
  createdClasses: ClassWithDetails[];
}) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-success/15">
        <CheckCircle2 className="size-9 text-success" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">You're all set.</h1>
        <p className="text-muted-foreground">
          Add your assignments and GradeItRight will tell you exactly what you
          need to hit your goal.
        </p>
      </div>

      {createdClasses.length > 0 && (
        <div className="flex w-full flex-col gap-3">
          {createdClasses.map((cls) => {
            const grade = calculateClassGrade(
              cls,
              getEffectiveQuarter(cls, new Date()),
            );
            return (
              <div
                key={cls.id}
                className="w-full rounded-lg border border-border p-4 text-left"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{cls.name}</span>
                  <Badge variant="outline">
                    {cls.grading_mode === "weighted" ? "Weighted" : "Points"}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current grade</span>
                  <span className="font-medium">
                    {grade.currentGrade != null
                      ? `${grade.currentGrade}%`
                      : "—"}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Target</span>
                  <span className="font-medium">
                    {grade.targetLabel ?? "—"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <form action={completeOnboarding} className="w-full">
        <Button type="submit" size="lg" className="w-full">
          Go to my dashboard
        </Button>
      </form>
    </div>
  );
}
