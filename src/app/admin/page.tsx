import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { fetchAdminUserOverview } from "~/lib/supabase/queries";
import { createClient } from "~/lib/supabase/server";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminPage() {
  const supabase = await createClient();
  const users = await fetchAdminUserOverview(supabase);
  const totalClasses = users.reduce((sum, u) => sum + u.classes.length, 0);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
          <p className="text-sm text-muted-foreground">
            {users.length} {users.length === 1 ? "user" : "users"} ·{" "}
            {totalClasses} {totalClasses === 1 ? "class" : "classes"} created
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/sync-test">Sync test</Link>
        </Button>
      </div>

      {users.length === 0 ? (
        <p className="text-sm text-muted-foreground">No users yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {users.map((u) => (
            <Card key={u.user_id}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <div>
                  <CardTitle className="text-base font-semibold">
                    {u.email}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Joined {formatDate(u.user_created_at)}
                  </p>
                </div>
                <Badge variant="outline">
                  {u.classes.length}{" "}
                  {u.classes.length === 1 ? "class" : "classes"}
                </Badge>
              </CardHeader>
              {u.classes.length > 0 && (
                <CardContent className="flex flex-col gap-2">
                  {u.classes.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{c.name}</span>
                        <Badge variant="secondary" className="text-[11px]">
                          {c.grading_mode === "weighted"
                            ? "Weighted"
                            : "Points"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          {c.assignment_count}{" "}
                          {c.assignment_count === 1
                            ? "assignment"
                            : "assignments"}
                        </span>
                        <span>{formatDate(c.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
