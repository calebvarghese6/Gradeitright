import { Check } from "lucide-react";
import Link from "next/link";
import { Reveal } from "~/components/landing/reveal";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { cn } from "~/lib/utils";

const plans = [
  {
    name: "Manual Entry",
    price: "$0",
    period: "forever",
    features: [
      "Enter grades manually",
      "Instant calculations",
      "All classes supported",
      "No login needed",
    ],
    highlighted: false,
  },
  {
    name: "Auto Sync",
    price: "$3.99",
    period: "per month",
    features: [
      "Everything in free",
      "Automatic sync with Infinite Campus and Google Classroom",
      "Up to 5 AI grade summaries per week",
      "Never enter a grade manually again",
    ],
    highlighted: true,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-28">
        <Reveal>
          <p className="mb-10 text-center text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Pricing
          </p>
        </Reveal>
        <div className="mx-auto grid max-w-3xl items-stretch gap-6 sm:grid-cols-2">
          {plans.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 100} className="h-full">
              <Card
                className={cn(
                  "relative h-full transition-all duration-300 hover:-translate-y-1",
                  plan.highlighted
                    ? "border-transparent bg-gradient-to-b from-[oklch(0.2_0.06_258)] to-[oklch(0.27_0.075_258)] text-white shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/35"
                    : "hover:shadow-lg hover:shadow-primary/10",
                )}
              >
                {plan.highlighted && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-success text-success-foreground">
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      plan.highlighted
                        ? "text-white/70"
                        : "text-muted-foreground",
                    )}
                  >
                    {plan.name}
                  </p>
                  <p className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold tracking-tight">
                      {plan.price}
                    </span>
                    <span
                      className={cn(
                        "text-sm",
                        plan.highlighted
                          ? "text-white/70"
                          : "text-muted-foreground",
                      )}
                    >
                      {plan.period}
                    </span>
                  </p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-6">
                  <ul className="flex flex-col gap-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Check className="mt-0.5 size-4 shrink-0 text-success" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    variant={plan.highlighted ? "default" : "outline"}
                    className={cn(
                      "transition-all",
                      plan.highlighted &&
                        "bg-white text-[oklch(0.22_0.07_258)] shadow-md hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:shadow-white/20",
                    )}
                  >
                    <Link href="/signup">
                      {plan.highlighted
                        ? "Upgrade to Auto Sync"
                        : "Get Started Free"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
