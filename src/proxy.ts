import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Public routes - no auth required
const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/set-password",
  "/auth/reset-password",
];

// Protected routes - require any authenticated user
const PROTECTED_ROUTES = [
  "/home",
  "/settings",
  "/logout",
  "/ai-assistant",
  "/training",
  "/rfq",
  "/support",
  "/documents",
  "/news",
  "/software",
];

// Admin routes - require admin role
const ADMIN_ROUTES = ["/admin"];

function isPublicRoute(pathname: string): boolean {
  return (
    PUBLIC_ROUTES.includes(pathname) ||
    PUBLIC_ROUTES.some((r) => pathname.startsWith(r))
  );
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some((r) => pathname.startsWith(r));
}

function shouldSkipAuth(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico") ||
    /\.(ico|png|jpg|jpeg|svg|gif|webp)$/.test(pathname)
  );
}

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (shouldSkipAuth(pathname)) {
    return NextResponse.next();
  }

  const response = NextResponse.next({
    request: { headers: req.headers },
  });

  // Create Supabase client with getAll/setAll (recommended pattern for proper cookie refresh)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options ?? {});
          });
        },
      },
    }
  );

  // Use getUser() to validate JWT and trigger token refresh if needed (fixes stale cookie issues)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = !!user;

  let userRole: string | null = null;
  if (isAuthenticated && user) {
    try {
      const { data } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();
      userRole = data?.role ?? null;
    } catch {
      // Ignore - role check will fail gracefully
    }
  }

  // Root redirect
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(isAuthenticated ? "/home" : "/login", req.url)
    );
  }

  // Public routes - redirect authenticated users away from login/register
  if (isPublicRoute(pathname)) {
    if (
      isAuthenticated &&
      (pathname === "/login" || pathname === "/register" || pathname === "/forgot-password")
    ) {
      return NextResponse.redirect(new URL("/home", req.url));
    }
    return response;
  }

  // Protected and admin routes - require auth
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes - require admin role
  if (isAdminRoute(pathname) && userRole !== "admin") {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
