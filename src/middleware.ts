import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const ADMIN_ROLES = new Set(["SuperAdmin", "Admin"]);

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Public routes - no auth required
  if (pathname === "/login" || pathname.startsWith("/track")) {
    if (pathname === "/login" && session) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Redirect root to dashboard or login
  if (pathname === "/") {
    return NextResponse.redirect(new URL(session ? "/dashboard" : "/login", req.url));
  }

  // Redirect to login if not authenticated
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Restrict settings area to admin roles only
  if (pathname.startsWith("/dashboard/settings")) {
    const role = (session.user as { role?: string })?.role;
    if (!role || !ADMIN_ROLES.has(role)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
