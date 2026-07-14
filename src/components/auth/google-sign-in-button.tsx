"use client";

import { Button } from "~/components/ui/button";
import { createClient } from "~/lib/supabase/client";

function GoogleIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <title>Google</title>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.12-1.43.34-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function GoogleSignInButton() {
  async function handleClick() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={handleClick}
    >
      <GoogleIcon className="size-4" />
      Continue with Google
    </Button>
  );
}
