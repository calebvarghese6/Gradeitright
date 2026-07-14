import { redirect } from "next/navigation";
import { fetchOnboardingCompleted } from "~/lib/supabase/queries";
import { createClient } from "~/lib/supabase/server";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const onboardingCompleted = await fetchOnboardingCompleted(supabase, user.id);

  if (onboardingCompleted) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
