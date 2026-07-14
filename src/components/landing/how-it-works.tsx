import { Reveal } from "~/components/landing/reveal";

const steps = [
  {
    number: "01",
    title: "Enter your classes and current grades",
  },
  {
    number: "02",
    title: "Set your target grade",
  },
  {
    number: "03",
    title: "See exactly what you need on every remaining assignment",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-28">
        <Reveal>
          <p className="mb-10 text-center text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            How it works
          </p>
        </Reveal>
        <div className="grid gap-8 sm:grid-cols-3">
          {steps.map((step, i) => (
            <Reveal key={step.number} delay={i * 100}>
              <div className="relative flex flex-col gap-3 text-center sm:text-left">
                <span className="text-5xl font-bold tracking-tight text-primary/15">
                  {step.number}
                </span>
                <p className="text-lg font-semibold tracking-tight">
                  {step.title}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
