"use client";

import { CheckCircle2 } from "lucide-react";
import { Button } from "~/components/ui/button";

export function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-success/15">
        <CheckCircle2 className="size-9 animate-check-pop text-success" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome to GradeItRight.
        </h1>
        <p className="text-muted-foreground">
          You're done guessing. Let's get your grades set up so you always know
          exactly where you stand.
        </p>
      </div>
      <Button size="lg" onClick={onNext} className="w-full">
        Let's Go
      </Button>
    </div>
  );
}
