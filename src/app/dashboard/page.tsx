import { DashboardContent } from "~/components/dashboard/dashboard-content";
import { fetchClassesWithDetails } from "~/lib/supabase/queries";
import { createClient } from "~/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const classes = await fetchClassesWithDetails(supabase);

  return <DashboardContent initialClasses={classes} />;
}
