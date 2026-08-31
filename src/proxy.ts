import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionFromRequest } from "./lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes - no auth needed
  if (pathname === "/login" || pathname === "/") {
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(request);

  // Not logged in - redirect to login
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Admin-only routes
  if (pathname.startsWith("/admin") && session.role !== "admin") {
    return NextResponse.redirect(new URL("/cashier", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/cashier/:path*", "/login"],
};
