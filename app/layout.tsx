import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import AppFrame from "@/components/AppFrame";
import { clerkAppearance } from "@/lib/clerk-theme";
import { cn } from "../lib/utils";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

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
          <AppFrame navbar={<Navbar />} footer={<Footer />}>
            {children}
          </AppFrame>
        </ClerkProvider>
      </body>
    </html>
  );
}
