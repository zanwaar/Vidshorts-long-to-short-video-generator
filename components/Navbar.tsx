import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { syncAuthenticatedUser } from "@/lib/sync-user";

export default async function Navbar() {
  const { userId } = await auth();

  if (userId) {
    await syncAuthenticatedUser(userId);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]">
            <div className="size-3 rounded-full bg-gradient-to-br from-primary via-accent to-amber-300 shadow-[0_0_18px_rgba(125,92,255,0.8)]" />
          </div>
          <span className="bg-gradient-to-r from-white via-white to-white/65 bg-clip-text text-xl font-semibold tracking-tight text-transparent">
            ViralClip AI
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link href="/#features" className="transition-colors hover:text-white">
            Features
          </Link>
          <Link href="/#workflow" className="transition-colors hover:text-white">
            Workflow
          </Link>
          <Link href="/#pricing" className="transition-colors hover:text-white">
            Pricing
          </Link>
          <Link href="/#faq" className="transition-colors hover:text-white">
            FAQ
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          {userId ? (
            <>
              <Link
                href="/dashboard"
                className="hidden text-sm text-muted-foreground transition-colors hover:text-white sm:inline"
              >
                Dashboard
              </Link>
              <UserButton />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="hidden text-sm text-muted-foreground transition-colors hover:text-white sm:inline"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "rounded-full border border-primary/40 bg-primary/90 px-4 text-primary-foreground shadow-[0_10px_40px_rgba(125,92,255,0.35)] hover:bg-primary"
                )}
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
