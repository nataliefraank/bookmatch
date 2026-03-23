import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/session-constants";

const PUBLIC_PAGE_PATHS = new Set(["/pages/login", "/pages/signup"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/pages/") && PUBLIC_PAGE_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const isProtected =
    pathname.startsWith("/bookmatch/") ||
    (pathname.startsWith("/pages/") && !PUBLIC_PAGE_PATHS.has(pathname));

  if (!isProtected) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.has(SESSION_COOKIE_NAME);
  if (!hasSession) {
    const login = new URL("/pages/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/pages/:path*", "/bookmatch/:path*"],
};
