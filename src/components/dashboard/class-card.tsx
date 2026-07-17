"use client";

import { Check, ChevronDown, MoreVertical, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { AssignmentDialog } from "~/components/dashboard/assignment-dialog";
import { QuarterOverrideDialog } from "~/components/dashboard/quarter-override-dialog";
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
import {
  calculateClassGrade,
  type GradeStatus,
  toLetterGrade,
} from "~/lib/grade-calculator";
import {
  getEffectiveQuarter,
  getQuarterStatus,
  QUARTER_ORDER,
} from "~/lib/quarter";
import { createClient } from "~/lib/supabase/client";
import type {
  AssignmentRow,
  ClassWithDetails,
  Quarter,
} from "~/lib/supabase/types";
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
  quarter,
  onSaved,
}: {
  assignment: AssignmentRow;
  classId: string;
  categories: ClassWithDetails["categories"];
  quarter: Quarter;
  onSaved: () => void;
}) {
  const catName = categoryName(categories, assignment.category_id);
  return (
    <AssignmentDialog
      classId={classId}
      categories={categories}
      assignment={assignment}
      quarter={quarter}
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

function AssignmentRowStatic({
  assignment,
  categories,
}: {
  assignment: AssignmentRow;
  categories: ClassWithDetails["categories"];
}) {
  const catName = categoryName(categories, assignment.category_id);
  return (
    <div className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground">
      <span className="flex flex-col">
        <span className="font-medium">{assignment.name}</span>
        {catName && <span className="text-xs">{catName}</span>}
      </span>
      <span className="text-sm">
        {assignment.points_earned} / {assignment.points_possible}
      </span>
    </div>
  );
}

function QuarterTabBar({
  cls,
  selectedQuarter,
  effectiveQuarter,
  onSelect,
}: {
  cls: ClassWithDetails;
  selectedQuarter: Quarter;
  effectiveQuarter: Quarter;
  onSelect: (quarter: Quarter) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {QUARTER_ORDER.map((quarter) => {
        const status = getQuarterStatus(quarter, effectiveQuarter);
        const isSelected = quarter === selectedQuarter;
        const completedGrade =
          status === "completed"
            ? calculateClassGrade(cls, quarter).currentGrade
            : null;
        const letter =
          status === "completed"
            ? completedGrade != null
              ? toLetterGrade(completedGrade)
              : "NG"
            : null;

        return (
          <button
            key={quarter}
            type="button"
            onClick={() => onSelect(quarter)}
            title={status === "upcoming" ? "Not Started Yet" : undefined}
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
              // Selected tab is black; unselected tabs stay visible in
              // their own state color: green for completed quarters, a
              // neutral chip for everything else.
              isSelected && "bg-foreground text-background",
              !isSelected &&
                status === "completed" &&
                "bg-success/15 text-success hover:bg-success/25",
              !isSelected &&
                status !== "completed" &&
                "bg-muted text-muted-foreground hover:bg-accent",
            )}
          >
            {status === "completed" && <Check className="size-3" />}
            {quarter}
            {letter && (
              <span
                className={cn(
                  "rounded px-1 text-[10px] font-semibold",
                  isSelected ? "bg-background/25" : "bg-success/20",
                )}
              >
                {letter}
              </span>
            )}
          </button>
        );
      })}
    </div>
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
  const effectiveQuarter = getEffectiveQuarter(cls, new Date());
  const [selectedQuarter, setSelectedQuarter] =
    useState<Quarter>(effectiveQuarter);

  // Follow the class's current quarter when it changes underneath us — a
  // sync or an override from another tab moves the card to the new quarter
  // instead of leaving the view stuck on the one from first render.
  useEffect(() => {
    setSelectedQuarter(effectiveQuarter);
  }, [effectiveQuarter]);

  const quarterStatus = getQuarterStatus(selectedQuarter, effectiveQuarter);
  const grade = calculateClassGrade(cls, selectedQuarter);
  const targetGrade =
    cls.target_grades.find((t) => t.quarter === selectedQuarter) ?? null;

  const quarterAssignments = cls.assignments.filter(
    (a) => a.quarter === selectedQuarter,
  );
  const completed = quarterAssignments
    .filter((a) => !a.is_remaining)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const remaining = quarterAssignments
    .filter((a) => a.is_remaining)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  async function handleTargetChange(value: number) {
    const supabase = createClient();
    if (targetGrade) {
      await supabase
        .from("target_grades")
        .update({ target_percentage: value })
        .eq("id", targetGrade.id);
    } else {
      await supabase.from("target_grades").insert({
        class_id: cls.id,
        quarter: selectedQuarter,
        target_percentage: value,
      });
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
        <QuarterTabBar
          cls={cls}
          selectedQuarter={selectedQuarter}
          effectiveQuarter={effectiveQuarter}
          onSelect={setSelectedQuarter}
        />

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
                <QuarterOverrideDialog
                  classId={cls.id}
                  currentOverride={cls.current_quarter_override}
                  onSaved={onChanged}
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      Change current quarter
                    </DropdownMenuItem>
                  }
                />
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

        {quarterStatus === "upcoming" ? (
          <p className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            Grades for this quarter will appear here when it begins.
          </p>
        ) : quarterStatus === "completed" ? (
          <>
            <p className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              This quarter is complete. Final grade:{" "}
              <span className="font-semibold text-foreground">
                {grade.currentGrade != null ? `${grade.currentGrade}%` : "—"}
              </span>
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Final grade</p>
                <p className="font-semibold">
                  {grade.currentGrade != null ? `${grade.currentGrade}%` : "—"}
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
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
          </>
        )}
      </CardHeader>

      {expanded && quarterStatus === "upcoming" && (
        <CardContent className="border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            Nothing to show yet — this quarter hasn&apos;t started.
          </p>
        </CardContent>
      )}

      {expanded && quarterStatus === "completed" && (
        <CardContent className="flex flex-col gap-4 border-t border-border pt-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Assignments</span>
            {completed.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">
                No assignments recorded for this quarter.
              </p>
            ) : (
              completed.map((assignment) => (
                <AssignmentRowStatic
                  key={assignment.id}
                  assignment={assignment}
                  categories={cls.categories}
                />
              ))
            )}
          </div>
        </CardContent>
      )}

      {expanded && quarterStatus === "current" && (
        <CardContent className="flex flex-col gap-4 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Target grade</span>
            <TargetGradeControl
              value={targetGrade?.target_percentage ?? null}
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
                quarter={selectedQuarter}
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
                  quarter={selectedQuarter}
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
                quarter={selectedQuarter}
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
                  quarter={selectedQuarter}
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
