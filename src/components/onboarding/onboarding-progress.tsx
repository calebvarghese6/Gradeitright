import { cn } from "~/lib/utils";

export function OnboardingProgress({
  step,
  totalSteps,
}: {
  step: number;
  totalSteps: number;
}) {
  return (
    <div className="flex w-full flex-col gap-2">
      <span className="text-center text-xs font-medium text-muted-foreground">
        Step {step} of {totalSteps}
      </span>
      <div className="flex gap-1.5">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: segments are positional and never reordered
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-300",
              i < step ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </div>
    </div>
  );
}
