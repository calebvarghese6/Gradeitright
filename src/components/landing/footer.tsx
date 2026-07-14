import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-background">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <span className="text-lg font-bold tracking-tight">
            GradeIt<span className="text-primary">Right</span>
          </span>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-foreground">
              Terms of Service
            </Link>
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground sm:text-left">
          © {new Date().getFullYear()} GradeItRight. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
