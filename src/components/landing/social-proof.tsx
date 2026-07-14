import { Reveal } from "~/components/landing/reveal";
import { Card, CardContent } from "~/components/ui/card";

const testimonials = [
  {
    quote:
      "I had no idea what grade I was even going for until GradeItRight made me set a target. Game changer.",
    name: "High School Student",
  },
  {
    quote:
      "I wasted 20 minutes on ChatGPT trying to figure out my grade and had to redo it every time something changed. This just does it.",
    name: "High School Student",
  },
  {
    quote:
      "I didn't know if I should study for my history final or focus on English. GradeItRight showed me exactly where I needed to be.",
    name: "High School Student",
  },
];

export function SocialProof() {
  return (
    <section className="border-b border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-28">
        <div className="grid gap-6 sm:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.quote} delay={i * 100}>
              <Card className="h-full justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10">
                <CardContent className="flex h-full flex-col justify-between gap-4">
                  <p className="text-lg leading-relaxed font-medium">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <p className="text-sm text-muted-foreground">— {t.name}</p>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
