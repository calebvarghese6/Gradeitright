"use client";

import { ChevronDown, MoreVertical, Plus } from "lucide-react";
import { useState } from "react";
import { AssignmentDialog } from "~/components/dashboard/assignment-dialog";
import { TargetGradeControl } from "~/components/dashboard/target-grade-control";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { calculateClassGrade, type GradeStatus } from "~/lib/grade-calculator";
import { createClient } from "~/lib/supabase/client";
import type { AssignmentRow, ClassWithDetails } from "~/lib/supabase/types";
import { cn } from "~/lib/utils";

const STATUS_DOT: Record<GradeStatus, string> = {
  green: "bg-success",
  yellow: "bg-warning",
  red: "bg-destructive",
  none: "bg-muted-foreground/40",
};

function categoryName(
  categories: ClassWithDetails["categories"],
  id: string | null,
) {
  if (!id) return null;
  return categories.find((c) => c.id === id)?.name ?? null;
}

function AssignmentRowView({
  assignment,
  classId,
  categories,
  onSaved,
}: {
  assignment: AssignmentRow;
  classId: string;
  categories: ClassWithDetails["categories"];
  onSaved: () => void;
}) {
  const catName = categoryName(categories, assignment.category_id);
  return (
    <AssignmentDialog
      classId={classId}
      categories={categories}
      assignment={assignment}
      onSaved={onSaved}
      trigger={
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
        >
          <span className="flex flex-col">
            <span className="font-medium">{assignment.name}</span>
            {catName && (
              <span className="text-xs text-muted-foreground">{catName}</span>
            )}
          </span>
          <span className="text-sm text-muted-foreground">
            {assignment.is_remaining
              ? `— / ${assignment.points_possible}`
              : `${assignment.points_earned} / ${assignment.points_possible}`}
          </span>
        </button>
      }
    />
  );
}

export function ClassCard({
  cls,
  onChanged,
}: {
  cls: ClassWithDetails;
  onChanged: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const grade = calculateClassGrade(cls);

  const completed = cls.assignments
    .filter((a) => !a.is_remaining)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const remaining = cls.assignments
    .filter((a) => a.is_remaining)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  async function handleTargetChange(value: number) {
    const supabase = createClient();
    if (cls.target_grade) {
      await supabase
        .from("target_grades")
        .update({ target_percentage: value })
        .eq("id", cls.target_grade.id);
    } else {
      await supabase
        .from("target_grades")
        .insert({ class_id: cls.id, target_percentage: value });
    }
    onChanged();
  }

  async function handleDeleteClass() {
    if (!window.confirm(`Delete ${cls.name}? This can't be undone.`)) return;
    const supabase = createClient();
    await supabase.from("classes").delete().eq("id", cls.id);
    onChanged();
  }

  return (
    <Card className="overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "size-2.5 shrink-0 rounded-full",
                STATUS_DOT[grade.status],
              )}
              aria-hidden
            />
            <div>
              <h3 className="font-semibold leading-tight">{cls.name}</h3>
              <Badge variant="outline" className="mt-1 text-[11px]">
                {cls.grading_mode === "weighted" ? "Weighted" : "Points"}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={handleDeleteClass}
                >
                  Delete class
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setExpanded((v) => !v)}
            >
              <ChevronDown
                className={cn(
                  "size-4 transition-transform",
                  expanded && "rotate-180",
                )}
              />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Current</p>
            <p className="font-semibold">
              {grade.currentGrade != null ? `${grade.currentGrade}%` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Target</p>
            <p className="font-semibold">{grade.targetLabel ?? "—"}</p>
          </div>
          {grade.requiredScore != null && (
            <div>
              <p className="text-xs text-muted-foreground">Need on rest</p>
              <p className="font-semibold">{grade.requiredScore}%</p>
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground">{grade.summary}</p>
      </CardHeader>

      {expanded && (
        <CardContent className="flex flex-col gap-4 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Target grade</span>
            <TargetGradeControl
              value={cls.target_grade?.target_percentage ?? null}
              onChange={handleTargetChange}
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Assignments</span>
              <AssignmentDialog
                classId={cls.id}
                categories={cls.categories}
                defaultIsRemaining={false}
                onSaved={onChanged}
                trigger={
                  <Button variant="outline" size="sm">
                    <Plus className="size-4" />
                    Add
                  </Button>
                }
              />
            </div>
            {completed.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">
                No completed assignments yet.
              </p>
            ) : (
              completed.map((assignment) => (
                <AssignmentRowView
                  key={assignment.id}
                  assignment={assignment}
                  classId={cls.id}
                  categories={cls.categories}
                  onSaved={onChanged}
                />
              ))
            )}
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Remaining</span>
              <AssignmentDialog
                classId={cls.id}
                categories={cls.categories}
                defaultIsRemaining={true}
                onSaved={onChanged}
                trigger={
                  <Button variant="outline" size="sm">
                    <Plus className="size-4" />
                    Add
                  </Button>
                }
              />
            </div>
            {remaining.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">
                Nothing left logged yet.
              </p>
            ) : (
              remaining.map((assignment) => (
                <AssignmentRowView
                  key={assignment.id}
                  assignment={assignment}
                  classId={cls.id}
                  categories={cls.categories}
                  onSaved={onChanged}
                />
              ))
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
