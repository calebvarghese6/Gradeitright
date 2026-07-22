import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const providerError =
    searchParams.get("error_description") ?? searchParams.get("error");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("exchangeCodeForSession failed:", error.message);
    return NextResponse.redirect(
      `${origin}/login?message=${encodeURIComponent(`Could not authenticate: ${error.message}`)}`,
    );
  }

  if (providerError) {
    console.error("OAuth callback error:", providerError);
  }

  return NextResponse.redirect(
    `${origin}/login?message=${encodeURIComponent(
      providerError
        ? `Could not authenticate: ${providerError}`
        : "Could not authenticate with Google",
    )}`,
  );
}
