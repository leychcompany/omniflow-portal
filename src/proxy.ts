import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function shouldSkipEntirely(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    /\.(ico|png|jpg|jpeg|svg|gif|webp)$/.test(pathname)
  );
}

/**
 * Minimal middleware: root redirect, /login redirect, and Supabase session refresh for all routes (including /api).
 * Supabase recommends running refresh on all routes that need auth; skipping /api left cookies stale in prod.
 */
export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (shouldSkipEntirely(pathname)) {
    return NextResponse.next();
  }

  const response = NextResponse.next({
    request: { headers: req.headers },
  });

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

  const { data: { user } } = await supabase.auth.getUser();
  const isAuthenticated = !!user;

  // API routes: only refresh session (cookies updated in response), no redirects
  if (pathname.startsWith("/api")) {
    return response;
  }

  // Root redirect
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(isAuthenticated ? "/home" : "/login", req.url)
    );
  }

  // Authenticated on login/register -> go to home (layout-based protection handles the rest)
  if (
    isAuthenticated &&
    (pathname === "/login" || pathname === "/register" || pathname === "/forgot-password")
  ) {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
