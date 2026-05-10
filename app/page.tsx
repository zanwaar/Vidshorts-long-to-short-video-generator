import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import {
  ArrowRight,
  Captions,
  Check,
  Clock3,
  Layers3,
  Play,
  Rocket,
  Scissors,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const featureCards = [
  {
    icon: Sparkles,
    title: "AI highlight discovery",
    description:
      "Detect the strongest hooks, quotable moments, and emotionally dense segments from long recordings.",
  },
  {
    icon: Captions,
    title: "Caption-ready outputs",
    description:
      "Generate short clips designed for subtitles, mobile framing, and platform-native consumption.",
  },
  {
    icon: Scissors,
    title: "Automatic clipping pipeline",
    description:
      "Move from transcript to trimmed short without manually scrubbing timelines for every moment.",
  },
  {
    icon: Layers3,
    title: "Multi-clip batch export",
    description:
      "Render multiple shortlisted clips from one source video so your team can publish at volume.",
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "Upload the master video",
    text: "Drop in a podcast, webinar, interview, tutorial, or talking-head recording.",
  },
  {
    step: "02",
    title: "Transcribe and score moments",
    text: "The system maps the transcript, finds standout sections, and ranks clip potential.",
  },
  {
    step: "03",
    title: "Review short candidates",
    text: "Your team sees suggested hooks, durations, captions, and reasons before export.",
  },
  {
    step: "04",
    title: "Render and distribute",
    text: "Approve your picks, export social-ready videos, and keep the publishing queue full.",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "$29",
    description: "For solo creators testing AI-assisted short-form production.",
    features: [
      "120 minutes processed monthly",
      "AI highlight suggestions",
      "Caption-ready exports",
      "3 active projects",
    ],
    featured: false,
  },
  {
    name: "Growth",
    price: "$79",
    description: "For creators and teams publishing short clips every week.",
    features: [
      "600 minutes processed monthly",
      "Batch clip generation",
      "Priority rendering queue",
      "Team review workflow",
    ],
    featured: true,
  },
  {
    name: "Studio",
    price: "Custom",
    description: "For agencies and media operations running multi-client pipelines.",
    features: [
      "Unlimited workspaces",
      "Custom rendering throughput",
      "Shared brand templates",
      "Onboarding and SLA support",
    ],
    featured: false,
  },
];

const faqs = [
  {
    question: "What kind of videos work best?",
    answer:
      "Podcasts, interviews, webinars, tutorials, and creator commentary perform best because they contain clear spoken moments the system can rank and clip.",
  },
  {
    question: "Do I still control the final clips?",
    answer:
      "Yes. ViralClip AI narrows the field, scores moments, and prepares outputs, but your team still chooses what gets rendered and published.",
  },
  {
    question: "Is this only for individual creators?",
    answer:
      "No. The workflow is designed to scale from solo operators to agencies and internal media teams managing repeatable short-form pipelines.",
  },
];

export default async function Home() {
  const { userId } = await auth();
  const primaryCtaHref = userId ? "/dashboard" : "/sign-up";
  const primaryCtaLabel = userId ? "Open Dashboard" : "Start Free";
  const secondaryCtaHref = userId ? "/dashboard" : "/sign-in";
  const secondaryCtaLabel = userId ? "View Queue" : "Sign In";

  return (
    <div className="relative">
      <section id="hero" className="mx-auto max-w-7xl px-4 pb-20 pt-14 md:px-8 md:pb-24 md:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-2xl">
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-primary"
            >
              AI clipping pipeline
            </Badge>
            <h1 className="mt-6 text-5xl font-semibold tracking-tight text-balance text-white md:text-7xl">
              Turn long videos into short clips people actually finish.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              ViralClip AI helps creators and teams convert podcasts, webinars,
              and interviews into captioned short-form content with less manual
              editing and faster turnaround.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={primaryCtaHref}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "rounded-full border border-primary/40 bg-primary px-6 text-primary-foreground shadow-[0_18px_50px_rgba(125,92,255,0.35)] hover:bg-primary/92"
                )}
              >
                {primaryCtaLabel}
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href={secondaryCtaHref}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "rounded-full border-white/15 bg-white/5 px-6 text-white hover:bg-white/8"
                )}
              >
                <Play className="size-4" />
                {secondaryCtaLabel}
              </Link>
            </div>
            <div className="mt-10 grid max-w-xl gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/4 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]">
                <p className="text-3xl font-semibold text-white">10x</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Faster short-form turnaround
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/4 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]">
                <p className="text-3xl font-semibold text-white">1 upload</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Multiple clips extracted
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/4 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]">
                <p className="text-3xl font-semibold text-white">Auto</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Transcript, hooks, and captions
                </p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-primary/25 via-transparent to-accent/15 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
              <div className="rounded-[1.6rem] border border-white/8 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Episode_042_master.mp4
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      48 min podcast upload processed into short candidates
                    </p>
                  </div>
                  <Badge className="bg-emerald-400/15 text-emerald-200">
                    Ready to export
                  </Badge>
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[1.4rem] border border-white/8 bg-gradient-to-br from-primary/18 via-slate-950 to-accent/10 p-4">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/55">
                      <span>Preview frame</span>
                      <span>9:16 output</span>
                    </div>
                    <div className="mt-4 flex aspect-[4/5] items-end rounded-[1.2rem] border border-white/8 bg-[radial-gradient(circle_at_30%_20%,rgba(125,92,255,0.35),transparent_30%),linear-gradient(160deg,rgba(8,12,28,0.9),rgba(3,7,18,1))] p-5">
                      <div className="w-full rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur">
                        <p className="text-xs uppercase tracking-[0.2em] text-accent/80">
                          Live captions
                        </p>
                        <p className="mt-3 text-lg font-medium leading-7 text-white">
                          “This is the exact moment your content turns from
                          informative into highly shareable.”
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-[1.4rem] border border-white/8 bg-white/5 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-white">
                        <WandSparkles className="size-4 text-primary" />
                        Suggested highlights
                      </div>
                      <div className="mt-4 space-y-3">
                        {[
                          ["00:46", "Audience pain point", "SEO 92"],
                          ["06:18", "Strong hook + quick payoff", "SEO 88"],
                          ["17:42", "Clear tactical explanation", "SEO 85"],
                        ].map(([time, label, score]) => (
                          <div
                            key={time}
                            className="rounded-2xl border border-white/8 bg-black/20 p-3"
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-white">
                                {label}
                              </p>
                              <p className="text-xs text-accent">{score}</p>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Starts at {time} and matches a high-retention
                              talking point.
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-[1.4rem] border border-white/8 bg-white/5 p-4">
                        <Clock3 className="size-5 text-accent" />
                        <p className="mt-3 text-2xl font-semibold text-white">
                          06:18
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Best-performing hook candidate
                        </p>
                      </div>
                      <div className="rounded-[1.4rem] border border-white/8 bg-white/5 p-4">
                        <Rocket className="size-5 text-amber-300" />
                        <p className="mt-3 text-2xl font-semibold text-white">
                          12 clips
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Generated from one recording
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-6 md:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-white/4 px-6 py-5 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm uppercase tracking-[0.3em] text-white/45">
              Built for repeatable short-form production
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <span>Podcasts</span>
              <span>Webinars</span>
              <span>Coaching videos</span>
              <span>Creator interviews</span>
              <span>Media teams</span>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-20 md:px-8">
        <div className="max-w-2xl">
          <Badge
            variant="outline"
            className="border-accent/30 bg-accent/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-accent"
          >
            Features
          </Badge>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white md:text-5xl">
            A landing workflow built around actual editing bottlenecks.
          </h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            The product is designed to reduce time spent finding moments,
            trimming clips, and preparing publishable vertical content.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((feature) => {
            const Icon = feature.icon;

            return (
              <Card
                key={feature.title}
                className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] py-0 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]"
              >
                <CardHeader className="px-5 pt-5">
                  <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/6">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <CardTitle className="pt-4 text-lg text-white">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-sm leading-7 text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      <section id="workflow" className="mx-auto max-w-7xl px-4 py-20 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="max-w-xl">
            <Badge
              variant="outline"
              className="border-white/12 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-white/70"
            >
              Workflow
            </Badge>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white md:text-5xl">
              From upload to export without the usual timeline grind.
            </h2>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              The workflow is structured for repeated operations, so you can
              process long recordings and keep publishing without treating every
              clip like a manual editing job.
            </p>
          </div>
          <div className="space-y-4">
            {workflowSteps.map((item, index) => (
              <div key={item.step}>
                <div className="grid gap-3 rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5 md:grid-cols-[88px_1fr] md:items-start">
                  <div className="text-sm font-medium uppercase tracking-[0.3em] text-primary/85">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                      {item.text}
                    </p>
                  </div>
                </div>
                {index < workflowSteps.length - 1 ? (
                  <Separator className="mx-auto my-3 w-[calc(100%-2rem)] bg-white/8" />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 md:px-8">
        <div className="max-w-2xl">
          <Badge
            variant="outline"
            className="border-amber-300/30 bg-amber-300/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-amber-200"
          >
            Pricing
          </Badge>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white md:text-5xl">
            Pick the speed your short-form engine needs.
          </h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            Plans are organized around processing capacity, review workflow, and
            how often your team needs publishable clips from long recordings.
          </p>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                "rounded-[1.9rem] border py-0",
                plan.featured
                  ? "border-primary/35 bg-gradient-to-b from-primary/16 to-white/[0.04] shadow-[0_24px_80px_rgba(125,92,255,0.22)]"
                  : "border-white/10 bg-white/[0.04]"
              )}
            >
              <CardHeader className="px-6 pt-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-white">{plan.name}</CardTitle>
                  {plan.featured ? (
                    <Badge className="bg-primary/20 text-primary-foreground">
                      Recommended
                    </Badge>
                  ) : null}
                </div>
                <CardDescription className="text-sm leading-7 text-muted-foreground">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="mb-6">
                  <span className="text-4xl font-semibold tracking-tight text-white">
                    {plan.price}
                  </span>
                  <span className="ml-2 text-sm text-muted-foreground">
                    {plan.price === "Custom" ? "contact sales" : "/month"}
                  </span>
                </div>
                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <div className="mt-0.5 flex size-5 items-center justify-center rounded-full bg-emerald-400/12 text-emerald-200">
                        <Check className="size-3.5" />
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {feature}
                      </p>
                    </div>
                  ))}
                </div>
                <Link
                  href="#hero"
                  className={cn(
                    buttonVariants({
                      variant: plan.featured ? "default" : "outline",
                      size: "lg",
                    }),
                    "mt-8 w-full rounded-full",
                    plan.featured
                      ? "border border-primary/40 bg-primary text-primary-foreground hover:bg-primary/92"
                      : "border-white/12 bg-white/5 text-white hover:bg-white/8"
                  )}
                >
                  {plan.price === "Custom" ? "Talk to Sales" : "Choose Plan"}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-7xl px-4 py-20 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="max-w-xl">
            <Badge
              variant="outline"
              className="border-white/12 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-white/70"
            >
              FAQ
            </Badge>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white md:text-5xl">
              Common questions before you commit your editing pipeline.
            </h2>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              ViralClip AI is built to remove repetitive editing work, not
              replace judgment. The system narrows the work and speeds up
              publishing.
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5"
              >
                <h3 className="text-lg font-medium text-white">{faq.question}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 pt-6 md:px-8">
        <div className="overflow-hidden rounded-[2.2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(125,92,255,0.25),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-8 md:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.3em] text-primary/80">
                Final CTA
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">
                Turn your next long recording into a week of short-form content.
              </h2>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                Upload once, surface the best moments, and move from transcript
                to export without rebuilding the workflow from scratch each time.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={primaryCtaHref}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "rounded-full border border-primary/40 bg-primary px-6 text-primary-foreground hover:bg-primary/92"
                )}
              >
                {primaryCtaLabel}
              </Link>
              <Link
                href={userId ? "/dashboard" : "#features"}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "rounded-full border-white/12 bg-white/5 px-6 text-white hover:bg-white/8"
                )}
              >
                {userId ? "Go to Dashboard" : "Explore Features"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
