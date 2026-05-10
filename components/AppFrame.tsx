"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type AppFrameProps = {
  children: ReactNode;
  footer: ReactNode;
  navbar: ReactNode;
};

export default function AppFrame({
  children,
  footer,
  navbar,
}: AppFrameProps) {
  const pathname = usePathname();
  const isDashboardRoute = pathname.startsWith("/dashboard");

  return (
    <div className="relative flex min-h-full flex-col overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(125,92,255,0.24),_transparent_34%),radial-gradient(circle_at_80%_20%,_rgba(0,214,201,0.12),_transparent_24%),linear-gradient(180deg,_rgba(5,8,20,0.94),_rgba(2,6,23,1))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      {!isDashboardRoute ? navbar : null}
      <main className="flex-1">{children}</main>
      {!isDashboardRoute ? footer : null}
    </div>
  );
}
