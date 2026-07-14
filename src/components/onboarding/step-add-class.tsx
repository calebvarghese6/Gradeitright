"use client";

import { ClassForm } from "~/components/dashboard/class-form";
import type { ClassWithDetails } from "~/lib/supabase/types";

export function StepAddClass({
  onCreated,
  onSkip,
}: {
  onCreated: (cls: ClassWithDetails) => void;
  onSkip: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Add your first class
        </h1>
        <p className="text-sm text-muted-foreground">
          Set it up once — GradeItRight takes it from here.
        </p>
      </div>
      <ClassForm
        submitLabel="Add Class"
        submittingLabel="Adding…"
        onCreated={onCreated}
      />
      <button
        type="button"
        onClick={onSkip}
        className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        I'll explore first — skip for now
      </button>
    </div>
  );
}
