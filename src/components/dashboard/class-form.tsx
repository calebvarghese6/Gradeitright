"use client";

import { Plus, X } from "lucide-react";
import type * as React from "react";
import { useState } from "react";
import { TargetGradeControl } from "~/components/dashboard/target-grade-control";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { createClient } from "~/lib/supabase/client";
import type { ClassWithDetails, GradingMode } from "~/lib/supabase/types";
import { cn } from "~/lib/utils";

interface CategoryDraft {
  id: string;
  name: string;
  weight: string;
}

function makeCategoryDraft(): CategoryDraft {
  return { id: crypto.randomUUID(), name: "", weight: "" };
}

function makeEmptyCategories(): CategoryDraft[] {
  return [makeCategoryDraft(), makeCategoryDraft()];
}

export function ClassForm({
  onCreated,
  submitLabel = "Create class",
  submittingLabel = "Creating…",
}: {
  onCreated: (cls: ClassWithDetails) => void;
  submitLabel?: string;
  submittingLabel?: string;
}) {
  const [name, setName] = useState("");
  const [mode, setMode] = useState<GradingMode>("points");
  const [categories, setCategories] =
    useState<CategoryDraft[]>(makeEmptyCategories);
  const [target, setTarget] = useState(80);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weightTotal = categories.reduce(
    (sum, c) => sum + (Number(c.weight) || 0),
    0,
  );

  function updateCategory(index: number, patch: Partial<CategoryDraft>) {
    setCategories((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    );
  }

  function addCategory() {
    setCategories((prev) => [...prev, makeCategoryDraft()]);
  }

  function removeCategory(index: number) {
    setCategories((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Give your class a name.");
      return;
    }

    const cleanCategories = categories
      .map((c) => ({ name: c.name.trim(), weight: Number(c.weight) || 0 }))
      .filter((c) => c.name.length > 0);

    if (mode === "weighted") {
      if (cleanCategories.length === 0) {
        setError("Add at least one category.");
        return;
      }
      const total = cleanCategories.reduce((sum, c) => sum + c.weight, 0);
      if (Math.round(total) !== 100) {
        setError(`Category weights must add up to 100 (currently ${total}).`);
        return;
      }
    }

    setSubmitting(true);
    const supabase = createClient();

    const { data: newClass, error: classError } = await supabase
      .from("classes")
      .insert({ name: name.trim(), grading_mode: mode })
      .select()
      .single();

    if (classError || !newClass) {
      setError(classError?.message ?? "Could not create class.");
      setSubmitting(false);
      return;
    }

    let insertedCategories: ClassWithDetails["categories"] = [];
    if (mode === "weighted") {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .insert(
          cleanCategories.map((c) => ({
            class_id: newClass.id,
            name: c.name,
            weight_percentage: c.weight,
          })),
        )
        .select();

      if (categoriesError) {
        setError(categoriesError.message);
        setSubmitting(false);
        return;
      }
      insertedCategories = categoriesData ?? [];
    }

    const { data: targetData, error: targetError } = await supabase
      .from("target_grades")
      .insert({ class_id: newClass.id, target_percentage: target })
      .select()
      .single();

    if (targetError) {
      setError(targetError.message);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    onCreated({
      ...newClass,
      categories: insertedCategories,
      assignments: [],
      target_grade: targetData ?? null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="class-name">Class name</Label>
        <Input
          id="class-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="AP Biology"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Grading mode</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode("points")}
            className={cn(
              "rounded-md border px-3 py-2 text-left text-sm transition-colors",
              mode === "points"
                ? "border-primary bg-primary/5 font-medium"
                : "border-border text-muted-foreground hover:bg-accent",
            )}
          >
            Simple points
          </button>
          <button
            type="button"
            onClick={() => setMode("weighted")}
            className={cn(
              "rounded-md border px-3 py-2 text-left text-sm transition-colors",
              mode === "weighted"
                ? "border-primary bg-primary/5 font-medium"
                : "border-border text-muted-foreground hover:bg-accent",
            )}
          >
            Weighted categories
          </button>
        </div>
      </div>

      {mode === "weighted" && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label>Categories</Label>
            <span
              className={cn(
                "text-xs",
                Math.round(weightTotal) === 100
                  ? "text-success"
                  : "text-muted-foreground",
              )}
            >
              {weightTotal}% of 100%
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {categories.map((category, index) => (
              <div key={category.id} className="flex items-center gap-2">
                <Input
                  value={category.name}
                  onChange={(e) =>
                    updateCategory(index, { name: e.target.value })
                  }
                  placeholder="Homework"
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={category.weight}
                  onChange={(e) =>
                    updateCategory(index, { weight: e.target.value })
                  }
                  placeholder="%"
                  className="w-20"
                  min={0}
                  max={100}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeCategory(index)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCategory}
            className="self-start"
          >
            <Plus className="size-4" />
            Add category
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label>Target grade</Label>
        <TargetGradeControl value={target} onChange={setTarget} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? submittingLabel : submitLabel}
      </Button>
    </form>
  );
}
