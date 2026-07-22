import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export default function ExtensionPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-bold tracking-tight">
        GradeItRight Chrome Extension
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Auto Sync works through a companion Chrome extension that reads your
        grades from Infinite Campus or Google Classroom and sends them here
        automatically — no manual entry.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Coming soon</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>
            The extension isn&apos;t published yet. Once it&apos;s live on the
            Chrome Web Store, install it and sign in with the same account —
            your grades will start syncing automatically.
          </p>
          <p>
            Until then, your Auto Sync plan stays active and you can keep
            entering grades manually — nothing is lost in the meantime.
          </p>
          <Button asChild className="mt-2 self-start">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
