import Link from "next/link";
import { GradePreviewCard } from "~/components/landing/grade-preview-card";
import { Reveal } from "~/components/landing/reveal";
import { Button } from "~/components/ui/button";

export function Hero() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-gradient-to-br from-[oklch(0.14_0.04_258)] via-[oklch(0.19_0.055_258)] to-[oklch(0.25_0.07_258)]"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(255,255,255,0.08),transparent)]"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-28 md:py-36 lg:grid-cols-2">
        <Reveal>
          <div className="flex flex-col items-start gap-6">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Know exactly what you need to pass.
            </h1>
            <p className="max-w-lg text-lg text-white/70">
              GradeItRight tells you the exact score you need on every remaining
              assignment to hit your target grade — across every class, in under
              3 minutes.
            </p>
            <div className="flex flex-col gap-2">
              <Button
                asChild
                size="lg"
                className="bg-white text-[oklch(0.22_0.07_258)] shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-xl hover:shadow-white/20"
              >
                <Link href="/signup">Try It Free</Link>
              </Button>
              <p className="text-sm text-white/60">
                No login required. Free forever for manual entry.
              </p>
            </div>
          </div>
        </Reveal>
        <Reveal delay={150} className="flex justify-center lg:justify-end">
          <GradePreviewCard />
        </Reveal>
      </div>
    </section>
  );
}
