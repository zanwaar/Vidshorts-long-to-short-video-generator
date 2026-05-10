import { auth, currentUser } from "@clerk/nextjs/server";
import { ArrowUpRight, Captions, Clock3, Rocket, Scissors } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const metrics = [
  { label: "Videos processed", value: "18", icon: Rocket },
  { label: "Short clips exported", value: "74", icon: Scissors },
  { label: "Caption-ready renders", value: "52", icon: Captions },
  { label: "Average turnaround", value: "12 min", icon: Clock3 },
];

const queue = [
  {
    title: "Founder webinar May cutdown",
    status: "Processing",
    detail: "Transcript mapped, highlight scoring running",
  },
  {
    title: "Podcast episode 42",
    status: "Ready",
    detail: "12 clip candidates waiting for approval",
  },
  {
    title: "Creator breakdown livestream",
    status: "Queued",
    detail: "Upload received, render pipeline pending",
  },
];

export default async function DashboardPage() {
  await auth.protect();
  const user = await currentUser();
  const firstName = user?.firstName || user?.username || "Creator";

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-primary"
          >
            Dashboard
          </Badge>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Welcome back, {firstName}.
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-8 text-muted-foreground">
            This route is protected by Clerk. Only authenticated users can access
            uploads, processing status, and clip generation workflow.
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-muted-foreground">
          <span className="text-white">Signed in as</span> {user?.primaryEmailAddress?.emailAddress}
        </div>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <Card
              key={metric.label}
              className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] py-0"
            >
              <CardHeader className="px-5 pt-5">
                <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <Icon className="size-5 text-primary" />
                </div>
                <CardDescription className="pt-4 text-sm text-muted-foreground">
                  {metric.label}
                </CardDescription>
                <CardTitle className="text-3xl text-white">{metric.value}</CardTitle>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[1.9rem] border border-white/10 bg-white/[0.04] py-0">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-xl text-white">Processing queue</CardTitle>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
              Example dashboard surface for authenticated users. Hook your real upload
              and Inngest pipeline into this route next.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            {queue.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-base font-medium text-white">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-white/10 bg-white/5 text-white/80"
                  >
                    {item.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[1.9rem] border border-white/10 bg-white/[0.04] py-0">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-xl text-white">Next implementation step</CardTitle>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
              Clerk is now in place. The next high-value connection is a real upload action
              and protected dashboard data backed by your database.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6 text-sm leading-7 text-muted-foreground">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              Connect a server action for upload initialization and store the source video.
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              Trigger Inngest after upload so transcript and clip jobs appear here.
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              Scope queries by Clerk user ID before exposing real project data.
            </div>
            <div className="flex items-center gap-2 text-white">
              <ArrowUpRight className="size-4 text-accent" />
              Protected routes are active for `/dashboard`.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
