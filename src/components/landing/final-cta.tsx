import Link from "next/link";
import { Reveal } from "~/components/landing/reveal";
import { Button } from "~/components/ui/button";

export function FinalCta() {
  return (
    <section
      id="get-started"
      className="bg-gradient-to-br from-[oklch(0.14_0.04_258)] via-[oklch(0.19_0.055_258)] to-[oklch(0.25_0.07_258)]"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-28 text-center">
        <Reveal>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Stop guessing. Start knowing.
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <Button
            asChild
            size="lg"
            className="bg-white text-[oklch(0.22_0.07_258)] shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-xl hover:shadow-white/20"
          >
            <Link href="/signup">Get Started Free</Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
