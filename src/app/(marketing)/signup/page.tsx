import { Check } from "lucide-react";
import Link from "next/link";
import { GoogleSignInButton } from "~/components/auth/google-sign-in-button";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { signup } from "~/lib/supabase/actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; type?: string }>;
}) {
  const { message, type } = await searchParams;

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>
            Free forever for manual entry. No credit card required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <GoogleSignInButton />
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>
          </div>
          <form action={signup} className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={6}
                required
              />
            </div>
            {message &&
              (type === "success" ? (
                <p className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" />
                  <span>{message}</span>
                </p>
              ) : (
                <p className="text-sm text-destructive">{message}</p>
              ))}
            <Button type="submit" className="mt-2">
              Sign Up
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
