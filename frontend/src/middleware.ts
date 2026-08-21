import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./lib/admin/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypasses
  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  // Admin page protection
  if (pathname.startsWith("/admin")) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const username = await verifySessionToken(sessionCookie);

    if (!username) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // Admin API protection
  if (pathname.startsWith("/api/admin")) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const username = await verifySessionToken(sessionCookie);

    if (!username) {
      return NextResponse.json(
        { error: "Unauthorized. Valid administrator session required." },
        { status: 401 }
      );
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
