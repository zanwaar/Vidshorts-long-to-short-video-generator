import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { middlewareArcjet } from "@/lib/arcjet";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);
const isArcjetBypassRoute = createRouteMatcher(["/api/inngest(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isArcjetBypassRoute(req)) {
    const decision = await middlewareArcjet.protect(req);

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
      }

      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
