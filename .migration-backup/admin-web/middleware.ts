import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/users",
  "/analytics",
  "/subscriptions",
  "/notifications",
  "/reports",
  "/settings"
];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("admin_access_token")?.value;
  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (path === "/login" && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/users/:path*",
    "/analytics/:path*",
    "/subscriptions/:path*",
    "/notifications/:path*",
    "/reports/:path*",
    "/settings/:path*"
  ]
};
