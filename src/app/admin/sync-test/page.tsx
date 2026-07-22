import { SyncPanel } from "~/components/dashboard/sync-panel";

export default function SyncTestPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sync test</h1>
        <p className="text-sm text-muted-foreground">
          Sends your real classes and assignments to /api/sync — the same call
          the Chrome extension makes. Admins bypass the premium gate and rate
          limit.
        </p>
      </div>
      <SyncPanel />
    </div>
  );
}
