import Link from "next/link";
import { Button } from "~/components/ui/button";
import { logout } from "~/lib/supabase/actions";
import { createClient } from "~/lib/supabase/server";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-bold tracking-tight">
          GradeIt<span className="text-primary">Right</span>
        </Link>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <form action={logout}>
                <Button type="submit" variant="outline" size="sm">
                  Sign Out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/25"
              >
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
