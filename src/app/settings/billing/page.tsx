import Link from "next/link";
import { redirect } from "next/navigation";
import { CancelSubscriptionDialog } from "~/components/settings/cancel-subscription-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import {
  createCheckoutSession,
  createPortalSession,
} from "~/lib/stripe/actions";
import { fetchIsPremium, fetchSubscription } from "~/lib/supabase/queries";
import { createClient } from "~/lib/supabase/server";

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  trialing: "Trial",
  past_due: "Past due",
  canceled: "Canceled",
  incomplete: "Incomplete",
  incomplete_expired: "Expired",
  unpaid: "Unpaid",
  paused: "Paused",
};

const CANCEL_ERROR_MESSAGE: Record<string, string> = {
  no_subscription: "We couldn't find an active subscription to cancel.",
  stripe:
    "Stripe couldn't process the cancellation. Please try again, or contact support if this keeps happening.",
  db: "The cancellation went through with Stripe, but we couldn't save it here — please refresh in a moment or contact support.",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; cancel_error?: string }>;
}) {
  const { checkout, cancel_error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [isPremium, subscription] = await Promise.all([
    fetchIsPremium(supabase, user.id),
    fetchSubscription(supabase, user.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your GradeItRight plan.
      </p>

      {checkout === "success" && (
        <div className="mt-6 flex flex-col gap-3 rounded-md border border-success/40 bg-success/10 px-4 py-3 text-sm text-success">
          <p>
            Your subscription is confirmed. It may take a few seconds to appear
            below.
          </p>
          {isPremium && (
            <Button asChild size="sm" variant="success" className="self-start">
              <Link href="/dashboard/sync">Set up Auto Sync →</Link>
            </Button>
          )}
        </div>
      )}
      {checkout === "cancel" && (
        <p className="mt-6 rounded-md border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
          Checkout was canceled — you have not been charged.
        </p>
      )}
      {cancel_error && (
        <p className="mt-6 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {CANCEL_ERROR_MESSAGE[cancel_error] ??
            "Something went wrong canceling your subscription. Please try again."}
        </p>
      )}

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Current plan
            </p>
            <p className="text-xl font-semibold">
              {isPremium ? "Auto Sync — $3.99/mo" : "Manual Entry — Free"}
            </p>
          </div>
          {subscription && (
            <Badge variant={isPremium ? "default" : "outline"}>
              {STATUS_LABEL[subscription.status] ?? subscription.status}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            <li>
              {isPremium ? "✓ " : "— "}Automatic sync with Infinite Campus and
              Google Classroom
            </li>
            <li>
              {isPremium ? "✓ " : "— "}Up to 5 AI grade summaries per week
            </li>
            <li>
              ✓ Personalized guidance on what you need for your target grade
            </li>
          </ul>

          {subscription?.cancel_at_period_end &&
            subscription.current_period_end && (
              <p className="text-sm text-muted-foreground">
                Your plan will end on{" "}
                {new Date(subscription.current_period_end).toLocaleDateString()}
                .
              </p>
            )}

          {isPremium ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="success">
                  <Link href="/dashboard/sync">Go to Auto Sync</Link>
                </Button>
                <form action={createPortalSession}>
                  <Button type="submit" variant="outline">
                    Manage subscription
                  </Button>
                </form>
              </div>
              {!subscription?.cancel_at_period_end && (
                <CancelSubscriptionDialog
                  currentPeriodEnd={subscription?.current_period_end ?? null}
                />
              )}
            </div>
          ) : (
            <form action={createCheckoutSession}>
              <Button type="submit">Upgrade to Auto Sync — $3.99/mo</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
