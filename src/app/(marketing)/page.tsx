import { FinalCta } from "~/components/landing/final-cta";
import { Footer } from "~/components/landing/footer";
import { Hero } from "~/components/landing/hero";
import { HowItWorks } from "~/components/landing/how-it-works";
import { PainPoints } from "~/components/landing/pain-points";
import { Pricing } from "~/components/landing/pricing";
import { SocialProof } from "~/components/landing/social-proof";

export default function Home() {
  return (
    <main>
      <Hero />
      <PainPoints />
      <HowItWorks />
      <SocialProof />
      <Pricing />
      <FinalCta />
      <Footer />
    </main>
  );
}
