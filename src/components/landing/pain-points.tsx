import { Bot, Dices, TimerOff } from "lucide-react";
import { Reveal } from "~/components/landing/reveal";

const painPoints = [
  {
    icon: Bot,
    quote:
      "Spent hours on ChatGPT trying to calculate your grade and got the wrong answer.",
  },
  {
    icon: TimerOff,
    quote: "Didn't know your grade until it was too late to fix it.",
  },
  {
    icon: Dices,
    quote: "Guessed what you needed on the final and guessed wrong.",
  },
];

export function PainPoints() {
  return (
    <section className="border-b border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-28">
        <Reveal>
          <p className="mb-10 text-center text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Sound familiar?
          </p>
        </Reveal>
        <div className="grid gap-6 sm:grid-cols-3">
          {painPoints.map((point, i) => (
            <Reveal key={point.quote} delay={i * 100}>
              <div className="relative flex h-full flex-col gap-4 overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10">
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-primary to-success"
                />
                <point.icon className="size-6 text-primary" />
                <p className="text-base leading-relaxed font-medium text-foreground">
                  &ldquo;{point.quote}&rdquo;
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
