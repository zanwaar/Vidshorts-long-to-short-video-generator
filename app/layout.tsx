import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { cn } from "../lib/utils";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { clerkAppearance } from "@/lib/clerk-theme";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "ViralClip AI",
  description: "Turn long videos into social-ready short clips with AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", inter.variable)}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <ClerkProvider appearance={clerkAppearance}>
          <div className="relative flex min-h-full flex-col overflow-x-hidden">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(125,92,255,0.24),_transparent_34%),radial-gradient(circle_at_80%_20%,_rgba(0,214,201,0.12),_transparent_24%),linear-gradient(180deg,_rgba(5,8,20,0.94),_rgba(2,6,23,1))]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ClerkProvider>
      </body>
    </html>
  );
}
