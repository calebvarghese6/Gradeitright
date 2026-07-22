import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { env } from "~/env";
import { stripe } from "~/lib/stripe/client";
import { subscriptionFields } from "~/lib/stripe/subscription-fields";
import { serviceClient } from "~/lib/supabase/service";

function customerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer,
) {
  return typeof customer === "string" ? customer : customer.id;
}

// Stripe does not guarantee webhook delivery order — customer.subscription.*
// can arrive before checkout.session.completed. This handler is what
// establishes the user_id<->customer_id link, so instead of guessing a
// status here, it fetches the subscription directly from Stripe: whichever
// event lands second self-heals to the true current state.
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id;
  if (!userId || !session.customer) return;

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : (session.subscription?.id ?? null);

  const subscription = subscriptionId
    ? await stripe.subscriptions.retrieve(subscriptionId)
    : null;

  await serviceClient()
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: customerId(session.customer),
        ...(subscription
          ? subscriptionFields(subscription)
          : { stripe_subscription_id: null, status: "incomplete" }),
      },
      { onConflict: "user_id" },
    );
}

async function handleSubscriptionUpsert(subscription: Stripe.Subscription) {
  await serviceClient()
    .from("subscriptions")
    .update(subscriptionFields(subscription))
    .eq("stripe_customer_id", customerId(subscription.customer));
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await serviceClient()
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("stripe_customer_id", customerId(subscription.customer));
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionUpsert(event.data.object);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
