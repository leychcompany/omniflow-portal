import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/auth",
  "/set-password",
  "/logout",
];
const isPublic = (pathname: string) =>
  PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

function shouldSkip(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    /\.(ico|png|jpg|jpeg|svg|gif|webp)$/.test(pathname)
  );
}

/**
 * Supabase proxy: refresh session cookies on every request.
 * Redirect unauthenticated users on protected routes. No client-side loading.
 * Follows https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function proxy(req: NextRequest) {
  if (shouldSkip(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const response = NextResponse.next({ request: req });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            if (value) {
              response.cookies.set(name, value, options ?? {});
            } else {
              response.cookies.set(name, "", { ...options, maxAge: 0 });
            }
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const isAuthenticated = !!user;
  const pathname = req.nextUrl.pathname;

  if (pathname.startsWith("/api")) {
    return response;
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL(isAuthenticated ? "/home" : "/login", req.url));
  }

  if (
    isAuthenticated &&
    (pathname === "/login" || pathname === "/register" || pathname === "/forgot-password")
  ) {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  if (!isAuthenticated && !isPublic(pathname)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
