import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  ArrowUpRight,
  CalendarDays,
  Film,
  Home,
  Plus,
  Settings,
  Sparkles,
  Upload,
  WandSparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", icon: Home, active: true },
  { label: "My Videos", icon: Film, active: false },
  { label: "Calendar", icon: CalendarDays, active: false },
  { label: "Settings", icon: Settings, active: false },
];

const recentVideos = [
  {
    title: "Podcast Episode 42",
    clips: "12 clips",
    status: "Ready",
    detail: "Captions generated, highlights approved",
  },
  {
    title: "Founder Webinar May",
    clips: "8 clips",
    status: "Processing",
    detail: "Transcript mapped, hook scoring in progress",
  },
  {
    title: "Creator Breakdown Livestream",
    clips: "5 clips",
    status: "Queued",
    detail: "Upload finished, clipping pipeline pending",
  },
];

const quickStats = [
  { label: "Uploads this month", value: "18" },
  { label: "Shorts exported", value: "74" },
  { label: "Avg render time", value: "12m" },
];

export default async function DashboardPage() {
  await auth.protect();
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
                    Workspace
                  </p>
                </div>
              </div>
            </div>

            <nav className="flex-1 px-4 pb-6">
              <div className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.label}
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-base transition-colors",
                        item.active
                          ? "border border-white/10 bg-white/[0.08] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]"
                          : "text-white/68 hover:bg-white/[0.05] hover:text-white"
                      )}
                    >
                      <Icon className="size-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>

            <div className="border-t border-white/10 p-4">
              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-3">
                  <UserButton afterSignOutUrl="/" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {firstName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user?.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs uppercase tracking-[0.22em] text-white/45">
                  Footer
                </div>
              </div>
            </div>
          </aside>

          <section className="bg-transparent">
            <div className="flex h-full flex-col">
              <div className="border-b border-white/10 px-6 py-6 md:px-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <Badge
                      variant="outline"
                      className="border-primary/30 bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-primary"
                    >
                      Dashboard
                    </Badge>
                    <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                      Welcome back, {firstName}.
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                      This protected workspace is where uploads, clip generation,
                      review, and export flow together in one production queue.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "lg" }),
                        "rounded-full border-white/12 bg-white/5 px-5 text-white hover:bg-white/8"
                      )}
                    >
                      <Upload className="size-4" />
                      Upload Video
                    </button>
                    <button
                      type="button"
                      className={cn(
                        buttonVariants({ size: "lg" }),
                        "rounded-full border border-primary/40 bg-primary px-5 text-primary-foreground hover:bg-primary/92"
                      )}
                    >
                      <Plus className="size-4" />
                      New Project
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-6 md:p-8">
                <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                  <div className="space-y-6">
                    <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm uppercase tracking-[0.24em] text-white/45">
                            Main workspace
                          </p>
                          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                            Your latest video jobs
                          </h2>
                        </div>
                        <div className="hidden rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/60 sm:block">
                          Protected route active
                        </div>
                      </div>

                      <div className="mt-6 space-y-4">
                        {recentVideos.map((video) => (
                          <div
                            key={video.title}
                            className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4"
                          >
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-lg font-medium text-white">
                                  {video.title}
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {video.detail}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge
                                  variant="outline"
                                  className="border-white/10 bg-white/5 text-white/80"
                                >
                                  {video.status}
                                </Badge>
                                <span className="text-sm text-white/60">
                                  {video.clips}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[1.7rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(125,92,255,0.18),transparent_35%),rgba(255,255,255,0.04)] p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 text-sm font-medium text-white">
                            <WandSparkles className="size-4 text-primary" />
                            AI next step
                          </div>
                          <h3 className="mt-3 text-xl font-semibold text-white">
                            Connect this shell to your real upload and rendering
                            pipeline next.
                          </h3>
                          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                            The layout is now aligned to the dashboard wireframe.
                            Next, wire the upload action, clip queue, and
                            database-backed project list into these panels.
                          </p>
                        </div>
                        <ArrowUpRight className="mt-1 hidden size-5 text-accent sm:block" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
                      {quickStats.map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4"
                        >
                          <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                            {stat.label}
                          </p>
                          <p className="mt-3 text-3xl font-semibold text-white">
                            {stat.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-5">
                      <div className="flex items-center gap-2 text-sm font-medium text-white">
                        <Sparkles className="size-4 text-accent" />
                        Suggested workflow
                      </div>
                      <div className="mt-5 space-y-3">
                        {[
                          "Upload a new long-form source video",
                          "Review transcript and hook scoring",
                          "Approve short clip candidates",
                          "Export captioned vertical renders",
                        ].map((item, index) => (
                          <div
                            key={item}
                            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-muted-foreground"
                          >
                            <span className="mr-3 text-white/45">
                              0{index + 1}
                            </span>
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
