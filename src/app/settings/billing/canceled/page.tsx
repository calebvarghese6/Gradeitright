import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { fetchSubscription } from "~/lib/supabase/queries";
import { createClient } from "~/lib/supabase/server";

export default async function BillingCanceledPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const subscription = await fetchSubscription(supabase, user.id);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold tracking-tight">
        Subscription canceled
      </h1>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">What happens next</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>
            You still have access to auto sync until the end of your current
            billing period. After that your account moves back to the free plan
            — your grades and classes stay saved, nothing gets deleted.
          </p>
          {subscription?.current_period_end && (
            <p>
              Your access ends on{" "}
              <span className="font-medium text-foreground">
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </span>
              . You can resume your plan anytime before then from the billing
              page.
            </p>
          )}
          <Button asChild className="mt-2 self-start">
            <Link href="/settings/billing">Back to Billing</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
