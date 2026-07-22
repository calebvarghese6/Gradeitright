import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { SignOutButton } from "~/components/auth/sign-out-button";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";

const NAV_LINKS = [{ href: "/dashboard", label: "Classes" }];
const SYNC_LINK = { href: "/dashboard/sync", label: "Auto Sync" };
const BILLING_LINK = { href: "/settings/billing", label: "Billing" };
const ADMIN_LINK = { href: "/admin", label: "Admin" };

function initialsFor(user: User) {
  const source = user.user_metadata?.full_name ?? user.email ?? "?";
  return source.slice(0, 2).toUpperCase();
}

export function DashboardNavbar({
  user,
  isAdmin = false,
  isPremium = false,
}: {
  user: User;
  isAdmin?: boolean;
  isPremium?: boolean;
}) {
  const links = [
    ...NAV_LINKS,
    ...(isPremium ? [SYNC_LINK] : []),
    BILLING_LINK,
    ...(isAdmin ? [ADMIN_LINK] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">
          GradeIt<span className="text-primary">Right</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground sm:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary text-xs text-primary-foreground">
              {initialsFor(user)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[10rem] truncate text-sm text-muted-foreground md:inline">
            {user.email}
          </span>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
