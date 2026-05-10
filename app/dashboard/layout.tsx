import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  CircleDollarSign,
  Film,
  Home,
  Settings,
  Sparkles,
  SquarePen,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { syncAuthenticatedUser } from "@/lib/sync-user";

const navItems = [
  { label: "Home", href: "/dashboard", icon: Home, active: true },
  { label: "My Videos", href: "/dashboard", icon: Film, active: false },
  { label: "Schedule Post", href: "/dashboard", icon: SquarePen, active: false },
  { label: "Pricing", href: "/dashboard", icon: CircleDollarSign, active: false },
];

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { userId } = await auth();
  await auth.protect();

  if (userId) {
    await syncAuthenticatedUser(userId);
  }

  const user = await currentUser();
  const firstName = user?.firstName || user?.username || "Creator";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <div className="overflow-hidden rounded-[2rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
        <div className="grid min-h-[78vh] md:grid-cols-[260px_1fr]">
          <aside className="flex flex-col border-b border-white/10 bg-black/20 md:border-b-0 md:border-r">
            <div className="px-6 pb-6 pt-7">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]">
                  <div className="size-3 rounded-full bg-gradient-to-br from-primary via-accent to-amber-300 shadow-[0_0_18px_rgba(125,92,255,0.8)]" />
                </div>
                <div>
                  <p className="text-base font-semibold tracking-tight text-white">
                    ViralClip AI
                  </p>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/40">
                    Dashboard
                  </p>
                </div>
              </div>
            </div>

            <nav className="flex-1 px-4 pb-6">
              <div className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-base transition-colors",
                        item.active
                          ? "border border-white/10 bg-white/[0.08] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]"
                          : "text-white/68 hover:bg-white/[0.05] hover:text-white"
                      )}
                    >
                      <Icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="border-t border-white/10 p-4">
              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-3">
                  <UserButton />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {firstName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user?.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white/75 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <Settings className="size-4" />
                  <span>User Settings</span>
                  <Sparkles className="ml-auto size-4 text-primary/80" />
                </button>
              </div>
            </div>
          </aside>

          <section className="bg-transparent">{children}</section>
        </div>
      </div>
    </div>
  );
}
