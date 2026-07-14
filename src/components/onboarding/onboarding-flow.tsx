"use client";

import { useEffect, useState } from "react";
import { OnboardingProgress } from "~/components/onboarding/onboarding-progress";
import { StepAddClass } from "~/components/onboarding/step-add-class";
import { StepHowItWorks } from "~/components/onboarding/step-how-it-works";
import { StepReady } from "~/components/onboarding/step-ready";
import { StepWelcome } from "~/components/onboarding/step-welcome";
import { Card, CardContent } from "~/components/ui/card";
import type { ClassWithDetails } from "~/lib/supabase/types";
import { cn } from "~/lib/utils";

const TOTAL_STEPS = 4;
const TRANSITION_MS = 200;

type TransitionPhase = "idle" | "leaving" | "entering";

export function OnboardingFlow({ userId }: { userId: string }) {
  const storageKey = `gradeitright:onboarding-step:${userId}`;
  const [step, setStep] = useState(1);
  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const [pendingStep, setPendingStep] = useState<number | null>(null);
  const [createdClass, setCreatedClass] = useState<ClassWithDetails | null>(
    null,
  );

  useEffect(() => {
    const stored = Number(localStorage.getItem(storageKey));
    if (stored >= 1 && stored <= TOTAL_STEPS) {
      setStep(stored);
    }
  }, [storageKey]);

  useEffect(() => {
    if (phase === "leaving" && pendingStep != null) {
      const timeout = setTimeout(() => {
        setStep(pendingStep);
        localStorage.setItem(storageKey, String(pendingStep));
        setPendingStep(null);
        setPhase("entering");
      }, TRANSITION_MS);
      return () => clearTimeout(timeout);
    }
    if (phase === "entering") {
      const raf = requestAnimationFrame(() => setPhase("idle"));
      return () => cancelAnimationFrame(raf);
    }
  }, [phase, pendingStep, storageKey]);

  function goTo(next: number) {
    setPhase("leaving");
    setPendingStep(next);
  }

  const transitionClass = cn(
    "transition-all duration-200 ease-out",
    phase === "leaving" && "-translate-y-2 opacity-0",
    phase === "entering" && "translate-y-2 opacity-0",
    phase === "idle" && "translate-y-0 opacity-100",
  );

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-10">
      <div className="flex w-full max-w-md flex-col gap-8">
        <OnboardingProgress step={step} totalSteps={TOTAL_STEPS} />
        <Card>
          <CardContent className={cn("p-6 sm:p-8", transitionClass)}>
            {step === 1 && <StepWelcome onNext={() => goTo(2)} />}
            {step === 2 && <StepHowItWorks onNext={() => goTo(3)} />}
            {step === 3 && (
              <StepAddClass
                onCreated={(cls) => {
                  setCreatedClass(cls);
                  goTo(4);
                }}
                onSkip={() => goTo(4)}
              />
            )}
            {step === 4 && <StepReady createdClass={createdClass} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
