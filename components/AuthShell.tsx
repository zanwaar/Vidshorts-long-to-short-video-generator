import type { ReactNode } from "react";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

const highlights = [
  "Generate clip candidates from a single upload",
  "Review highlights, captions, and export status in one dashboard",
  "Keep your editing pipeline fast without manual timeline triage",
];

export default function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: AuthShellProps) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-9rem)] max-w-7xl gap-10 px-4 py-12 md:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
      <div className="max-w-xl">
        <p className="text-sm uppercase tracking-[0.3em] text-primary/80">
          {eyebrow}
        </p>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white md:text-6xl">
          {title}
        </h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">
          {description}
        </p>
        <div className="mt-10 space-y-4">
          {highlights.map((item) => (
            <div
              key={item}
              className="rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
      <div className="relative">
        <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-primary/20 via-transparent to-accent/10 blur-3xl" />
        <div className="relative rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-4 shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
          <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
