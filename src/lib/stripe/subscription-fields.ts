import type Stripe from "stripe";

export function subscriptionFields(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0];

  return {
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    price_id: item?.price.id ?? null,
    current_period_end: item?.current_period_end
      ? new Date(item.current_period_end * 1000).toISOString()
      : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  };
}
