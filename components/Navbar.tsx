import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            VidShorts
          </span>
        </Link>
        <div className="flex items-center gap-4">
          {/* Auth placeolders */}
          <button className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Sign In
          </button>
          <button className="text-sm font-medium bg-primary text-secondary px-4 py-2 rounded-md hover:bg-primary/90 transition-colors shadow-sm">
            Get Started
          </button>
        </div>
      </div>
    </header>
  );
}
