import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "~/components/ui/button";
import { fetchIsPremium, fetchLastSync } from "~/lib/supabase/queries";
import { createClient } from "~/lib/supabase/server";

const SOURCE_LABEL: Record<string, string> = {
  infinite_campus: "Infinite Campus",
  google_classroom: "Google Classroom",
};

export default async function SyncPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const isPremium = await fetchIsPremium(supabase, user.id);

  if (!isPremium) {
    redirect("/settings/billing");
  }

  const lastSync = await fetchLastSync(supabase, user.id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Auto Sync</h1>
        <p className="text-sm text-muted-foreground">
          Pull your grades in from Infinite Campus instead of entering them by
          hand. Auto Sync runs through our Chrome extension — install it once
          and it keeps your grades up to date in the background.
        </p>
      </div>

      {lastSync ? (
        <p className="text-sm text-muted-foreground">
          Last synced {new Date(lastSync.synced_at).toLocaleString()} from{" "}
          {SOURCE_LABEL[lastSync.source] ?? lastSync.source} (
          {lastSync.records_updated} assignment
          {lastSync.records_updated === 1 ? "" : "s"} updated).
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          You haven&apos;t synced yet — click below to pull in your current
          grades.
        </p>
      )}

      <Button asChild variant="success" className="self-start">
        <Link href="/extension">Sync now</Link>
      </Button>
    </div>
  );
}
