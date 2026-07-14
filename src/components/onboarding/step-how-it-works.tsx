"use client";

import { BookOpen, Target, TrendingUp } from "lucide-react";
import { Button } from "~/components/ui/button";

const STEPS = [
  {
    icon: BookOpen,
    title: "Add your classes and current grades",
  },
  {
    icon: Target,
    title: "Set the grade you want to finish with",
  },
  {
    icon: TrendingUp,
    title: "See exactly what you need on every remaining assignment",
  },
];

export function StepHowItWorks({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-center text-2xl font-bold tracking-tight">
        How it works
      </h1>
      <div className="flex flex-col gap-3">
        {STEPS.map((s, i) => (
          <div
            key={s.title}
            className="flex items-start gap-4 rounded-lg border border-border p-4"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <s.icon className="size-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-muted-foreground">
                Step {i + 1}
              </span>
              <p className="text-sm font-medium">{s.title}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Most students set up their first class in under 2 minutes.
      </p>
      <Button size="lg" onClick={onNext} className="w-full">
        Got it, let's start
      </Button>
    </div>
  );
}
