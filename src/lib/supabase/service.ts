import { createClient } from "@supabase/supabase-js";
import { env } from "~/env";

// Service-role client: subscriptions has no authenticated write grant, so
// only privileged, server-verified contexts (Stripe webhook, server actions
// that have already confirmed the caller owns the row) can write to it.
export function serviceClient() {
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
