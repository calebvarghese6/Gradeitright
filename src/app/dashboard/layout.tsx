import { redirect } from "next/navigation";
import { DashboardNavbar } from "~/components/dashboard/dashboard-navbar";
import { checkIsAdmin, fetchOnboardingCompleted } from "~/lib/supabase/queries";
import { createClient } from "~/lib/supabase/server";

export default async function DashboardLayout({
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

  const [isAdmin, onboardingCompleted] = await Promise.all([
    checkIsAdmin(supabase, user.id),
    fetchOnboardingCompleted(supabase, user.id),
  ]);

  if (!onboardingCompleted) {
    redirect("/onboarding");
  }

  return (
    <>
      <DashboardNavbar user={user} isAdmin={isAdmin} />
      {children}
    </>
  );
}
