import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const ADMIN_ROLES = new Set(["SuperAdmin", "Admin"]);

function normalizePath(path: string): string {
  if (!path) return "/";
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
}

function hasMenuAccess(pathname: string, allowedHrefs: string[]): boolean {
  const currentPath = normalizePath(pathname);

  if (currentPath === "/dashboard") {
    return true;
  }

  return allowedHrefs.some((href) => {
    const allowedPath = normalizePath(href);
    if (currentPath === allowedPath) {
      return true;
    }

    if (allowedPath === "/dashboard") {
      return false;
    }

    return currentPath.startsWith(`${allowedPath}/`);
  });
}

async function getAllowedPaths(req: Request, roleId: number): Promise<string[]> {
  const token =
    process.env.RBAC_INTERNAL_TOKEN ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "";
  if (!token) return [];

  const url = new URL(`/api/internal/rbac/allowed-paths?roleId=${roleId}`, req.url);
  const res = await fetch(url, {
    headers: {
      "x-rbac-internal-token": token,
    },
    cache: "no-store",
  });

  if (!res.ok) return [];

  const data = (await res.json()) as { allowedPaths?: string[] };
  if (!Array.isArray(data.allowedPaths)) return [];

  return data.allowedPaths.filter((p) => typeof p === "string" && p.length > 0);
}

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  // Public routes - no auth required
  if (pathname === "/login" || pathname.startsWith("/track")) {
    if (pathname === "/login" && session) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
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

  // Enforce RBAC for all dashboard routes, including direct URL access and client navigation.
  if (pathname.startsWith("/dashboard")) {
    const roleId = (session.user as { roleId?: number })?.roleId;
    if (!roleId || typeof roleId !== "number") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    const allowedPaths = await getAllowedPaths(req, roleId);
    if (!hasMenuAccess(pathname, allowedPaths)) {
      return NextResponse.redirect(new URL("/dashboard?error=access-denied", req.url));
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
