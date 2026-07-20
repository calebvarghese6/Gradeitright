"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { ClassForm } from "~/components/dashboard/class-form";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import type { ClassWithDetails } from "~/lib/supabase/types";

export function StepAddClass({
  classes,
  onAdd,
  onDone,
  onSkip,
}: {
  classes: ClassWithDetails[];
  onAdd: (cls: ClassWithDetails) => void;
  onDone: () => void;
  onSkip: () => void;
}) {
  const [showForm, setShowForm] = useState(classes.length === 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          {classes.length === 0 ? "Add your classes" : "Add another class?"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Set a target grade for each one — GradeItRight takes it from here.
        </p>
      </div>

      {classes.length > 0 && (
        <div className="flex flex-col gap-2">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
            >
              <span className="font-medium">{cls.name}</span>
              <Badge variant="outline">
                Target{" "}
                {cls.target_grades[0]
                  ? `${cls.target_grades[0].target_percentage}%`
                  : "—"}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <ClassForm
          submitLabel="Add class"
          submittingLabel="Adding…"
          onCreated={(cls) => {
            onAdd(cls);
            setShowForm(false);
          }}
        />
      ) : (
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowForm(true)}
          >
            <Plus className="size-4" />
            Add another class
          </Button>
          <Button type="button" onClick={onDone}>
            Continue
          </Button>
        </div>
      )}

      {classes.length === 0 && (
        <button
          type="button"
          onClick={onSkip}
          className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          I'll explore first — skip for now
        </button>
      )}
    </div>
  );
}
