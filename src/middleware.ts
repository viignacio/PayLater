import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoot = createRouteMatcher(["/dashboard(.*)", "/trips(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  
  if (!userId && isProtectedRoot(req)) {
    const homeUrl = new URL("/", req.url);
    homeUrl.searchParams.set("sign-in", "true");
    return NextResponse.redirect(homeUrl.toString());
  }
});

export const config = {
  matcher: [
    // Optimized matcher from Clerk Core 3 instructions
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
