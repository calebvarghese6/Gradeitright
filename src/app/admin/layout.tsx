import { redirect } from "next/navigation";
import { DashboardNavbar } from "~/components/dashboard/dashboard-navbar";
import { checkIsAdmin } from "~/lib/supabase/queries";
import { createClient } from "~/lib/supabase/server";

export default async function AdminLayout({
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

  const isAdmin = await checkIsAdmin(supabase, user.id);

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <>
      <DashboardNavbar user={user} isAdmin={isAdmin} />
      {children}
    </>
  );
}
