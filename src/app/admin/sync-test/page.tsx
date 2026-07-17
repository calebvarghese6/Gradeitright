import { SyncTestClient } from "~/components/admin/sync-test-client";

export default function SyncTestPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sync test</h1>
        <p className="text-sm text-muted-foreground">
          Sends a test payload to /api/sync using your session — the same call
          the Chrome extension makes. Uses your real class and assignment names
          plus one fake class to demo the review flow.
        </p>
      </div>
      <SyncTestClient />
    </div>
  );
}
