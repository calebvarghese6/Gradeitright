"use client";

import type * as React from "react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { createClient } from "~/lib/supabase/client";
import type { AssignmentRow, CategoryRow } from "~/lib/supabase/types";

export function AssignmentDialog({
  trigger,
  classId,
  categories,
  assignment,
  defaultIsRemaining,
  onSaved,
}: {
  trigger: React.ReactNode;
  classId: string;
  categories: CategoryRow[];
  assignment?: AssignmentRow;
  defaultIsRemaining?: boolean;
  onSaved: () => void;
}) {
  const isEdit = !!assignment;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(assignment?.name ?? "");
  const [categoryId, setCategoryId] = useState(
    assignment?.category_id ?? categories[0]?.id ?? "",
  );
  const [isRemaining, setIsRemaining] = useState(
    assignment?.is_remaining ?? defaultIsRemaining ?? false,
  );
  const [pointsEarned, setPointsEarned] = useState(
    assignment?.points_earned != null ? String(assignment.points_earned) : "",
  );
  const [pointsPossible, setPointsPossible] = useState(
    assignment?.points_possible != null
      ? String(assignment.points_possible)
      : "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setName(assignment?.name ?? "");
    setCategoryId(assignment?.category_id ?? categories[0]?.id ?? "");
    setIsRemaining(assignment?.is_remaining ?? defaultIsRemaining ?? false);
    setPointsEarned(
      assignment?.points_earned != null ? String(assignment.points_earned) : "",
    );
    setPointsPossible(
      assignment?.points_possible != null
        ? String(assignment.points_possible)
        : "",
    );
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Give the assignment a name.");
      return;
    }
    const possible = Number(pointsPossible);
    if (!possible || possible <= 0) {
      setError("Points possible must be greater than 0.");
      return;
    }
    if (categories.length > 0 && !categoryId) {
      setError("Choose a category.");
      return;
    }
    const earned = isRemaining ? null : Number(pointsEarned);
    if (!isRemaining && (pointsEarned === "" || Number.isNaN(earned))) {
      setError("Points earned is required for a completed assignment.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const payload = {
      class_id: classId,
      category_id: categories.length > 0 ? categoryId : null,
      name: name.trim(),
      points_earned: earned,
      points_possible: possible,
      is_remaining: isRemaining,
    };

    const { error: saveError } = isEdit
      ? await supabase
          .from("assignments")
          .update(payload)
          .eq("id", assignment.id)
      : await supabase.from("assignments").insert(payload);

    if (saveError) {
      setError(saveError.message);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setOpen(false);
    resetForm();
    onSaved();
  }

  async function handleDelete() {
    if (!assignment) return;
    setSubmitting(true);
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("assignments")
      .delete()
      .eq("id", assignment.id);

    if (deleteError) {
      setError(deleteError.message);
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    setOpen(false);
    resetForm();
    onSaved();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit assignment" : "Add assignment"}
          </DialogTitle>
          <DialogDescription>
            {isRemaining
              ? "Remaining assignments only need a name and point value."
              : "Log the points you earned on completed work."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="assignment-name">Name</Label>
            <Input
              id="assignment-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Midterm exam"
              required
            />
          </div>

          {categories.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isRemaining}
              onChange={(e) => setIsRemaining(e.target.checked)}
              className="size-4 rounded border-input accent-primary"
            />
            This hasn&apos;t happened yet (remaining assignment)
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="points-earned">Points earned</Label>
              <Input
                id="points-earned"
                type="number"
                min={0}
                value={pointsEarned}
                onChange={(e) => setPointsEarned(e.target.value)}
                disabled={isRemaining}
                placeholder="—"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="points-possible">Points possible</Label>
              <Input
                id="points-possible"
                type="number"
                min={0}
                value={pointsPossible}
                onChange={(e) => setPointsPossible(e.target.value)}
                required
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="sm:justify-between">
            {isEdit && (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleDelete}
                disabled={submitting}
              >
                Delete
              </Button>
            )}
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
