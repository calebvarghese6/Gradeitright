"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { logout } from "~/lib/supabase/actions";

export function SignOutButton() {
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    await logout();
    // Hard navigation instead of router.push/redirect: Next's client Router
    // Cache can otherwise keep serving an already-rendered signed-in payload
    // for "/" after the server action returns, showing stale "Sign Out" state.
    window.location.href = "/";
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={handleSignOut}
    >
      Sign Out
    </Button>
  );
}
