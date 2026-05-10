import Link from "next/link";

const footerGroups = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Workflow", href: "/#workflow" },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  {
    title: "Use Cases",
    links: [
      { label: "Podcasters", href: "/#features" },
      { label: "Agencies", href: "/#pricing" },
      { label: "Media Teams", href: "/#workflow" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/20">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)] md:px-8">
        <div className="max-w-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <div className="size-3 rounded-full bg-gradient-to-br from-primary via-accent to-amber-300 shadow-[0_0_18px_rgba(125,92,255,0.8)]" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">
              ViralClip AI
            </span>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            AI workspace for turning webinars, interviews, podcasts, and long
            recordings into captioned short-form clips ready for distribution.
          </p>
          <p className="text-xs uppercase tracking-[0.24em] text-white/45">
            Built for creators, studios, and growth teams.
          </p>
        </div>
        {footerGroups.map((group) => (
          <div key={group.title} className="space-y-4">
            <h3 className="text-sm font-medium text-white">{group.title}</h3>
            <div className="space-y-3">
              {group.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="block text-sm text-muted-foreground transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8">
          <p>© 2026 ViralClip AI. All rights reserved.</p>
          <p>Fast clipping, better hooks, cleaner captions, less manual editing.</p>
        </div>
      </div>
    </footer>
  );
}
