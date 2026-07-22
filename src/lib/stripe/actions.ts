"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type Stripe from "stripe";
import { env } from "~/env";
import { stripe } from "~/lib/stripe/client";
import { subscriptionFields } from "~/lib/stripe/subscription-fields";
import { createClient } from "~/lib/supabase/server";
import { serviceClient } from "~/lib/supabase/service";

async function getOrigin() {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol =
    headersList.get("x-forwarded-proto") ??
    (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function createCheckoutSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const origin = await getOrigin();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: env.STRIPE_PRICE_ID, quantity: 1 }],
    client_reference_id: user.id,
    success_url: `${origin}/settings/billing?checkout=success`,
    cancel_url: `${origin}/settings/billing?checkout=cancel`,
    ...(existing?.stripe_customer_id
      ? { customer: existing.stripe_customer_id }
      : { customer_email: user.email }),
  });

  if (!session.url) {
    redirect("/settings/billing?checkout=error");
  }

  redirect(session.url);
}

export async function createPortalSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!subscription?.stripe_customer_id) {
    redirect("/settings/billing");
  }

  const origin = await getOrigin();

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: `${origin}/settings/billing`,
  });

  redirect(portalSession.url);
}

export async function cancelSubscription() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!subscription?.stripe_subscription_id) {
    redirect("/settings/billing?cancel_error=no_subscription");
  }

  let updated: Stripe.Subscription;
  try {
    updated = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      { cancel_at_period_end: true },
    );
  } catch {
    // Surface the failure instead of letting it silently do nothing — e.g. the
    // stored subscription id no longer matches anything real in Stripe.
    redirect("/settings/billing?cancel_error=stripe");
  }

  // Write the row synchronously instead of waiting on the async Stripe
  // webhook — that keeps working even if a local `stripe listen` forwarder
  // isn't running, so the button's effect is never just "eventually consistent".
  const { error: dbError } = await serviceClient()
    .from("subscriptions")
    .update(subscriptionFields(updated))
    .eq("user_id", user.id);

  if (dbError) {
    redirect("/settings/billing?cancel_error=db");
  }

  revalidatePath("/settings/billing");
  redirect("/settings/billing/canceled");
}
